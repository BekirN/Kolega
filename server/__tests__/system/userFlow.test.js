jest.mock('../../prisma/client')
jest.mock('../../config/mailgun')

const request = require('supertest')
const bcrypt = require('bcryptjs')
const { app } = require('../../index')
const prisma = require('../../prisma/client')

describe('System: kompletan tok korisnika (registracija -> prijava -> zaštićeni pristup -> lista)', () => {
  test('korisnik se registruje, prijavi i pristupa podacima', async () => {
    // 1) REGISTRACIJA
    prisma.user.findUnique.mockResolvedValueOnce(null) // email još ne postoji
    prisma.user.create.mockResolvedValue({
      id: 'u1', firstName: 'Amar', lastName: 'Hodzic', email: 'tok@b.com',
      role: 'STUDENT', emailVerified: false, verificationStatus: 'UNVERIFIED',
    })
    prisma.user.update.mockResolvedValue({})

    const reg = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Amar', lastName: 'Hodzic', email: 'tok@b.com', password: 'pass1234' })
    expect(reg.status).toBe(201)

    // 2) PRIJAVA
    const hash = await bcrypt.hash('pass1234', 12)
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'tok@b.com', password: hash, role: 'STUDENT',
      firstName: 'Amar', lastName: 'Hodzic', emailVerified: true, verificationStatus: 'VERIFIED',
    })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tok@b.com', password: 'pass1234' })
    expect(login.status).toBe(200)
    const token = login.body.token
    expect(token).toBeDefined()

    // 3) ZAŠTIĆENI PRISTUP (moji oglasi) sa dobijenim tokenom
    prisma.shopItem.findMany.mockResolvedValue([])
    const mine = await request(app).get('/api/shop/my').set('Authorization', `Bearer ${token}`)
    expect(mine.status).toBe(200)

    // 4) JAVNA LISTA OGLASA
    prisma.shopItem.findMany.mockResolvedValue([{ id: 's1', title: 'Knjiga' }])
    const list = await request(app).get('/api/shop')
    expect(list.status).toBe(200)
    expect(list.body.length).toBeGreaterThan(0)
  })
})
