const prisma = require('../prisma/client')
const { sendEmail } = require('../config/mailgun')

// ─── STATISTIKE ───────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalShopItems,
      totalHousingListings,
      totalJobs,
      totalInternships,
      totalPosts,
      totalMaterials,
      totalBookings,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.shopItem.count(),
      prisma.housingListing.count(),
      prisma.studentJob.count(),
      prisma.internship.count(),
      prisma.communityPost.count(),
      prisma.material.count(),
      prisma.tutorBooking.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, firstName: true, lastName: true,
          email: true, faculty: true, role: true,
          emailVerified: true, createdAt: true, profileImage: true,
        }
      }),
    ])

    // Korisnici po danu (zadnjih 7 dana)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const usersByDay = await prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
    })

    res.json({
      users: { total: totalUsers, verified: verifiedUsers, unverified: totalUsers - verifiedUsers },
      content: {
        shopItems: totalShopItems,
        housingListings: totalHousingListings,
        jobs: totalJobs,
        internships: totalInternships,
        posts: totalPosts,
        materials: totalMaterials,
        bookings: totalBookings,
      },
      recentUsers,
    })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── KORISNICI ────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { faculty: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true,
          faculty: true, university: true, role: true,
          emailVerified: true, createdAt: true, profileImage: true,
          verificationStatus: true,
          _count: {
            select: {
              shopItems: true, communityPosts: true,
              uploadedMaterials: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ])

    res.json({ users, total, pages: Math.ceil(total / parseInt(limit)) })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['STUDENT', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Neispravna rola' })
    }
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Ne možete mijenjati vlastitu rolu' })
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    })

    res.json({ message: `Rola promijenjena u ${role}`, user })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Ne možete obrisati vlastiti nalog' })
    }

    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ message: 'Korisnik obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const verifyUser = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExp: null,
      },
      select: { id: true, firstName: true, lastName: true, email: true, emailVerified: true }
    })
    res.json({ message: 'Korisnik verifikovan!', user })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── BRISANJE SADRŽAJA ────────────────────────────────────────────
const deleteContent = async (req, res) => {
  try {
    const { type, id } = req.params

    const modelMap = {
      shop: () => prisma.shopItem.delete({ where: { id } }),
      housing: () => prisma.housingListing.delete({ where: { id } }),
      job: () => prisma.studentJob.delete({ where: { id } }),
      post: () => prisma.communityPost.delete({ where: { id } }),
      material: () => prisma.material.delete({ where: { id } }),
      internship: () => prisma.internship.delete({ where: { id } }),
      booking: () => prisma.tutorBooking.delete({ where: { id } }),
    }

    if (!modelMap[type]) {
      return res.status(400).json({ message: 'Neispravni tip sadržaja' })
    }

    await modelMap[type]()
    res.json({ message: 'Sadržaj obrisan!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── BROADCAST EMAIL ──────────────────────────────────────────────
const sendBroadcastEmail = async (req, res) => {
  try {
    const { subject, message, targetRole } = req.body

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject i poruka su obavezni' })
    }

    const where = { emailVerified: true }
    if (targetRole === 'STUDENT') where.role = 'STUDENT'
    if (targetRole === 'ADMIN') where.role = 'ADMIN'

    const users = await prisma.user.findMany({
      where,
      select: { email: true, firstName: true }
    })

    console.log(`Broadcast: šaljem na ${users.length} korisnika`)

    // Koristi sendEmail iz mailgun.js koji je zapravo Resend
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const OWNER_EMAIL = process.env.RESEND_TEST_EMAIL
    const isDev = process.env.NODE_ENV !== 'production'

    let sent = 0
    let failed = 0

    const batchSize = 5
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(u => {
          const actualTo = isDev ? OWNER_EMAIL : u.email
          const finalSubject = isDev && u.email !== OWNER_EMAIL
            ? `[TEST → ${u.email}] ${subject}`
            : subject

          const html = `
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#E2DDD6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#E2DDD6;padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
                      <tr>
                        <td style="padding:0 0 24px 0;" align="center">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:linear-gradient(135deg,#FF6B35,#FFB800);border-radius:16px;text-align:center;vertical-align:middle;font-size:24px;font-weight:900;color:white;padding:8px 18px;">K</td>
                              <td style="padding-left:12px;">
                                <div style="font-size:22px;font-weight:900;color:#1C1C1E;">KOLEGA</div>
                                <div style="font-size:12px;color:#FF6B35;font-weight:600;">Student Hub · Sarajevo</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="background:#EEEBE5;border-radius:24px;padding:40px;border:1px solid rgba(0,0,0,0.06);">
                          <h1 style="font-size:24px;font-weight:900;color:#1C1C1E;margin:0 0 16px 0;">
                            Zdravo ${u.firstName}! 👋
                          </h1>
                          <div style="color:#3A3A3C;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</div>
                          <hr style="border:none;border-top:1px solid #D8D4CC;margin:28px 0;">
                          <p style="color:#9A9690;font-size:12px;margin:0;">KOLEGA Student Hub · Sarajevo, Bosna i Hercegovina</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `

          return resend.emails.send({
            from: 'KOLEGA <onboarding@resend.dev>',
            to: [actualTo],
            subject: finalSubject,
            html,
          })
        })
      )

      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          sent++
          console.log(`✉️ Poslan email ${i + idx + 1}/${users.length}`)
        } else {
          failed++
          console.error(`❌ Greška email ${i + idx + 1}:`, r.reason)
        }
      })

      // Pauza između batch-eva da ne prekoračimo rate limit
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    res.json({
      message: `Email poslan! ✉️ Uspješno: ${sent}, Neuspješno: ${failed}`,
      sent,
      failed,
    })
  } catch (error) {
    console.error('sendBroadcastEmail greška:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── SISTEMSKA NOTIFIKACIJA ───────────────────────────────────────
const sendSystemNotification = async (req, res) => {
  try {
    const { message, link, targetRole } = req.body

    if (!message) return res.status(400).json({ message: 'Poruka je obavezna' })

    const where = {}
    if (targetRole === 'STUDENT') where.role = 'STUDENT'

    const users = await prisma.user.findMany({
      where,
      select: { id: true }
    })

    await prisma.activity.createMany({
      data: users.map(u => ({
        type: 'GENERAL',
        message,
        userId: u.id,
        link: link || null,
        isRead: false,
      }))
    })

    const { io } = require('../index')
    users.forEach(u => {
      io.to(`user_${u.id}`).emit('new_activity', {
        type: 'GENERAL',
        message,
        link: link || null,
      })
    })

    res.json({ message: `Notifikacija poslana ${users.length} korisnicima!` })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// ─── SVI SADRŽAJI ─────────────────────────────────────────────────
const getAllContent = async (req, res) => {
  try {
    const { type } = req.params

    const queries = {
      shop: () => prisma.shopItem.findMany({
        include: { seller: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' }, take: 50,
      }),
      housing: () => prisma.housingListing.findMany({
        include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' }, take: 50,
      }),
      jobs: () => prisma.studentJob.findMany({
        include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' }, take: 50,
      }),
      materials: () => prisma.material.findMany({
        include: { uploader: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' }, take: 50,
      }),
    }

    if (!queries[type]) return res.status(400).json({ message: 'Neispravni tip' })

    const data = await queries[type]()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Dohvati pending verifikacije
const getPendingVerifications = async (req, res) => {
  try {
    console.log('=== getPendingVerifications ===')

    // Provjeri sve korisnike i njihove statuse
    const allUsers = await prisma.user.findMany({
      select: { id: true, firstName: true, verificationStatus: true, indexImage: true }
    })
    console.log('Svi korisnici statusi:', allUsers.map(u => ({
      name: u.firstName,
      status: u.verificationStatus,
      hasIndex: !!u.indexImage
    })))

    const users = await prisma.user.findMany({
      where: { verificationStatus: 'PENDING' },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, faculty: true, university: true,
        indexImage: true, createdAt: true, profileImage: true,
        verificationStatus: true, verificationNote: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log('PENDING korisnici:', users.length, users)
    res.json(users)
  } catch (error) {
    console.error('getPendingVerifications GREŠKA:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}
// Odobri ili odbij verifikaciju
const reviewVerification = async (req, res) => {
  try {
    const { action, note } = req.body // action: 'approve' | 'reject'
    const { id } = req.params

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Neispravna akcija' })
    }

    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED'

    const user = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: newStatus,
        verificationNote: note || null,
        // Resetuj indexImage ako odbijen
        ...(action === 'reject' && { indexImage: null }),
      },
      select: { id: true, firstName: true, lastName: true, email: true }
    })

    // Aktivnost za korisnika
    await prisma.activity.create({
      data: {
        type: action === 'approve' ? 'GENERAL' : 'GENERAL',
        message: action === 'approve'
          ? '🎉 Tvoj student status je verifikovan! Dobio/la si verifikacijski badge.'
          : `❌ Tvoj zahtjev za verifikaciju je odbijen.${note ? ` Razlog: ${note}` : ''}`,
        userId: id,
        actorId: req.user.userId,
        link: '/profile/' + id,
        isRead: false,
      }
    })

    // Socket notifikacija korisniku
    try {
      const { io } = require('../index')
      io.to(`user_${id}`).emit('new_activity', {
        type: 'GENERAL',
        message: action === 'approve'
          ? '🎉 Tvoj student status je verifikovan!'
          : `❌ Zahtjev za verifikaciju odbijen.`,
        link: `/profile/${id}`,
      })
    } catch (socketErr) {
      console.error('Socket greška:', socketErr.message)
    }

    // Email korisniku
    try {
      const { sendVerificationResultEmail } = require('../config/mailgun')
      await sendVerificationResultEmail(
        user.email, user.firstName, action === 'approve', note
      )
    } catch (emailErr) {
      console.error('Email greška:', emailErr.message)
    }

    res.json({ message: `Verifikacija ${action === 'approve' ? 'odobrena' : 'odbijena'}!`, user })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  verifyUser,
  deleteContent,
  sendBroadcastEmail,
  sendSystemNotification,
  getAllContent,
  getPendingVerifications,
  reviewVerification,
}