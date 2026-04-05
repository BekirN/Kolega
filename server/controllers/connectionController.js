const prisma = require('../prisma/client')
const { createActivity } = require('../utils/activityHelper')

const sendRequest = async (req, res) => {
  try {
    const { userId } = req.params
    const senderId = req.user.userId

    if (userId === senderId) {
      return res.status(400).json({ message: 'Ne možete poslati zahtjev sebi' })
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId: userId },
          { senderId: userId, receiverId: senderId }
        ]
      }
    })

    let connection

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ message: 'Već ste kolege' })
      }
      if (existing.status === 'PENDING') {
        return res.status(400).json({ message: 'Zahtjev je već poslan' })
      }

      connection = await prisma.connection.update({
        where: { id: existing.id },
        data: { status: 'PENDING', senderId, receiverId: userId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
          }
        }
      })
    } else {
      connection = await prisma.connection.create({
        data: { senderId, receiverId: userId },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
          }
        }
      })
    }

    // Kreiraj aktivnost za primaoca
    await createActivity({
      type: 'CONNECTION_REQUEST',
      message: `${connection.sender.firstName} ${connection.sender.lastName} želi postati tvoj kolega`,
      userId,
      actorId: senderId,
      referenceId: connection.id,
      link: `/profile/${senderId}`,
    })

    // Socket notifikacija
    try {
      const { io } = require('../index')
      io.to(`user_${userId}`).emit('connection_request', {
        connectionId: connection.id,
        sender: connection.sender,
      })
    } catch (socketError) {
      console.error('Socket greška:', socketError.message)
    }

    res.status(201).json({ message: 'Zahtjev poslan!', connection })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const respondToRequest = async (req, res) => {
  try {
    const { connectionId } = req.params
    const { action } = req.body

    console.log('respondToRequest:', { connectionId, action, userId: req.user.userId })

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Neispravna akcija' })
    }

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        }
      }
    })

    console.log('Pronađena konekcija:', connection)

    if (!connection) {
      return res.status(404).json({ message: 'Zahtjev nije pronađen' })
    }

    if (connection.receiverId !== req.user.userId) {
      return res.status(403).json({ message: 'Nemate pristup ovom zahtjevu' })
    }

    if (connection.status !== 'PENDING') {
      // Umjesto greške, vrati trenutni status
      return res.json({
        message: 'Zahtjev je već obrađen',
        connection,
      })
    }

    const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED'

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        }
      }
    })

    if (action === 'accept') {
      await createActivity({
        type: 'CONNECTION_ACCEPTED',
        message: `${updated.receiver.firstName} ${updated.receiver.lastName} je prihvatio/la tvoj zahtjev za kolegu 🎉`,
        userId: connection.senderId,
        actorId: req.user.userId,
        referenceId: updated.id,
        link: `/profile/${req.user.userId}`,
      })

      try {
        const { io } = require('../index')
        io.to(`user_${updated.senderId}`).emit('connection_accepted', {
          connectionId: updated.id,
          acceptedBy: updated.receiver,
        })
      } catch (socketError) {
        console.error('Socket greška:', socketError.message)
      }
    }

    res.json({
      message: status === 'ACCEPTED' ? 'Zahtjev prihvaćen!' : 'Zahtjev odbijen',
      connection: updated
    })
  } catch (error) {
    console.error('respondToRequest greška:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}
const getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params
    const myId = req.user.userId

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: myId, receiverId: userId },
          { senderId: userId, receiverId: myId }
        ]
      }
    })

    res.json({ connection })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getPendingRequests = async (req, res) => {
  try {
    const requests = await prisma.connection.findMany({
      where: { receiverId: req.user.userId, status: 'PENDING' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, faculty: true, university: true, profileImage: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const getConnections = async (req, res) => {
  try {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: req.user.userId, status: 'ACCEPTED' },
          { receiverId: req.user.userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, faculty: true, profileImage: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const colleagues = connections.map(c => ({
      connectionId: c.id,
      user: c.senderId === req.user.userId ? c.receiver : c.sender,
      connectedAt: c.updatedAt
    }))

    res.json(colleagues)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  sendRequest,
  respondToRequest,
  getConnectionStatus,
  getPendingRequests,
  getConnections,
}