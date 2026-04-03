const prisma = require('../prisma/client')

// Dohvati sve aktivnosti korisnika
const getActivities = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user.userId },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            faculty: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(activities)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Dohvati broj nepročitanih aktivnosti
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.activity.count({
      where: {
        userId: req.user.userId,
        isRead: false
      }
    })
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Označi sve kao pročitano
const markAllAsRead = async (req, res) => {
  try {
    await prisma.activity.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false
      },
      data: { isRead: true }
    })
    res.json({ message: 'Sve označeno kao pročitano' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Označi jednu aktivnost kao pročitanu
const markAsRead = async (req, res) => {
  try {
    await prisma.activity.update({
      where: { id: req.params.id },
      data: { isRead: true }
    })
    res.json({ message: 'Označeno kao pročitano' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = { getActivities, getUnreadCount, markAllAsRead, markAsRead }