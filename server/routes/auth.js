const express = require('express')
const router = express.Router()
const multer = require('multer')
const {
  register, login, logout, refreshToken,
  forgotPassword, resetPassword,
  getMe, getUserProfile, updateProfile,
  updateProfileImage, searchUsers,
  verifyEmail, resendVerificationCode, uploadIndexImage,
} = require('../controllers/authController')
const { protect, authenticate } = require('../middleware/auth')
const { getPendingVerifications, reviewVerification } = require('../controllers/adminController')
const { isAdmin } = require('../middleware/admin')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authenticate, logout)
router.post('/refresh', refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

router.get('/me', protect, getMe)
router.get('/search', protect, searchUsers)
router.get('/profile/:id', protect, getUserProfile)
router.put('/profile', protect, updateProfile)
router.put('/profile/image', protect, upload.single('image'), updateProfileImage)

router.post('/verify-email', authenticate, verifyEmail)
router.post('/resend-verification', authenticate, resendVerificationCode)
router.post('/upload-index', protect, upload.single('indexImage'), uploadIndexImage)

router.get('/verifications', protect, isAdmin, getPendingVerifications)
router.put('/verifications/:id', protect, isAdmin, reviewVerification)

module.exports = router
