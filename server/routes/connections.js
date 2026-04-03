const express = require('express')
const router = express.Router()
const {
  sendRequest,
  respondToRequest,
  getConnectionStatus,
  getPendingRequests,
  getConnections,
} = require('../controllers/connectionController')
const { protect } = require('../middleware/auth')

router.get('/', protect, getConnections)
router.get('/pending', protect, getPendingRequests)
router.get('/status/:userId', protect, getConnectionStatus)
router.post('/request/:userId', protect, sendRequest)
router.put('/respond/:connectionId', protect, respondToRequest)

module.exports = router