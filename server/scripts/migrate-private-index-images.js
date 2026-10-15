const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const { parseCloudinaryImageAssetUrl } = require('../utils/privateCloudinaryRawAsset')

const applyChanges = process.argv.includes('--apply')
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_FOLDER_PREFIX = 'kolega/index-verification/'

const findImageAsset = async (publicId, type) => {
  try {
    return await cloudinary.api.resource(publicId, { resource_type: 'image', type })
  } catch (error) {
    if ((error.http_code || error.error?.http_code) === 404) return null
    throw error
  }
}

const getPrivateUrl = (asset, publicId) => {
  const url = asset.secure_url || cloudinary.url(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    format: asset.format,
    secure: true,
    version: asset.version,
  })

  const parsed = parseCloudinaryImageAssetUrl(url)
  if (parsed.deliveryType !== 'authenticated' || !parsed.format) {
    throw new Error('Migrated index image URL did not resolve to an authenticated image')
  }
  return url
}

const main = async () => {
  const users = await prisma.user.findMany({
    where: { indexImage: { not: null } },
    select: { id: true, indexImage: true },
  })

  const referencesByPublicId = new Map()
  let alreadyPrivate = 0
  let unsupported = 0
  const unsupportedReasons = new Map()
  const markUnsupported = (reason) => {
    unsupported++
    unsupportedReasons.set(reason, (unsupportedReasons.get(reason) || 0) + 1)
  }

  for (const user of users) {
    try {
      const asset = parseCloudinaryImageAssetUrl(user.indexImage)
      if (asset.deliveryType === 'authenticated' && asset.format) {
        alreadyPrivate++
        continue
      }
      if (asset.deliveryType !== 'upload') {
        markUnsupported('unexpected_delivery_type')
        continue
      }
      if (!asset.publicId.startsWith(IMAGE_FOLDER_PREFIX)) {
        markUnsupported('unexpected_public_id_prefix')
        continue
      }
      if (!asset.format) {
        markUnsupported('missing_image_format')
        continue
      }

      const references = referencesByPublicId.get(asset.publicId) || { userIds: [], format: asset.format }
      references.userIds.push(user.id)
      referencesByPublicId.set(asset.publicId, references)
    } catch (error) {
      markUnsupported(error.message || 'invalid_reference')
    }
  }

  const candidates = new Map()
  let alreadyMoved = 0
  for (const [publicId, references] of referencesByPublicId) {
    const [sourceAsset, targetAsset] = await Promise.all([
      findImageAsset(publicId, 'upload'),
      findImageAsset(publicId, 'authenticated'),
    ])

    if (sourceAsset && targetAsset) {
      markUnsupported('migration_target_collision')
      continue
    }
    if (sourceAsset) {
      if (sourceAsset.bytes > MAX_IMAGE_BYTES) {
        markUnsupported('file_exceeds_upload_limit')
        continue
      }
      if (!sourceAsset.format || sourceAsset.format.toLowerCase() !== references.format) {
        markUnsupported('cloudinary_format_mismatch')
        continue
      }
      candidates.set(publicId, { userIds: references.userIds, sourceAsset })
      continue
    }
    if (targetAsset) {
      alreadyMoved++
      candidates.set(publicId, { userIds: references.userIds, targetAsset })
      continue
    }
    markUnsupported('cloudinary_asset_not_found')
  }

  console.log(`Index images ready to migrate: ${[...candidates.values()].filter((asset) => asset.sourceAsset).length}`)
  console.log(`Already authenticated: ${alreadyPrivate}`)
  console.log(`Previously moved, database update pending: ${alreadyMoved}`)
  console.log(`Unsupported references: ${unsupported}`)
  for (const [reason, count] of unsupportedReasons) {
    console.log(`Unsupported reason (${reason}): ${count}`)
  }
  console.log(`Mode: ${applyChanges ? 'apply' : 'dry run'}`)

  if (unsupported > 0) {
    throw new Error('Resolve unsupported index image references before applying this migration')
  }
  if (!applyChanges) return

  for (const [publicId, candidate] of candidates) {
    let privateAsset = candidate.targetAsset
    if (!privateAsset) {
      try {
        privateAsset = await cloudinary.uploader.rename(publicId, publicId, {
          resource_type: 'image',
          type: 'upload',
          to_type: 'authenticated',
          invalidate: true,
        })
      } catch (renameError) {
        privateAsset = await findImageAsset(publicId, 'authenticated')
        if (!privateAsset) throw renameError
      }
    }

    const authenticatedUrl = getPrivateUrl(privateAsset, publicId)
    await prisma.user.updateMany({
      where: { id: { in: candidate.userIds } },
      data: { indexImage: authenticatedUrl },
    })
    console.log(`Migrated one Cloudinary image referenced by ${candidate.userIds.length} user(s).`)
  }
}

main()
  .catch((error) => {
    const httpCode = error.http_code || error.error?.http_code
    const status = httpCode ? ` Cloudinary status: ${httpCode}.` : ''
    console.error(`Index image migration failed.${status} No image URL or asset ID was logged.`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
