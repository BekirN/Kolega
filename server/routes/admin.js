const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { isAdmin } = require('../middleware/admin')
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  verifyUser,
  deleteContent,
  sendBroadcastEmail,
  sendSystemNotification,
  getAllContent,
  getPendingVerifications,  
  reviewVerification,  
} = require('../controllers/adminController')

// Sve admin rute zahtijevaju autentikaciju + admin rolu
router.use(protect, isAdmin)

router.get('/stats', getStats)
router.get('/users', getUsers)
router.put('/users/:id/role', updateUserRole)
router.delete('/users/:id', deleteUser)
router.put('/users/:id/verify', verifyUser)
router.get('/content/:type', getAllContent)
router.delete('/content/:type/:id', deleteContent)
router.post('/broadcast', sendBroadcastEmail)
router.post('/notify', sendSystemNotification)

router.get('/verifications', getPendingVerifications)
router.put('/verifications/:id', reviewVerification)

module.exports = router