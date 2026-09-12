// Jest manual mock za Prisma klijent — koristi se sa jest.mock('../../prisma/client').
// Nijedan test ne dira pravu bazu; svaki model je skup jest.fn() metoda.
const model = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  upsert: jest.fn(),
})

module.exports = {
  user: model(),
  shopItem: model(),
  housingListing: model(),
  studentJob: model(),
  company: model(),
  internship: model(),
  internshipApplication: model(),
  companyMember: model(),
  tutorProfile: model(),
  tutorBooking: model(),
  tutorReview: model(),
  material: model(),
  materialFolder: model(),
  conversation: model(),
  conversationParticipant: model(),
  message: model(),
  connection: model(),
  activity: model(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
}
