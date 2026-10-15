const path = require('path')

const FILE_EXTENSIONS = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/zip': '.zip',
}

const isImageMimeType = (mimeType) => mimeType?.startsWith('image/') === true

const matchesFileSignature = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false

  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 1024).includes(Buffer.from('%PDF-', 'ascii'))
  }
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (mimeType === 'image/webp') {
    return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  }
  if (mimeType === 'application/msword' || mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.ms-excel') {
    return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/zip'
  ) {
    return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2])
  }
  if (mimeType === 'text/plain') {
    if (buffer.includes(0)) return false
    return !buffer.toString('utf8').includes('\ufffd')
  }
  return false
}

const validateUploadedFile = (file) => {
  if (!file || !FILE_EXTENSIONS[file.mimetype]) return 'Tip fajla nije podržan'
  if (!matchesFileSignature(file.buffer, file.mimetype)) return 'Sadržaj fajla ne odgovara njegovom tipu'
  return null
}

const sanitizeFileName = (fileName) => {
  const normalizedPath = String(fileName || 'fajl').replace(/\\/g, '/')
  const baseName = path.posix.basename(normalizedPath).replace(/[\u0000-\u001f\u007f]/g, '').trim()
  return (baseName || 'fajl').slice(0, 160)
}

module.exports = {
  FILE_EXTENSIONS,
  isImageMimeType,
  validateUploadedFile,
  sanitizeFileName,
}
