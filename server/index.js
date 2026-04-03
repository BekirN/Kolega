const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const prisma = require('./prisma/client')
require('dotenv').config()
const activityRoutes = require('./routes/activities')
const jobRoutes = require('./routes/jobs')
const authRoutes = require('./routes/auth')
const shopRoutes = require('./routes/shop')
const companyRoutes = require('./routes/companies')
const tutoringRoutes = require('./routes/tutoring')
const communityRoutes = require('./routes/community')
const chatRoutes = require('./routes/chat')

const app = express()
const server = http.createServer(app)

const connectionRoutes = require('./routes/connections')

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/tutoring', tutoringRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/connections', connectionRoutes)
app.use('/api/activities', activityRoutes)
// Socket.io logic
const jwt = require('jsonwebtoken')

// Socket auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Autentikacija potrebna'))

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = decoded
    next()
  } catch (err) {
    next(new Error('Token nije validan'))
  }
})

io.on('connection', (socket) => {
  console.log(`Korisnik spojen: ${socket.user.userId}`)

  const ownUserRoom = `user_${socket.user.userId}`
  socket.join(ownUserRoom)
  console.log(`Korisnik ${socket.user.userId} auto-join: ${ownUserRoom}`)

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId)
  })

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId)
  })

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, fileUrl, fileType } = data

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
          content,
          fileUrl: fileUrl || null,
          fileType: fileType || null,
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
        io.to(`user_${userId}`).emit('new_message', message)
      })
    } catch (error) {
      console.error('Socket greska:', error)
      socket.emit('error', { message: 'Greska pri slanju poruke' })
    }
  })

  // Notification when user is added to group
  socket.on('join_group', async (data) => {
    try {
      const { conversationId, addedUserId, groupName } = data
      io.to(`user_${addedUserId}`).emit('added_to_group', {
        conversationId,
        groupName,
        addedBy: socket.user.userId
      })
    } catch (error) {
      console.error('Group join greska:', error)
    }
  })

  // Re-register own user room (idempotent)
  socket.on('register_user', () => {
    socket.join(ownUserRoom)
    console.log(`Korisnik ${socket.user.userId} registrovan za notifikacije`)
  })

  socket.on('typing', (conversationId) => {
    socket.to(conversationId).emit('user_typing', { userId: socket.user.userId })
  })

  socket.on('stop_typing', (conversationId) => {
    socket.to(conversationId).emit('user_stop_typing', { userId: socket.user.userId })
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
    res.status(500).json({ message: 'Greska pri konekciji na bazu', error })
  }
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`)
})

module.exports = { io }
