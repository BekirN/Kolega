const express = require('express')
const router = express.Router()
const multer = require('multer')
const {
  register, login, getMe,
  getUserProfile, updateProfile,
  updateProfileImage, searchUsers
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')

const upload = multer({ storage: multer.memoryStorage() })

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.get('/search', protect, searchUsers)
router.get('/profile/:id', getUserProfile)
router.put('/profile', protect, updateProfile)
router.put('/profile/image', protect, upload.single('image'), updateProfileImage)

module.exports = router