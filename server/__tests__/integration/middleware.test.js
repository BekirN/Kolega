jest.mock('../../prisma/client')
jest.mock('../../config/mailgun')

const request = require('supertest')
const jwt = require('jsonwebtoken')
const { app } = require('../../index')
const prisma = require('../../prisma/client')

describe('Integration: Auth middleware (protect)', () => {
  test('401 bez tokena', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('401 sa nevalidnim tokenom', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nevalidan.token')
    expect(res.status).toBe(401)
  })

  test('prolazi middleware sa validnim tokenom (dolazi do kontrolera)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', firstName: 'Amar' })
    const token = jwt.sign({ userId: 'u1', role: 'STUDENT' }, process.env.JWT_SECRET)

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).not.toBe(401)
  })
})
