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

// REGISTER
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, university, faculty, yearOfStudy } = req.body

    // Provjeri da li korisnik vec postoji
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Korisnik sa ovim emailom već postoji' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Odredi verifikacioni status
    const studentEmail = isStudentEmail(email)
    const verificationStatus = studentEmail ? 'VERIFIED' : 'UNVERIFIED'
    const verificationMethod = studentEmail ? 'STUDENT_EMAIL' : null

    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        university,
        faculty,
        yearOfStudy: yearOfStudy ? parseInt(yearOfStudy) : null,
        verificationStatus,
        verificationMethod,
      }
    })

    // Kreiraj JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: studentEmail
        ? 'Registracija uspješna! Studentski email potvrđen automatski ✓'
        : 'Registracija uspješna! Uploadujte dokument za verifikaciju.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationStatus: user.verificationStatus,
        role: user.role,
      }
    })

  } catch (error) {
    console.error(error)
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
module.exports = { register, login, getMe, getUserProfile, updateProfile, updateProfileImage, searchUsers }