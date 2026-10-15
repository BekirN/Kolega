const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const { parseCloudinaryAssetUrl } = require('../utils/privateCloudinaryRawAsset')
const { FILE_EXTENSIONS } = require('../utils/fileValidation')

const applyChanges = process.argv.includes('--apply')
const CHAT_FOLDER_PREFIX = 'kolega/chat/'
const MATERIAL_FOLDER_PREFIX = 'kolega/materials/'
const normalizeFormat = (format) => format?.toLowerCase() === 'jpeg' ? 'jpg' : format?.toLowerCase()
const getMimeExtension = (mimeType) => FILE_EXTENSIONS[mimeType]?.slice(1)

const getResourceType = (value) => {
  const url = new URL(value)
  const parts = url.pathname.split('/').filter(Boolean)
  return parts[1]
}

const findAsset = async (publicId, resourceType, deliveryType) => {
  try {
    return await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      type: deliveryType,
    })
  } catch (error) {
    if ((error.http_code || error.error?.http_code) === 404) return null
    throw error
  }
}

const getAuthenticatedUrl = (asset, publicId, resourceType, format) => {
  const url = asset.secure_url || cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    ...(resourceType === 'image' && { format }),
    secure: true,
    version: asset.version,
  })
  const parsed = parseCloudinaryAssetUrl(url, resourceType)
  if (parsed.deliveryType !== 'authenticated' || !parsed.format) {
    throw new Error('Converted asset is not an authenticated file')
  }
  return url
}

const main = async () => {
  const [messages, materials] = await Promise.all([
    prisma.message.findMany({
      where: { fileUrl: { not: null } },
      select: { id: true, fileUrl: true, fileType: true, content: true },
    }),
    prisma.material.findMany({
      where: { fileUrl: { not: '' } },
      select: { id: true, fileUrl: true, fileType: true },
    }),
  ])

  const references = new Map()
  const unsupportedReasons = new Map()
  let unsupported = 0
  let alreadyPrivate = 0
  const markUnsupported = (reason) => {
    unsupported++
    unsupportedReasons.set(reason, (unsupportedReasons.get(reason) || 0) + 1)
  }

  const addReference = (kind, row) => {
    try {
      const resourceType = kind === 'message'
        ? (row.fileType === 'image' ? 'image' : 'raw')
        : getResourceType(row.fileUrl)
      if (!['image', 'raw'].includes(resourceType)) {
        markUnsupported('unsupported_resource_type')
        return
      }

      const asset = parseCloudinaryAssetUrl(row.fileUrl, resourceType)
      const allowedPrefix = kind === 'message' ? CHAT_FOLDER_PREFIX : MATERIAL_FOLDER_PREFIX
      const isChatMaterial = kind === 'material' && asset.publicId.startsWith(CHAT_FOLDER_PREFIX)
      if (!asset.publicId.startsWith(allowedPrefix) && !isChatMaterial) {
        markUnsupported('unexpected_asset_folder')
        return
      }
      if (!['upload', 'authenticated'].includes(asset.deliveryType)) {
        markUnsupported('unexpected_delivery_type')
        return
      }
      if (asset.deliveryType === 'authenticated') alreadyPrivate++

      const key = `${resourceType}:${asset.publicId}`
      const reference = references.get(key) || {
        publicId: asset.publicId,
        resourceType,
        format: asset.format,
        inferredFormats: new Set(),
        needsUpdate: false,
        messages: [],
        materials: [],
      }
      if (asset.deliveryType === 'upload') reference.needsUpdate = true
      const inferredFormat = asset.format || getMimeExtension(row.fileType) || path.extname(row.content || '').slice(1).toLowerCase()
      if (inferredFormat) reference.inferredFormats.add(inferredFormat)
      reference[kind === 'message' ? 'messages' : 'materials'].push(row.id)
      references.set(key, reference)
    } catch {
      markUnsupported('invalid_cloudinary_reference')
    }
  }

  for (const message of messages) addReference('message', message)
  for (const material of materials) addReference('material', material)

  const candidates = []
  let alreadyMoved = 0
  const assetFormatSummary = new Map()
  for (const reference of references.values()) {
    if (!reference.needsUpdate) continue
    const sourceAsset = await findAsset(reference.publicId, reference.resourceType, 'upload')
    const inferredFormats = [...reference.inferredFormats].map(normalizeFormat)
    if (inferredFormats.length > 1) {
      markUnsupported('conflicting_file_formats')
      continue
    }
    const format = sourceAsset?.format || reference.format || inferredFormats[0] || 'bin'
    const targetPublicId = reference.resourceType === 'raw' && !path.extname(reference.publicId)
      ? `${reference.publicId}.${format}`
      : reference.publicId
    const privateAsset = await findAsset(targetPublicId, reference.resourceType, 'authenticated')
    if (sourceAsset && privateAsset) {
      markUnsupported('migration_target_collision')
      continue
    }
    const asset = sourceAsset || privateAsset
    if (!asset) {
      markUnsupported('cloudinary_asset_not_found')
      continue
    }
    const formatKey = `${reference.resourceType}:${asset.format || 'no-format'}:${sourceAsset ? 'upload' : 'authenticated'}`
    assetFormatSummary.set(formatKey, (assetFormatSummary.get(formatKey) || 0) + 1)
    if (asset.format && normalizeFormat(asset.format) !== normalizeFormat(format)) {
      markUnsupported('cloudinary_format_mismatch')
      continue
    }
    const maxBytes = reference.resourceType === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024
    if (asset.bytes > maxBytes) {
      markUnsupported('file_exceeds_upload_limit')
      continue
    }
    if (privateAsset) alreadyMoved++
    candidates.push({ ...reference, sourceAsset, privateAsset, targetPublicId, format })
  }

  console.log(`Files ready to migrate: ${candidates.filter((candidate) => candidate.sourceAsset).length}`)
  console.log(`Already authenticated references: ${alreadyPrivate}`)
  console.log(`Previously moved, database update pending: ${alreadyMoved}`)
  console.log(`Unsupported references: ${unsupported}`)
  for (const [reason, count] of unsupportedReasons) console.log(`Unsupported reason (${reason}): ${count}`)
  for (const [format, count] of assetFormatSummary) console.log(`Cloudinary metadata (${format}): ${count}`)
  console.log(`Mode: ${applyChanges ? 'apply' : 'dry run'}`)

  if (unsupported > 0) throw new Error('Resolve unsupported chat/material file references before applying this migration')
  if (!applyChanges) return

  for (const candidate of candidates) {
    let privateAsset = candidate.privateAsset
    if (!privateAsset) {
      try {
        privateAsset = await cloudinary.uploader.rename(candidate.publicId, candidate.targetPublicId, {
          resource_type: candidate.resourceType,
          type: 'upload',
          to_type: 'authenticated',
          invalidate: true,
        })
      } catch (renameError) {
        privateAsset = await findAsset(candidate.publicId, candidate.resourceType, 'authenticated')
        if (!privateAsset) throw renameError
      }
    }

    const authenticatedUrl = getAuthenticatedUrl(privateAsset, candidate.targetPublicId, candidate.resourceType, candidate.format)
    if (candidate.messages.length) {
      await prisma.message.updateMany({
        where: { id: { in: candidate.messages } },
        data: { fileUrl: authenticatedUrl },
      })
    }
    if (candidate.materials.length) {
      await prisma.material.updateMany({
        where: { id: { in: candidate.materials } },
        data: { fileUrl: authenticatedUrl },
      })
    }
    console.log('Migrated one private chat/material file asset.')
  }
}

main()
  .catch((error) => {
    const httpCode = error.http_code || error.error?.http_code
    const status = httpCode ? ` Cloudinary status: ${httpCode}.` : ''
    console.error(`Chat/material file migration failed.${status} Error type: ${error.name || 'Unknown'}. No file URL or asset identifier was logged.`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
