const prisma = require('../prisma/client')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Samo slike su dozvoljene'), false)
  }
})

// ─── Dohvati sve oglase ───────────────────────────────────────────
const getItems = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query

    const filters = { isAvailable: true }

    if (category) filters.category = category
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (minPrice || maxPrice) {
      filters.price = {}
      if (minPrice) filters.price.gte = parseFloat(minPrice)
      if (maxPrice) filters.price.lte = parseFloat(maxPrice)
    }

    const items = await prisma.shopItem.findMany({
      where: filters,
      include: {
        seller: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, profileImage: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── Dohvati jedan oglas ──────────────────────────────────────────
const getItemById = async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, email: true, profileImage: true,
          }
        }
      }
    })

    if (!item) return res.status(404).json({ message: 'Oglas nije pronađen' })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── Kreiraj oglas ────────────────────────────────────────────────
const createItem = async (req, res) => {
  try {
    const { title, description, price, condition, category } = req.body

    if (!title || !price || !condition || !category) {
      return res.status(400).json({ message: 'Sva obavezna polja moraju biti popunjena' })
    }

    // Upload slika na Cloudinary
    let images = []
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'kolega/shop', resource_type: 'image' },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
          )
          stream.end(file.buffer)
        })
      )
      images = await Promise.all(uploadPromises)
    }

    const item = await prisma.shopItem.create({
      data: {
        title,
        description: description || null,
        price: parseFloat(price),
        condition,
        category,
        images,
        sellerId: req.user.userId,
      },
      include: {
        seller: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, profileImage: true,
          }
        }
      }
    })

    res.status(201).json({ message: 'Oglas kreiran uspješno!', item })
  } catch (error) {
    console.error('createItem greška:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── Ažuriraj oglas ───────────────────────────────────────────────
const updateItem = async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({ where: { id: req.params.id } })

    if (!item) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (item.sellerId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup ovom oglasu' })
    }

    const updated = await prisma.shopItem.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : item.price,
      }
    })

    res.json({ message: 'Oglas ažuriran!', item: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── Obriši oglas ─────────────────────────────────────────────────
const deleteItem = async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({ where: { id: req.params.id } })

    if (!item) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (item.sellerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup ovom oglasu' })
    }

    await prisma.shopItem.delete({ where: { id: req.params.id } })
    res.json({ message: 'Oglas obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── Moji oglasi ──────────────────────────────────────────────────
const getMyItems = async (req, res) => {
  try {
    const items = await prisma.shopItem.findMany({
      where: { sellerId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  upload,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
}