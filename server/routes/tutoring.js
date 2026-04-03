const express = require('express')
const router = express.Router()
const {
  getTutors,
  getTutorById,
  createTutorProfile,
  updateTutorProfile,
  createBooking,
  getMyBookings,
  getTutorBookings,
  updateBookingStatus,
  createTutorReview,
} = require('../controllers/tutorController')
const { protect } = require('../middleware/auth')

router.get('/', getTutors)
router.get('/my-bookings', protect, getMyBookings)
router.get('/my-tutor-bookings', protect, getTutorBookings)
router.get('/:id', getTutorById)
router.post('/profile', protect, createTutorProfile)
router.put('/profile', protect, updateTutorProfile)
router.post('/:id/book', protect, createBooking)
router.put('/bookings/:bookingId/status', protect, updateBookingStatus)
router.post('/:id/reviews', protect, createTutorReview)

module.exports = router