const express = require('express')
const router = express.Router()
const {
  getJobs, getJobById, createJob,
  updateJob, deleteJob, getMyJobs
} = require('../controllers/jobController')
const { protect } = require('../middleware/auth')

router.get('/', getJobs)
router.get('/my-jobs', protect, getMyJobs)
router.get('/:id', getJobById)
router.post('/', protect, createJob)
router.put('/:id', protect, updateJob)
router.delete('/:id', protect, deleteJob)

module.exports = router