const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const multer = require('multer')
const { createActivity } = require('../utils/activityHelper')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Samo slike su dozvoljene'), false)
  }
})

const getListings = async (req, res) => {
  try {
    const {
      type, city, minPrice, maxPrice,
      furnished, lookingForRoommate, search
    } = req.query

    const filters = { isActive: true }

    if (type) filters.type = type
    if (city) filters.city = { contains: city, mode: 'insensitive' }
    if (furnished === 'true') filters.furnished = true
    if (lookingForRoommate === 'true') filters.lookingForRoommate = true
    if (minPrice || maxPrice) {
      filters.price = {}
      if (minPrice) filters.price.gte = parseFloat(minPrice)
      if (maxPrice) filters.price.lte = parseFloat(maxPrice)
    }
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { municipality: { contains: search, mode: 'insensitive' } },
      ]
    }

    const listings = await prisma.housingListing.findMany({
      where: filters,
      include: {
        owner: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, university: true, profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(listings)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getListingById = async (req, res) => {
  try {
    const listing = await prisma.housingListing.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true, firstName: true, lastName: true,
            faculty: true, university: true,
            profileImage: true, email: true
          }
        }
      }
    })

    if (!listing) return res.status(404).json({ message: 'Oglas nije pronađen' })
    res.json(listing)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createListing = async (req, res) => {
  try {
    const {
      title, description, price, type, city, municipality,
      address, roomCount, bathroomCount, squareMeters,
      furnished, utilitiesIncluded, contactPhone, contactEmail,
      lookingForRoommate, roommateSpots
    } = req.body

    if (!title || !description || !price || !type || !city) {
      return res.status(400).json({ message: 'Naslov, opis, cijena, tip i grad su obavezni' })
    }

    // Upload slika
    let images = []
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'kolega/housing', resource_type: 'image' },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
          )
          stream.end(file.buffer)
        })
      )
      images = await Promise.all(uploadPromises)
    }

    const listing = await prisma.housingListing.create({
      data: {
        title, description,
        price: parseFloat(price),
        type, city,
        municipality: municipality || null,
        address: address || null,
        roomCount: roomCount ? parseInt(roomCount) : null,
        bathroomCount: bathroomCount ? parseInt(bathroomCount) : null,
        squareMeters: squareMeters ? parseFloat(squareMeters) : null,
        furnished: furnished === 'true' || furnished === true,
        utilitiesIncluded: utilitiesIncluded === 'true' || utilitiesIncluded === true,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        lookingForRoommate: lookingForRoommate === 'true' || lookingForRoommate === true,
        roommateSpots: roommateSpots ? parseInt(roommateSpots) : null,
        images,
        ownerId: req.user.userId,
      },
      include: {
        owner: {
          select: {
            id: true, firstName: true, lastName: true, faculty: true, profileImage: true
          }
        }
      }
    })

    res.status(201).json({ message: 'Oglas objavljen!', listing })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const updateListing = async (req, res) => {
  try {
    const listing = await prisma.housingListing.findUnique({ where: { id: req.params.id } })
    if (!listing) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (listing.ownerId !== req.user.userId) return res.status(403).json({ message: 'Nemate pristup' })

    const updated = await prisma.housingListing.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : listing.price,
        roomCount: req.body.roomCount ? parseInt(req.body.roomCount) : listing.roomCount,
        squareMeters: req.body.squareMeters ? parseFloat(req.body.squareMeters) : listing.squareMeters,
        furnished: req.body.furnished !== undefined
          ? req.body.furnished === 'true' || req.body.furnished === true
          : listing.furnished,
        isActive: req.body.isActive !== undefined
          ? req.body.isActive === 'true' || req.body.isActive === true
          : listing.isActive,
      }
    })

    res.json({ message: 'Oglas ažuriran!', listing: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deleteListing = async (req, res) => {
  try {
    const listing = await prisma.housingListing.findUnique({ where: { id: req.params.id } })
    if (!listing) return res.status(404).json({ message: 'Oglas nije pronađen' })
    if (listing.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    await prisma.housingListing.delete({ where: { id: req.params.id } })
    res.json({ message: 'Oglas obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getMyListings = async (req, res) => {
  try {
    const listings = await prisma.housingListing.findMany({
      where: { ownerId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(listings)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  upload,
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
}