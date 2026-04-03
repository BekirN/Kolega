const express = require('express')
const router = express.Router()
const {
  getActivities,
  getUnreadCount,
  markAllAsRead,
  markAsRead
} = require('../controllers/activityController')
const { protect } = require('../middleware/auth')

router.get('/', protect, getActivities)
router.get('/unread-count', protect, getUnreadCount)
router.put('/mark-all-read', protect, markAllAsRead)
router.put('/:id/read', protect, markAsRead)

module.exports = router