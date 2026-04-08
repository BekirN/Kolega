const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Nemate admin pristup' })
  }
  next()
}

module.exports = { isAdmin }