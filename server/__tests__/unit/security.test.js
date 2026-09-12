const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

describe('Unit: Password hashing (bcrypt)', () => {
  test('hash se razlikuje od originala i uspješno se verifikuje', async () => {
    const plain = 'Secret123!'
    const hash = await bcrypt.hash(plain, 12)

    expect(hash).not.toBe(plain)
    expect(await bcrypt.compare(plain, hash)).toBe(true)
    expect(await bcrypt.compare('pogresna', hash)).toBe(false)
  })
})

describe('Unit: JWT tokeni', () => {
  test('potpisivanje i verifikacija (round-trip)', () => {
    const token = jwt.sign({ userId: '123', role: 'STUDENT' }, 'secret', { expiresIn: '1h' })
    const decoded = jwt.verify(token, 'secret')

    expect(decoded.userId).toBe('123')
    expect(decoded.role).toBe('STUDENT')
  })

  test('verifikacija ne uspijeva sa pogrešnom tajnom', () => {
    const token = jwt.sign({ userId: '1' }, 'secret')
    expect(() => jwt.verify(token, 'druga-tajna')).toThrow()
  })
})
