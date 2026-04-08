const express = require('express')
const router = express.Router()
const multer = require('multer')
const {
  register, login, getMe,
  getUserProfile, updateProfile,
  updateProfileImage, searchUsers
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { verifyEmail, resendVerificationCode, uploadIndexImage} = require('../controllers/authController')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const { getPendingVerifications, reviewVerification } = require('../controllers/adminController')
const { isAdmin } = require('../middleware/admin')

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.get('/search', protect, searchUsers)
router.get('/profile/:id', getUserProfile)
router.put('/profile', protect, updateProfile)
router.put('/profile/image', protect, upload.single('image'), updateProfileImage)
router.post('/verify-email', protect, verifyEmail)
router.post('/resend-verification', protect, resendVerificationCode)
router.post('/upload-index', protect, upload.single('indexImage'), uploadIndexImage)
router.get('/verifications', protect, isAdmin, getPendingVerifications)
router.put('/verifications/:id', protect, isAdmin, reviewVerification)
module.exports = router