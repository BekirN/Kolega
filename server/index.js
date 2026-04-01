const express = require('express')
const cors = require('cors')
const prisma = require('./prisma/client')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const shopRoutes = require('./routes/shop')

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/shop', shopRoutes)

app.get('/', async (req, res) => {
  try {
    await prisma.$connect()
    res.json({ message: 'KOLEGA API radi! Baza povezana! 🎓' })
  } catch (error) {
    res.status(500).json({ message: 'Greška pri konekciji na bazu', error })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`)
})