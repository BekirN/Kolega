// Validacijski helperi za email adrese.
const STUDENT_EMAIL_DOMAINS = [
  'student.unsa.ba',
  'etf.unsa.ba',
  'efsa.unsa.ba',
  'pravni.unsa.ba',
  'med.unsa.ba',
  'student.sum.ba',
]

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isStudentEmail = (email) => {
  if (!isValidEmail(email)) return false
  const domain = email.split('@')[1].toLowerCase()
  return STUDENT_EMAIL_DOMAINS.includes(domain)
}

module.exports = { isValidEmail, isStudentEmail, STUDENT_EMAIL_DOMAINS }
