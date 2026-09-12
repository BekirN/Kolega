// Jest manual mock za email servis — sprječava stvarno slanje emaila u testovima.
module.exports = {
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}
