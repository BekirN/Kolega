jest.mock('../../prisma/client')
jest.mock('../../config/mailgun')

const request = require('supertest')
const bcrypt = require('bcryptjs')
const { app } = require('../../index')
const prisma = require('../../prisma/client')

describe('Integration: POST /api/auth/register', () => {
  test('400 kada nedostaju obavezna polja', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' })
    expect(res.status).toBe(400)
  })

  test('400 kada je email već registrovan', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Amar', lastName: 'Hodzic', email: 'a@b.com', password: 'pass1234' })
    expect(res.status).toBe(400)
  })

  test('201 pri uspješnoj registraciji (vraća token i korisnika)', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue({
      id: 'u1', firstName: 'Amar', lastName: 'Hodzic', email: 'novi@b.com',
      role: 'STUDENT', emailVerified: false, verificationStatus: 'UNVERIFIED',
    })
    prisma.user.update.mockResolvedValue({})

    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Amar', lastName: 'Hodzic', email: 'novi@b.com', password: 'pass1234' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('novi@b.com')
  })
})

describe('Integration: POST /api/auth/login', () => {
  test('400 kada korisnik ne postoji', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    const res = await request(app).post('/api/auth/login').send({ email: 'no@b.com', password: 'x' })
    expect(res.status).toBe(400)
  })

  test('400 pri pogrešnoj lozinci', async () => {
    const hash = await bcrypt.hash('ispravna', 12)
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: hash })
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'pogresna' })
    expect(res.status).toBe(400)
  })

  test('200 pri ispravnim podacima (vraća token)', async () => {
    const hash = await bcrypt.hash('ispravna', 12)
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@b.com', password: hash, role: 'STUDENT',
      firstName: 'Amar', lastName: 'Hodzic', emailVerified: true, verificationStatus: 'VERIFIED',
    })
    prisma.user.update.mockResolvedValue({})

    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'ispravna' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('refreshToken')
  })
})
