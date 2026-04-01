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

module.exports = { register, login, getMe }