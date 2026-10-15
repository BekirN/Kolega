const {
  FILE_EXTENSIONS,
  sanitizeFileName,
  validateUploadedFile,
} = require('../../utils/fileValidation')

describe('Uploaded file validation', () => {
  test('accepts a PDF whose bytes contain a PDF signature', () => {
    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\ncontent'),
    }

    expect(validateUploadedFile(file)).toBeNull()
  })

  test('rejects a file whose bytes do not match its declared MIME type', () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('%PDF-1.7\ncontent'),
    }

    expect(validateUploadedFile(file)).toMatch(/ne odgovara/)
  })

  test('sanitizes Windows paths and control characters from file names', () => {
    expect(sanitizeFileName('C:\\private\\report.pdf\n')).toBe('report.pdf')
  })

  test('only exposes extensions for supported MIME types', () => {
    expect(FILE_EXTENSIONS['application/pdf']).toBe('.pdf')
    expect(FILE_EXTENSIONS['application/x-msdownload']).toBeUndefined()
  })
})
