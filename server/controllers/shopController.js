const prisma = require('../prisma/client')

// Dohvati sve oglase
const getItems = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query

    const filters = {
      isAvailable: true,
    }

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
            id: true,
            firstName: true,
            lastName: true,
            faculty: true,
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

// Dohvati jedan oglas
const getItemById = async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            faculty: true,
            email: true,
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

// Kreiraj oglas
const createItem = async (req, res) => {
  try {
    const { title, description, price, condition, category } = req.body

    if (!title || !price || !condition || !category) {
      return res.status(400).json({ message: 'Sva obavezna polja moraju biti popunjena' })
    }

    const item = await prisma.shopItem.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        condition,
        category,
        sellerId: req.user.userId,
      },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    res.status(201).json({ message: 'Oglas kreiran uspješno!', item })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Ažuriraj oglas
const updateItem = async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({
      where: { id: req.params.id }
    })

    if (!item) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (item.sellerId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup ovom oglasu' })
    }

    const updated = await prisma.shopItem.update({
      where: { id: req.params.id },
      data: req.body
    })

    res.json({ message: 'Oglas ažuriran!', item: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Obriši oglas
const deleteItem = async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({
      where: { id: req.params.id }
    })

    if (!item) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (item.sellerId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup ovom oglasu' })
    }

    await prisma.shopItem.delete({ where: { id: req.params.id } })
    res.json({ message: 'Oglas obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Moji oglasi
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

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, getMyItems }