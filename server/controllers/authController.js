const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma/client')

// Student email domeni - whitelist za auto-verifikaciju
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
} = require('../config/mailgun')

// Helper za generisanje koda
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
// REGISTER
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

    // Pokušaj poslati email – ako ne uspije, nije problem za registraciju
    try {
      await sendVerificationEmail(email, firstName, code)
      console.log(`Verifikacijski email poslan na ${email}`)
    } catch (emailErr) {
      console.error('Email greška:', emailErr.message)
      // Nastavi registraciju čak i ako email ne stigne
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      message: 'Registracija uspješna! Provjeri email za verifikacijski kod.',
      token,
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
    console.error('Register greška:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}
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

    // Verifikuj email
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExp: null,
      }
    })

    // Pošalji welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName)
    } catch (emailErr) {
      console.error('Welcome email greška:', emailErr)
    }

    res.json({ message: 'Email uspješno verifikovan! 🎉', emailVerified: true })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

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
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Pronađi korisnika
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(400).json({ message: 'Pogrešan email ili password' })
    }

    // Provjeri password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Pogrešan email ili password' })
    }

    // Kreiraj token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Prijava uspješna!',
      token,
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
    console.error(error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// GET trenutnog korisnika
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        university: true,
        faculty: true,
        yearOfStudy: true,
        verificationStatus: true,
        role: true,
        createdAt: true,
      }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru' })
  }
}
// Dohvati profil korisnika po ID-u
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        university: true,
        faculty: true,
        yearOfStudy: true,
        profileImage: true,
        bio: true,
        verificationStatus: true,
        verificationNote: true,     
        emailVerified: true,  
        role: true,
        createdAt: true,
        _count: {
          select: {
            shopItems: true,
            uploadedMaterials: true,  // ← nova relacija
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
    console.error('getUserProfile greška:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Ažuriraj vlastiti profil
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
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        university: true,
        faculty: true,
        yearOfStudy: true,
        bio: true,
        profileImage: true,
        verificationStatus: true,
        role: true,
      }
    })

    res.json({ message: 'Profil ažuriran!', user: updated })
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Upload profilne slike
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
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

// Search korisnika
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) return res.json([])

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: req.user.userId }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        faculty: true,
        university: true,
        profileImage: true,
        verificationStatus: true,
      },
      take: 8
    })

    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

const uploadIndexImage = async (req, res) => {
  try {
    console.log('=== uploadIndexImage ===')
    console.log('userId:', req.user.userId)

    const cloudinary = require('../config/cloudinary')

    if (!req.file) {
      return res.status(400).json({ message: 'Slika nije uploadovana' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    console.log('Trenutni status:', user.verificationStatus)

    if (user.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Već ste verifikovani' })
    }

    if (user.verificationStatus === 'PENDING') {
      return res.status(400).json({ message: 'Zahtjev je već na čekanju' })
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'kolega/index-verification', resource_type: 'image' },
        (error, result) => error ? reject(error) : resolve(result)
      )
      stream.end(req.file.buffer)
    })

    console.log('Cloudinary upload OK:', result.secure_url)

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        indexImage: result.secure_url,
        verificationStatus: 'PENDING',
        verificationNote: null,
      }
    })

    console.log('User ažuriran:', updated.verificationStatus, updated.indexImage)

    // Notifikacija adminima
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    console.log('Admini:', admins.length)

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
        console.error('Socket greška:', socketErr.message)
      }
    }

    res.json({
      message: 'Zahtjev poslan! Admin će pregledati tvoj indeks.',
      verificationStatus: 'PENDING'
    })
  } catch (error) {
    console.error('uploadIndexImage GREŠKA:', error)
    res.status(500).json({ message: 'Greška na serveru', error: error.message })
  }
}

module.exports = { register, login, getMe, getUserProfile, updateProfile, updateProfileImage, searchUsers, verifyEmail,
  resendVerificationCode,uploadIndexImage, }