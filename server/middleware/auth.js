const jwt = require('jsonwebtoken')
const prisma = require('../prisma/client')

const authenticateToken = (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Niste prijavljeni' })
      return false
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded.userId) {
      res.status(401).json({ message: 'Token nije validan' })
      return false
    }
    req.user = decoded
    return true
  } catch (error) {
    res.status(401).json({ message: 'Token nije validan' })
    return false
  }
}

const authenticate = (req, res, next) => {
  if (authenticateToken(req, res)) next()
}

const protect = async (req, res, next) => {
  if (!authenticateToken(req, res)) return

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { emailVerified: true, deletedAt: true }
    })

    if (!user || user.deletedAt) {
      return res.status(401).json({ message: 'Korisnik nije validan' })
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verifikuj email adresu za nastavak.'
      })
    }

    next()
  } catch (error) {
    return res.status(500).json({ message: 'Greška na serveru' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Nemate pristup' })
  }
  next()
}

module.exports = { protect, authenticate, adminOnly }
