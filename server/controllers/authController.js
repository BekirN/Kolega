const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../prisma/client')

const STUDENT_EMAIL_DOMAINS = [
  'student.unsa.ba',
  'etf.unsa.ba',
  'efsa.unsa.ba',
  'pravni.unsa.ba',
  'med.unsa.ba',
  'student.sum.ba',
]

const isStudentEmail = (email) => {
  const domain = email.split('@')[1]
  return STUDENT_EMAIL_DOMAINS.includes(domain)
}

const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../config/mailgun')

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString()
}

const generateTokens = (user) => {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  )
  return { token, refreshToken }
}

// ─── REGISTER ─────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, university, faculty, yearOfStudy } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Sva obavezna polja su potrebna' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email je već registrovan' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const code = generateVerificationCode()
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        firstName, lastName, email,
        password: hashedPassword,
        university: university || null,
        faculty: faculty || null,
        yearOfStudy: yearOfStudy ? parseInt(yearOfStudy) : null,
        emailVerified: false,
        verificationCode: code,
        verificationCodeExp: codeExpiry,
        verificationStatus: 'UNVERIFIED',
      }
    })

    try {
      await sendVerificationEmail(email, firstName, code)
    } catch (emailErr) {
      console.error('Verification email failed:', emailErr.name || 'Unknown')
    }

    const { token, refreshToken } = generateTokens(user)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    })

    res.status(201).json({
      message: 'Registracija uspješna! Provjeri email za verifikacijski kod.',
      token,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        verificationStatus: user.verificationStatus,
        faculty: user.faculty,
        university: user.university,
        profileImage: user.profileImage,
        role: user.role,
      },
      requiresEmailVerification: true,
    })
  } catch (error) {
    console.error('Registration failed:', error.name || 'Unknown')
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body
    const userId = req.user.userId

    if (!code) {
      return res.status(400).json({ message: 'Kod je obavezan' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' })
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email je već verifikovan', emailVerified: true })
    }

    if (!user.verificationCode || !user.verificationCodeExp) {
      return res.status(400).json({ message: 'Nema aktivnog verifikacijskog koda' })
    }

    if (new Date() > user.verificationCodeExp) {
      return res.status(400).json({ message: 'Verifikacijski kod je istekao. Zatraži novi.' })
    }

    if (user.verificationCode !== code.trim()) {
      return res.status(400).json({ message: 'Pogrešan verifikacijski kod' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExp: null,
      }
    })

    try {
      await sendWelcomeEmail(user.email, user.firstName)
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr.name || 'Unknown')
    }

    res.json({ message: 'Email uspješno verifikovan! 🎉', emailVerified: true })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── RESEND VERIFICATION ──────────────────────────────────────────
const resendVerificationCode = async (req, res) => {
  try {
    const userId = req.user.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' })
    if (user.emailVerified) return res.status(400).json({ message: 'Email je već verifikovan' })

    const code = generateVerificationCode()
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { id: userId },
      data: { verificationCode: code, verificationCodeExp: codeExpiry }
    })

    await sendVerificationEmail(user.email, user.firstName, code)

    res.json({ message: 'Novi kod je poslan na tvoj email!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email, deletedAt: null } })
    if (!user) {
      return res.status(400).json({ message: 'Pogrešan email ili password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Pogrešan email ili password' })
    }

    const { token, refreshToken } = generateTokens(user)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    })

    res.json({
      message: 'Prijava uspješna!',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationStatus: user.verificationStatus,
        role: user.role,
        emailVerified: user.emailVerified,
      }
    })
  } catch (error) {
    console.error('Authentication request failed:', error.name || 'Unknown')
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshToken: null }
    })
    res.json({ message: 'Odjava uspješna!' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── REFRESH TOKEN ────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token nije pronađen' })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null }
    })

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token nije validan' })
    }

    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({ token: newToken })
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token nije validan' })
  }
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email je obavezan' })

    const user = await prisma.user.findUnique({ where: { email, deletedAt: null } })

    // Uvijek vrati isti odgovor da ne otkrijemo postoji li email
    if (!user) {
      return res.json({ message: 'Ako email postoji, poslan je link za reset.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExp: expiry,
      }
    })

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetUrl)
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.name || 'Unknown')
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordTokenExp: null }
      })
      return res.status(500).json({ message: 'Greška pri slanju emaila, pokušaj ponovo.' })
    }

    res.json({ message: 'Ako email postoji, poslan je link za reset.' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ message: 'Token i novi password su obavezni' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password mora imati najmanje 6 karaktera' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExp: { gt: new Date() },
        deletedAt: null,
      }
    })

    if (!user) {
      return res.status(400).json({ message: 'Token nije validan ili je istekao' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExp: null,
        refreshToken: null,
      }
    })

    res.json({ message: 'Password uspješno resetovan! Prijavi se sa novim passwordom.' })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── GET ME ───────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        university: true, faculty: true, yearOfStudy: true,
        verificationStatus: true, role: true, createdAt: true,
      }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru' })
  }
}

// ─── GET USER PROFILE ─────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const isOwnProfile = req.user.userId === req.params.id
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true,
        university: true, faculty: true, yearOfStudy: true,
        profileImage: true, bio: true, verificationStatus: true,
        ...(isOwnProfile && { verificationNote: true }),
        createdAt: true,
        _count: {
          select: {
            shopItems: true,
            uploadedMaterials: true,
            communityPosts: true,
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' })
    }

    res.json(user)
  } catch (error) {
    console.error('Profile request failed:', error.name || 'Unknown')
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── UPDATE PROFILE ───────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, university, faculty, yearOfStudy, bio } = req.body

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(university !== undefined && { university }),
        ...(faculty !== undefined && { faculty }),
        ...(yearOfStudy !== undefined && { yearOfStudy: yearOfStudy ? parseInt(yearOfStudy) : null }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        university: true, faculty: true, yearOfStudy: true,
        bio: true, profileImage: true, verificationStatus: true, role: true,
      }
    })

    res.json({ message: 'Profil ažuriran!', user: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── UPDATE PROFILE IMAGE ─────────────────────────────────────────
const updateProfileImage = async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary')

    if (!req.file) return res.status(400).json({ message: 'Slika nije uploadovana' })

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'kolega/avatars', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
        (error, result) => error ? reject(error) : resolve(result)
      )
      stream.end(req.file.buffer)
    })

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { profileImage: result.secure_url },
      select: { id: true, profileImage: true }
    })

    res.json({ message: 'Slika ažurirana!', profileImage: updated.profileImage })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── SEARCH USERS ─────────────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) return res.json([])

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: req.user.userId }
      },
      select: {
        id: true, firstName: true, lastName: true,
        faculty: true, university: true,
        profileImage: true, verificationStatus: true,
      },
      take: 8
    })

    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: process.env.NODE_ENV === 'production' ? undefined : error.message })
  }
}

// ─── UPLOAD INDEX IMAGE ───────────────────────────────────────────
const uploadIndexImage = async (req, res) => {
  try {
    const cloudinary = require('../config/cloudinary')

    if (!req.file) {
      return res.status(400).json({ message: 'Slika nije uploadovana' })
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Potrebno je uploadovati sliku.' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })

    if (user.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Već ste verifikovani' })
    }

    if (user.verificationStatus === 'PENDING') {
      return res.status(400).json({ message: 'Zahtjev je već na čekanju' })
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'kolega/index-verification', resource_type: 'image', type: 'authenticated' },
        (error, result) => error ? reject(error) : resolve(result)
      )
      stream.end(req.file.buffer)
    })

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        indexImage: result.secure_url,
        verificationStatus: 'PENDING',
        verificationNote: null,
      }
    })

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.activity.createMany({
        data: admins.map(admin => ({
          type: 'GENERAL',
          message: `${user.firstName} ${user.lastName} je podnio/la zahtjev za verifikaciju studenta 📋`,
          userId: admin.id,
          actorId: req.user.userId,
          referenceId: req.user.userId,
          link: `/admin`,
          isRead: false,
        }))
      })

      try {
        const { io } = require('../index')
        admins.forEach(admin => {
          io.to(`user_${admin.id}`).emit('new_activity', {
            type: 'GENERAL',
            message: `${user.firstName} ${user.lastName} je podnio/la zahtjev za verifikaciju 📋`,
            link: '/admin',
          })
        })
      } catch (socketErr) {
        console.error('Verification socket notification failed:', socketErr.name || 'Unknown')
      }
    }

    res.json({
      message: 'Zahtjev poslan! Admin će pregledati tvoj indeks.',
      verificationStatus: 'PENDING'
    })
  } catch (error) {
    console.error('uploadIndexImage failed:', error.name)
    res.status(500).json({ message: 'Greška na serveru' })
  }
}

module.exports = {
  register, login, logout, refreshToken,
  forgotPassword, resetPassword,
  getMe, getUserProfile, updateProfile, updateProfileImage,
  searchUsers, verifyEmail, resendVerificationCode, uploadIndexImage,
}
