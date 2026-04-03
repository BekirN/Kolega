const express = require('express')
const router = express.Router()
const {
  getCompanies,
  getCompanyById,
  createCompany,
  createInternship,
  createReview
} = require('../controllers/companyController')
const { protect, adminOnly } = require('../middleware/auth')

router.get('/', getCompanies)
router.get('/:id', getCompanyById)
router.post('/', protect, adminOnly, createCompany)
router.post('/:id/internships', protect, adminOnly, createInternship)
router.post('/:id/reviews', protect, createReview)

module.exports = router