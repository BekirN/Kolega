jest.mock('../../prisma/client')
jest.mock('../../config/mailgun')

const request = require('supertest')
const { app } = require('../../index')
const prisma = require('../../prisma/client')

describe('Integration: GET /api/shop', () => {
  test('vraća 200 i listu oglasa', async () => {
    prisma.shopItem.findMany.mockResolvedValue([{ id: '1', title: 'Knjiga', price: 10 }])
    const res = await request(app).get('/api/shop')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(1)
  })

  test('primjenjuje paginaciju (skip/take) iz query-ja', async () => {
    prisma.shopItem.findMany.mockResolvedValue([])
    await request(app).get('/api/shop?page=2&limit=5')

    expect(prisma.shopItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    )
  })
})

describe('Integration: POST /api/shop (zaštićeno)', () => {
  test('odbija nezautentifikovan zahtjev sa 401', async () => {
    const res = await request(app).post('/api/shop').send({ title: 'Test' })
    expect(res.status).toBe(401)
  })
})
