const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()
require('./config/validateProductionEnv')()
const prisma = require('./prisma/client')
const activityRoutes = require('./routes/activities')
const jobRoutes = require('./routes/jobs')
const authRoutes = require('./routes/auth')
const shopRoutes = require('./routes/shop')
const companyRoutes = require('./routes/companies')
const tutoringRoutes = require('./routes/tutoring')
const communityRoutes = require('./routes/community')
const chatRoutes = require('./routes/chat')
const materialRoutes = require('./routes/materials')
const housingRoutes = require('./routes/housing')
const adminRoutes = require('./routes/admin')
const internshipRoutes = require('./routes/internships')
const rateLimit = require('express-rate-limit')
const { parseCloudinaryAssetUrl } = require('./utils/privateCloudinaryRawAsset')
const { FILE_EXTENSIONS, isImageMimeType, sanitizeFileName } = require('./utils/fileValidation')
const { hideUnavailableMessageFile } = require('./controllers/chatController')
const app = express()
app.use(require('helmet')())
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY)
else if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

const server = http.createServer(app)

const connectionRoutes = require('./routes/connections')

// Dozvoljeni origini: CLIENT_URL moze biti lista odvojena zarezom
// (npr. "http://localhost:5173,http://localhost:4173,https://kolega.app")
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .map((origin) => {
    try {
      return new URL(origin).origin
    } catch {
      return origin
    }
  })
  .filter(Boolean)

const corsOrigin = (origin, callback) => {
  // dozvoli zahtjeve bez origin-a (npr. mobilne aplikacije, curl) i one sa liste
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
  return callback(new Error('CORS: origin nije dozvoljen'))
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

app.use(cors({ origin: corsOrigin }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Previše pokušaja prijave. Pokušaj ponovo za 15 minuta.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Previše zahtjeva. Pokušaj ponovo za minutu.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

const chatUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Previše upload pokušaja. Pokušaj ponovo za 15 minuta.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

const materialUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Previše upload pokušaja. Pokušaj ponovo kasnije.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/resend-verification', authLimiter)
app.use('/api/chat/upload', chatUploadLimiter)
app.use('/api/materials/upload', materialUploadLimiter)
app.use('/api', apiLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/tutoring', tutoringRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/connections', connectionRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/housing', housingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/internships', internshipRoutes)
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.name === 'MulterError') {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    return res.status(status).json({ message: status === 413 ? 'Fajl je prevelik' : 'Upload nije validan' })
  }
  if (error.status === 400 && error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Zahtjev nije validan' })
  }
  if (error.message === 'CORS: origin nije dozvoljen') {
    return res.status(403).json({ message: 'Origin nije dozvoljen' })
  }
  console.error('Unhandled request error:', error.name)
  return res.status(500).json({ message: 'Greška na serveru' })
})
// Socket.io logic
const jwt = require('jsonwebtoken')

// Socket auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Autentikacija potrebna'))

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    return next(new Error('Token nije validan'))
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { emailVerified: true, deletedAt: true }
    })

    if (!user || user.deletedAt) {
      return next(new Error('Token nije validan'))
    }
    if (!user.emailVerified) {
      return next(new Error('Email nije verifikovan'))
    }

    socket.user = decoded
    next()
  } catch (err) {
    next(new Error('Autentikacija nije dostupna'))
  }
})

io.on('connection', (socket) => {
  console.log(`Korisnik spojen: ${socket.user.userId}`)

  const ownUserRoom = `user_${socket.user.userId}`
  socket.join(ownUserRoom)
  console.log(`Korisnik ${socket.user.userId} auto-join: ${ownUserRoom}`)

  socket.on('join_conversation', async (conversationId) => {
    if (typeof conversationId !== 'string' || conversationId.length > 128) {
      socket.emit('error', { message: 'Konverzacija nije validna' })
      return
    }

    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: socket.user.userId,
          }
        }
      })

      if (!participant) {
        socket.emit('error', { message: 'Nemate pristup ovoj konverzaciji' })
        return
      }

      socket.join(conversationId)
    } catch (error) {
      console.error('Socket membership check failed:', error.name)
      socket.emit('error', { message: 'Pristup konverzaciji nije dostupan' })
    }
  })

  socket.on('leave_conversation', (conversationId) => {
    if (typeof conversationId === 'string' && conversationId.length <= 128) {
      socket.leave(conversationId)
    }
  })

  socket.on('send_message', async (data) => {
    try {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        socket.emit('error', { message: 'Poruka nije validna' })
        return
      }

      const { conversationId, content, fileUrl, fileType, fileMimeType } = data
      if (typeof conversationId !== 'string' || conversationId.length > 128) {
        socket.emit('error', { message: 'Konverzacija nije validna' })
        return
      }
      if (typeof content !== 'string' || content.length > 5000) {
        socket.emit('error', { message: 'Tekst poruke nije validan' })
        return
      }

      const hasFile = fileUrl !== undefined && fileUrl !== null && fileUrl !== ''
      let storedContent = content
      if (hasFile) {
        if (
          typeof fileUrl !== 'string' || fileUrl.length > 2048 ||
          !['image', 'file'].includes(fileType) ||
          !FILE_EXTENSIONS[fileMimeType] ||
          (fileType === 'image') !== isImageMimeType(fileMimeType)
        ) {
          socket.emit('error', { message: 'Prilog nije validan' })
          return
        }

        let asset
        try {
          asset = parseCloudinaryAssetUrl(fileUrl, fileType === 'image' ? 'image' : 'raw')
        } catch {
          socket.emit('error', { message: 'Prilog nije validan' })
          return
        }
        const expectedFolder = `kolega/chat/${socket.user.userId}/`
        if (asset.deliveryType !== 'authenticated' || !asset.format || !asset.publicId.startsWith(expectedFolder)) {
          socket.emit('error', { message: 'Prilog nije validan' })
          return
        }
        storedContent = sanitizeFileName(content)
      } else if (fileType || fileMimeType || !content.trim()) {
        socket.emit('error', { message: 'Poruka nije validna' })
        return
      }

      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: socket.user.userId
          }
        }
      })

      if (!participant) {
        socket.emit('error', { message: 'Nemate pristup ovoj konverzaciji' })
        return
      }

      const message = await prisma.message.create({
        data: {
          content: storedContent,
          fileUrl: hasFile ? fileUrl : null,
          fileType: fileType || null,
          fileMimeType: hasFile ? fileMimeType : null,
          conversationId,
          senderId: socket.user.userId,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, profileImage: true }
          },
          conversation: {
            select: { id: true, isGroup: true, name: true }
          }
        }
      })

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true }
      })

      participants.forEach(({ userId }) => {
        io.to(`user_${userId}`).emit('new_message', hideUnavailableMessageFile(message))
      })
    } catch (error) {
      console.error('Socket message failed:', error.name)
      socket.emit('error', { message: 'Greska pri slanju poruke' })
    }
  })

  // Re-register own user room (idempotent)
  socket.on('register_user', () => {
    socket.join(ownUserRoom)
    console.log(`Korisnik ${socket.user.userId} registrovan za notifikacije`)
  })

  socket.on('typing', (conversationId) => {
    if (typeof conversationId === 'string' && socket.rooms.has(conversationId)) {
      socket.to(conversationId).emit('user_typing', { userId: socket.user.userId })
    }
  })

  socket.on('stop_typing', (conversationId) => {
    if (typeof conversationId === 'string' && socket.rooms.has(conversationId)) {
      socket.to(conversationId).emit('user_stop_typing', { userId: socket.user.userId })
    }
  })

  socket.on('disconnect', () => {
    console.log(`Korisnik odspojen: ${socket.user.userId}`)
  })
})

app.get('/', async (req, res) => {
  try {
    await prisma.$connect()
    res.json({ message: 'KOLEGA API radi! Baza povezana!' })
  } catch (error) {
    res.status(503).json({ message: 'Servis trenutno nije dostupan' })
  }
})

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta nije pronađena' })
})

const PORT = process.env.PORT || 5000
// Ne pokreći server (ni ne zauzimaj port) kada se modul samo importuje u testovima
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`)
  })
}

module.exports = { app, server, io }
