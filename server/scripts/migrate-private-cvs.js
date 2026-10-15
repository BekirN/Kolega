const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const { parseCloudinaryRawAssetUrl } = require('../utils/privateCloudinaryRawAsset')

const applyChanges = process.argv.includes('--apply')
const MAX_CV_BYTES = 5 * 1024 * 1024
const CV_FOLDER_PREFIX = 'kolega/cvs/'
const PDF_HEADER = Buffer.from('%PDF-', 'ascii')

const findRawAsset = async (publicId, type) => {
  try {
    return await cloudinary.api.resource(publicId, { resource_type: 'raw', type })
  } catch (error) {
    if ((error.http_code || error.error?.http_code) === 404) return null
    throw error
  }
}

const hasPdfHeader = async (url) => {
  const response = await fetch(url, { headers: { Range: 'bytes=0-1023' } })
  if (!response.ok || !response.body) throw new Error('CV source could not be read')

  const reader = response.body.getReader()
  const chunks = []
  let bytesRead = 0
  let finished = false

  try {
    while (bytesRead < 1024 && !finished) {
      const { value, done } = await reader.read()
      finished = done
      if (value) {
        const chunk = Buffer.from(value).subarray(0, 1024 - bytesRead)
        chunks.push(chunk)
        bytesRead += chunk.length
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  return Buffer.concat(chunks).indexOf(PDF_HEADER) !== -1
}

const getPrivateUrl = (asset, publicId) => {
  const url = asset.secure_url || cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    secure: true,
    version: asset.version,
  })

  const parsed = parseCloudinaryRawAssetUrl(url)
  if (parsed.deliveryType !== 'authenticated' || parsed.format !== 'pdf') {
    throw new Error('Migrated CV URL did not resolve to an authenticated PDF')
  }
  return url
}

const main = async () => {
  const applications = await prisma.internshipApplication.findMany({
    where: { cvUrl: { not: null } },
    select: { id: true, cvUrl: true },
  })

  const referencesByPublicId = new Map()
  let alreadyPrivate = 0
  let unsupported = 0
  const unsupportedReasons = new Map()

  const markUnsupported = (reason) => {
    unsupported++
    unsupportedReasons.set(reason, (unsupportedReasons.get(reason) || 0) + 1)
  }

  for (const application of applications) {
    try {
      const asset = parseCloudinaryRawAssetUrl(application.cvUrl)
      if (asset.deliveryType === 'authenticated' && asset.format === 'pdf') {
        alreadyPrivate++
        continue
      }

      if (asset.deliveryType !== 'upload') {
        markUnsupported('unexpected_delivery_type')
        continue
      }
      if (!asset.publicId.startsWith(CV_FOLDER_PREFIX)) {
        markUnsupported('unexpected_public_id_prefix')
        continue
      }
      if (asset.format && asset.format !== 'pdf') {
        markUnsupported('unsupported_file_format')
        continue
      }

      const references = referencesByPublicId.get(asset.publicId) || []
      references.push(application.id)
      referencesByPublicId.set(asset.publicId, references)
    } catch (error) {
      markUnsupported(error.message || 'invalid_reference')
    }
  }

  const candidates = new Map()
  let alreadyMoved = 0
  for (const [publicId, applicationIds] of referencesByPublicId) {
    const targetPublicId = publicId.toLowerCase().endsWith('.pdf') ? publicId : `${publicId}.pdf`
    const [sourceAsset, targetAsset] = await Promise.all([
      findRawAsset(publicId, 'upload'),
      findRawAsset(targetPublicId, 'authenticated'),
    ])

    if (sourceAsset && targetAsset) {
      markUnsupported('migration_target_collision')
      continue
    }

    if (sourceAsset) {
      if (sourceAsset.bytes > MAX_CV_BYTES) {
        markUnsupported('file_exceeds_upload_limit')
        continue
      }
      if (sourceAsset.format && sourceAsset.format.toLowerCase() !== 'pdf') {
        markUnsupported('unsupported_cloudinary_format')
        continue
      }
      if (!sourceAsset.secure_url) {
        markUnsupported('missing_source_url')
        continue
      }
      candidates.set(publicId, { applicationIds, sourceAsset, targetPublicId })
      continue
    }

    if (targetAsset) {
      alreadyMoved++
      candidates.set(publicId, { applicationIds, targetAsset, targetPublicId })
      continue
    }

    markUnsupported('cloudinary_asset_not_found')
  }

  if (applyChanges) {
    for (const candidate of candidates.values()) {
      if (!candidate.sourceAsset) continue
      if (!(await hasPdfHeader(candidate.sourceAsset.secure_url))) {
        markUnsupported('source_is_not_a_pdf')
      }
    }
  }

  console.log(`CV assets ready to migrate: ${[...candidates.values()].filter((asset) => asset.sourceAsset).length}`)
  console.log(`Already authenticated: ${alreadyPrivate}`)
  console.log(`Previously moved, database update pending: ${alreadyMoved}`)
  console.log(`Unsupported references: ${unsupported}`)
  for (const [reason, count] of unsupportedReasons) {
    console.log(`Unsupported reason (${reason}): ${count}`)
  }
  console.log(`Mode: ${applyChanges ? 'apply' : 'dry run'}`)

  if (unsupported > 0) {
    throw new Error('Resolve unsupported CV references before applying this migration')
  }
  if (!applyChanges) return

  for (const [publicId, candidate] of candidates) {
    let privateAsset = candidate.targetAsset
    if (!privateAsset) {
      try {
        privateAsset = await cloudinary.uploader.rename(publicId, candidate.targetPublicId, {
          resource_type: 'raw',
          type: 'upload',
          to_type: 'authenticated',
          invalidate: true,
        })
      } catch (renameError) {
        privateAsset = await findRawAsset(candidate.targetPublicId, 'authenticated')
        if (!privateAsset) throw renameError
      }
    }

    const authenticatedUrl = getPrivateUrl(privateAsset, candidate.targetPublicId)
    await prisma.internshipApplication.updateMany({
      where: { id: { in: candidate.applicationIds } },
      data: { cvUrl: authenticatedUrl },
    })
    console.log(`Migrated one Cloudinary asset referenced by ${candidate.applicationIds.length} application(s).`)
  }
}

main()
  .catch((error) => {
    const httpCode = error.http_code || error.error?.http_code
    const status = httpCode ? ` Cloudinary status: ${httpCode}.` : ''
    console.error(`CV migration failed.${status} No CV URL or asset ID was logged.`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
