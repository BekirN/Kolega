const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = require('../prisma/client')
const { parseCloudinaryAssetUrl, createPrivateAssetDownloadUrl } = require('../utils/privateCloudinaryRawAsset')

const getResourceType = (value, fallback) => {
  if (fallback) return fallback === 'image' ? 'image' : 'raw'
  const url = new URL(value)
  return url.pathname.split('/').filter(Boolean)[1]
}

const verifyAsset = async (url, resourceType) => {
  const asset = parseCloudinaryAssetUrl(url, resourceType)
  if (asset.deliveryType !== 'authenticated' || !asset.format) return false

  const signedUrl = createPrivateAssetDownloadUrl(asset, Math.floor(Date.now() / 1000) + 120)
  const response = await fetch(signedUrl, { headers: { Range: 'bytes=0-31' } })
  if (!response.ok || !response.body) return false

  const reader = response.body.getReader()
  try {
    await reader.read()
  } finally {
    await reader.cancel().catch(() => {})
  }
  return true
}

const main = async () => {
  const [messages, materials] = await Promise.all([
    prisma.message.findMany({
      where: { fileUrl: { not: null } },
      select: { fileUrl: true, fileType: true },
    }),
    prisma.material.findMany({
      where: { fileUrl: { not: '' } },
      select: { fileUrl: true },
    }),
  ])

  let checkedMessages = 0
  let checkedMaterials = 0
  let failed = 0
  for (const message of messages) {
    try {
      if (await verifyAsset(message.fileUrl, getResourceType(message.fileUrl, message.fileType))) checkedMessages++
      else failed++
    } catch {
      failed++
    }
  }
  for (const material of materials) {
    try {
      if (await verifyAsset(material.fileUrl, getResourceType(material.fileUrl))) checkedMaterials++
      else failed++
    } catch {
      failed++
    }
  }

  console.log(`Chat file links verified: ${checkedMessages}`)
  console.log(`Material file links verified: ${checkedMaterials}`)
  console.log(`Failed links: ${failed}`)
  if (failed > 0) throw new Error('One or more private download links failed verification')
}

main()
  .catch((error) => {
    const httpCode = error.http_code || error.error?.http_code
    const status = httpCode ? ` Cloudinary status: ${httpCode}.` : ''
    console.error(`Private chat/material verification failed.${status} Error type: ${error.name || 'Unknown'}. No file URL was logged.`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
