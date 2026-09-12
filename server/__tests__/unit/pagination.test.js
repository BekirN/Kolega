const { getPagination } = require('../../utils/pagination')

describe('Unit: getPagination', () => {
  test('vraća podrazumijevane vrijednosti (page 1, limit 12)', () => {
    expect(getPagination({})).toEqual({ skip: 0, take: 12, page: 1, limit: 12 })
  })

  test('računa skip iz page i limit', () => {
    expect(getPagination({ page: '3', limit: '10' })).toMatchObject({ skip: 20, take: 10 })
  })

  test('ograničava limit na maksimum (50)', () => {
    expect(getPagination({ limit: '500' }).take).toBe(50)
  })

  test('nevalidne vrijednosti se vraćaju na podrazumijevane', () => {
    expect(getPagination({ page: 'abc', limit: 'xyz' })).toMatchObject({ skip: 0, take: 12 })
  })

  test('page manji od 1 se svodi na 1', () => {
    expect(getPagination({ page: '0' }).page).toBe(1)
  })
})
