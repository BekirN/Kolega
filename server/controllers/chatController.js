const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')
const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
})

// Dohvati sve konverzacije korisnika
const getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: req.user.userId } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } }
          }
        },
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Dohvati lastReadAt za svaku konverzaciju
    const readReceipts = await prisma.conversationRead.findMany({
      where: { userId: req.user.userId }
    })

    const readMap = {}
    readReceipts.forEach(r => {
      readMap[r.conversationId] = r.lastReadAt
    })

    // Izračunaj unread count
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const lastReadAt = readMap[conv.id]
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: req.user.userId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {})
          }
        })
        return { ...conv, unreadCount }
      })
    )

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.userId

    if (userId === currentUserId) {
      return res.status(403).json({ message: 'Ne možete chatovati sami sa sobom' })
    }

    // ─── Provjeri da li mogu chatovati ───────────────────────────
    const canChat = await checkCanChat(currentUserId, userId)
    if (!canChat) {
      return res.status(403).json({
        message: 'Morate biti povezani da biste chatovali',
        code: 'NOT_CONNECTED'
      })
    }

    // Provjeri da li postoji konverzacija
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId } } },
        ]
      },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true, faculty: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    })

    if (existing) return res.json(existing)

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: currentUserId }, { userId }]
        }
      },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true, faculty: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    })

    res.json(conversation)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── Helper: provjeri da li dva korisnika mogu chatovati ──────────
const checkCanChat = async (userAId, userBId) => {
  // 1. Jesu li već Kolege (connected)
  const connection = await prisma.connection.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ]
    }
  })
  if (connection) return true

  // 2. Jedan je HR firme, drugi je aplicirao na njihovu praksu
  const internshipConnection = await prisma.internshipApplication.findFirst({
    where: {
      OR: [
        // UserA je applicant, UserB je HR firme
        {
          applicantId: userAId,
          internship: {
            company: {
              members: { some: { userId: userBId } }
            }
          }
        },
        // UserB je applicant, UserA je HR firme
        {
          applicantId: userBId,
          internship: {
            company: {
              members: { some: { userId: userAId } }
            }
          }
        },
      ]
    }
  })
  if (internshipConnection) return true

  // 3. Jedan prodaje predmet, drugi je vlasnik (Shop kontekst)
  const shopConnection = await prisma.shopItem.findFirst({
    where: {
      OR: [
        { sellerId: userAId },
        { sellerId: userBId },
      ],
      isAvailable: true,
    }
  })
  // Shop je otvoreni kontekst – dozvoli svima
  if (shopConnection) return true

  return false
}

// Dohvati poruke konverzacije
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: req.user.userId }
      }
    })

    if (!participant) return res.status(403).json({ message: 'Nemate pristup' })

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Označi kao pročitano
    await prisma.conversationRead.upsert({
      where: {
        conversationId_userId: { conversationId, userId: req.user.userId }
      },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId: req.user.userId }
    })

    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Upload fajla
const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fajl nije uploadovan' })

    console.log('Upload pokušaj:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    })

    const fileBuffer = req.file.buffer
    const mimeType = req.file.mimetype
    const isImage = mimeType.startsWith('image/')

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: isImage ? 'image' : 'raw',
          folder: 'kolega/chat',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary greška:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      )
      uploadStream.end(fileBuffer)
    })

    res.json({
      fileUrl: result.secure_url,
      fileType: isImage ? 'image' : 'file',
      fileName: req.file.originalname,
    })
  } catch (error) {
    console.error('Upload greška detalji:', error)
    res.status(500).json({ message: 'Greška pri uploadu', error: error.message })
  }
}

// Kreiraj grupni chat
const createGroupChat = async (req, res) => {
  try {
    const { name, memberIds } = req.body

    if (!name || !memberIds || memberIds.length < 2) {
      return res.status(400).json({ message: 'Naziv i minimalno 2 člana su obavezni' })
    }

    const allMembers = [...new Set([req.user.userId, ...memberIds])]

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name,
        adminId: req.user.userId,
        participants: {
          create: allMembers.map(userId => ({ userId }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
            }
          }
        },
        messages: true
      }
    })

    const creator = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { firstName: true, lastName: true }
    })

    const { io } = require('../index')
    memberIds.forEach(userId => {
      io.to(`user_${userId}`).emit('added_to_group', {
        conversationId: conversation.id,
        groupName: name,
        addedByName: `${creator.firstName} ${creator.lastName}`
      })
    })

    res.status(201).json(conversation)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Dohvati media fajlove konverzacije
const getConversationMedia = async (req, res) => {
  try {
    const { conversationId } = req.params

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: req.user.userId }
      }
    })

    if (!participant) return res.status(403).json({ message: 'Nemate pristup' })

    const media = await prisma.message.findMany({
      where: {
        conversationId,
        fileUrl: { not: null }
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(media)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Dodaj člana u grupu
const addGroupMember = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { userId } = req.body

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation?.isGroup) {
      return res.status(400).json({ message: 'Nije grupni chat' })
    }
    if (conversation.adminId !== req.user.userId) {
      return res.status(403).json({ message: 'Samo admin može dodavati članove' })
    }

    await prisma.conversationParticipant.create({
      data: { conversationId, userId }
    })

    res.json({ message: 'Član dodan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Napusti grupu
const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user.userId
        }
      }
    })

    res.json({ message: 'Napustio/la si grupu' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getUnreadMessagesCount = async (req, res) => {
  try {
    const userId = req.user.userId

    // Nađi sve konverzacije korisnika
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } }
      }
    })

    // Nađi zadnje pročitano za svaku konverzaciju
    const reads = await prisma.conversationRead.findMany({
      where: { userId }
    })

    const readMap = {}
    reads.forEach(r => { readMap[r.conversationId] = r.lastReadAt })

    let unreadCount = 0
    for (const conv of conversations) {
      const lastRead = readMap[conv.id]
      if (!lastRead) {
        // Nikad nije čitao, broji sve poruke koje nisu moje
        const count = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId }
          }
        })
        if (count > 0) unreadCount++
      } else {
        const unread = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: lastRead }
          }
        })
        if (unread > 0) unreadCount++
      }
    }

    res.json({ count: unreadCount })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  uploadFile,
  upload,
  createGroupChat,
  getConversationMedia,
  addGroupMember,
  leaveGroup,
  getUnreadMessagesCount,

}