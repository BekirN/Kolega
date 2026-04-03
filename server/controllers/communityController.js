const prisma = require('../prisma/client')
const { createActivity } = require('../utils/activityHelper')
const cloudinary = require('../config/cloudinary')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const getPosts = async (req, res) => {
  try {
    const { category, search } = req.query
    const filters = {}

    if (category) filters.category = category
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const posts = await prisma.communityPost.findMany({
      where: filters,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, faculty: true }
        },
        _count: { select: { comments: true } }
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })

    res.json(posts)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getPostById = async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, faculty: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, faculty: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!post) return res.status(404).json({ message: 'Post nije pronađen' })
    res.json(post)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createPost = async (req, res) => {
  try {
    const { content, category, title } = req.body
    let images = []

    if (!content) {
      return res.status(400).json({ message: 'Sadržaj je obavezan' })
    }

    // Upload slika ako postoje
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'kolega/posts', resource_type: 'image' },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
          )
          stream.end(file.buffer)
        })
      )
      images = await Promise.all(uploadPromises)
    }

    const post = await prisma.communityPost.create({
      data: {
        title: title || null,
        content,
        category: category || 'OSTALO',
        images,
        authorId: req.user.userId,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        },
        _count: { select: { comments: true } }
      }
    })

    res.status(201).json({ message: 'Objavljeno!', post })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deletePost = async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: req.params.id }
    })

    if (!post) return res.status(404).json({ message: 'Post nije pronađen' })
    if (post.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    await prisma.communityPost.delete({ where: { id: req.params.id } })
    res.json({ message: 'Post obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createComment = async (req, res) => {
  try {
    const { content } = req.body
    const { id } = req.params

    if (!content) return res.status(400).json({ message: 'Komentar ne može biti prazan' })

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ message: 'Post nije pronađen' })

    const comment = await prisma.communityComment.create({
      data: { content, postId: id, authorId: req.user.userId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, faculty: true }
        }
      }
    })

    // Aktivnost za autora posta (ako nije sam sebi komentarisao)
    if (post.authorId !== req.user.userId) {
      const commenter = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { firstName: true, lastName: true }
      })

      await createActivity({
        type: 'COMMUNITY_COMMENT',
        message: `${commenter.firstName} ${commenter.lastName} je komentarisao/la tvoj post "${post.title}"`,
        userId: post.authorId,
        actorId: req.user.userId,
        referenceId: post.id,
        link: `/community/${post.id}`,
      })
    }

    res.status(201).json({ message: 'Komentar dodan!', comment })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deleteComment = async (req, res) => {
  try {
    const comment = await prisma.communityComment.findUnique({
      where: { id: req.params.commentId }
    })

    if (!comment) return res.status(404).json({ message: 'Komentar nije pronađen' })
    if (comment.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Nemate pristup' })
    }

    await prisma.communityComment.delete({ where: { id: req.params.commentId } })
    res.json({ message: 'Komentar obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { eventDate: { gte: new Date() } },
      include: { _count: { select: { attendees: true } } },
      orderBy: { eventDate: 'asc' }
    })
    res.json(events)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const createEvent = async (req, res) => {
  try {
    const { title, description, location, isOnline, eventDate, maxAttendees } = req.body

    if (!title || !description || !eventDate) {
      return res.status(400).json({ message: 'Naslov, opis i datum su obavezni' })
    }

    const event = await prisma.event.create({
      data: {
        title, description, location,
        isOnline: isOnline || false,
        eventDate: new Date(eventDate),
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      }
    })

    res.status(201).json({ message: 'Event kreiran!', event })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const attendEvent = async (req, res) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { attendees: true } } }
    })

    if (!event) return res.status(404).json({ message: 'Event nije pronađen' })

    if (event.maxAttendees && event._count.attendees >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event je popunjen' })
    }

    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: req.user.userId } }
    })

    if (existing) {
      await prisma.eventAttendee.delete({
        where: { eventId_userId: { eventId: id, userId: req.user.userId } }
      })
      return res.json({ message: 'Odjavljen sa eventa', attending: false })
    }

    await prisma.eventAttendee.create({
      data: { eventId: id, userId: req.user.userId }
    })

    // Aktivnost za korisnika
    await createActivity({
      type: 'EVENT_REMINDER',
      message: `Uspješno si se prijavio/la na event "${event.title}" 📅`,
      userId: req.user.userId,
      actorId: req.user.userId,
      referenceId: event.id,
      link: `/community`,
    })

    res.json({ message: 'Prijavljen na event!', attending: true })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  getPosts, getPostById, createPost, deletePost,
  createComment, deleteComment,
  getEvents, createEvent, attendEvent,
  upload
}