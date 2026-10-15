const isProduction = process.env.NODE_ENV === 'production'

const validateProductionEnv = () => {
  if (!isProduction) return

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLIENT_URL',
    'FRONTEND_URL',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
  ]
  const missing = required.filter((key) => !process.env[key]?.trim())
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)
  }

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (process.env[key].length < 32) {
      throw new Error(`${key} must contain at least 32 characters in production`)
    }
  }

  for (const key of ['CLIENT_URL', 'FRONTEND_URL']) {
    const urls = key === 'CLIENT_URL' ? process.env[key].split(',') : [process.env[key]]
    for (const value of urls) {
      let url
      try {
        url = new URL(value.trim())
      } catch {
        throw new Error(`${key} must contain valid production origins`)
      }
      if (url.protocol !== 'https:' || url.origin !== value.trim()) {
        throw new Error(`${key} must contain HTTPS origins without paths`)
      }
    }
  }
}

module.exports = validateProductionEnv
