const path = require('path')
const cloudinary = require('../config/cloudinary')

const parseCloudinaryAssetUrl = (value, expectedResourceType) => {
  let assetUrl
  try {
    assetUrl = new URL(value)
  } catch (error) {
    throw new Error('Neispravan URL dokumenta')
  }

  const parts = assetUrl.pathname.split('/').filter(Boolean)
  const cloudName = cloudinary.config().cloud_name
  const [urlCloudName, resourceType, deliveryType] = parts

  if (
    assetUrl.protocol !== 'https:' ||
    assetUrl.hostname !== 'res.cloudinary.com' ||
    urlCloudName !== cloudName ||
    resourceType !== expectedResourceType ||
    !['upload', 'authenticated'].includes(deliveryType)
  ) {
    throw new Error('URL dokumenta nije sa očekivanog Cloudinary naloga')
  }

  const publicIdParts = parts.slice(3)
  if (/^s--[A-Za-z0-9_-]+--$/.test(publicIdParts[0] || '')) publicIdParts.shift()
  if (/^v\d+$/.test(publicIdParts[0] || '')) publicIdParts.shift()

  const urlPublicId = publicIdParts.map(decodeURIComponent).join('/')
  const format = path.extname(urlPublicId).slice(1).toLowerCase()
  const publicId = resourceType === 'image' && format
    ? urlPublicId.slice(0, -(format.length + 1))
    : urlPublicId
  if (!publicId) throw new Error('Nedostaje identifikator dokumenta')

  return { publicId, format, deliveryType, resourceType }
}

const parseCloudinaryRawAssetUrl = (value) => parseCloudinaryAssetUrl(value, 'raw')
const parseCloudinaryImageAssetUrl = (value) => parseCloudinaryAssetUrl(value, 'image')

const createPrivateRawDownloadUrl = (asset, expiresAt) =>
  cloudinary.utils.private_download_url(asset.publicId, asset.format, {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: expiresAt,
    attachment: true,
  })

const createPrivateImageDownloadUrl = (asset, expiresAt) =>
  cloudinary.utils.private_download_url(asset.publicId, asset.format, {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: expiresAt,
    attachment: false,
  })

const createPrivateAssetDownloadUrl = (asset, expiresAt) =>
  asset.resourceType === 'image'
    ? createPrivateImageDownloadUrl(asset, expiresAt)
    : createPrivateRawDownloadUrl(asset, expiresAt)

module.exports = {
  parseCloudinaryAssetUrl,
  parseCloudinaryRawAssetUrl,
  parseCloudinaryImageAssetUrl,
  createPrivateRawDownloadUrl,
  createPrivateImageDownloadUrl,
  createPrivateAssetDownloadUrl,
}
