const prisma = require('../prisma/client')

const createActivity = async ({
  type,
  message,
  userId,
  actorId = null,
  referenceId = null,
  link = null,
}) => {
  try {
    const activity = await prisma.activity.create({
      data: { type, message, userId, actorId, referenceId, link },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, profileImage: true, faculty: true }
        }
      }
    })

    // Emituj real-time notifikaciju
    try {
      const { io } = require('../index')
      io.to(`user_${userId}`).emit('new_activity', activity)
    } catch (e) {
      console.log('IO emit greška:', e.message)
    }

    return activity
  } catch (error) {
    console.error('Greška pri kreiranju aktivnosti:', error)
    return null
  }
}

module.exports = { createActivity }