const { isValidEmail, isStudentEmail } = require('../../utils/validators')

describe('Unit: isValidEmail', () => {
  test.each(['a@b.com', 'ime.prezime@student.unsa.ba', 'x_y@mail.co'])(
    'prihvata ispravan email: %s',
    (email) => expect(isValidEmail(email)).toBe(true)
  )

  test.each(['plainaddress', 'a@b', 'a b@c.com', '', null])(
    'odbija neispravan email: %s',
    (email) => expect(isValidEmail(email)).toBe(false)
  )
})

describe('Unit: isStudentEmail', () => {
  test('prepoznaje studentski domen (UNSA)', () => {
    expect(isStudentEmail('amar@student.unsa.ba')).toBe(true)
  })

  test('odbija ne-studentski domen', () => {
    expect(isStudentEmail('amar@gmail.com')).toBe(false)
  })

  test('odbija neispravan email', () => {
    expect(isStudentEmail('notanemail')).toBe(false)
  })
})
