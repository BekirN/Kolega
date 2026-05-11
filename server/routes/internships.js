const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  upload,
  joinCompany, getMyCompanies,
  createInternship, updateInternship, deleteInternship, getCompanyInternships,
  applyToInternship, getMyApplications, getCompanyApplications,
  updateApplicationStatus, withdrawApplication,
} = require('../controllers/internshipController')

// Company membership
router.post('/join', protect, joinCompany)
router.get('/my-companies', protect, getMyCompanies)

// Internships
router.post('/', protect, createInternship)
router.put('/:id', protect, updateInternship)
router.delete('/:id', protect, deleteInternship)
router.get('/company/:companyId', getCompanyInternships)

// Applications
router.post('/:id/apply', protect, upload.single('cv'), applyToInternship)
router.get('/my-applications', protect, getMyApplications)
router.get('/company/:companyId/applications', protect, getCompanyApplications)
router.put('/applications/:applicationId/status', protect, updateApplicationStatus)
router.delete('/applications/:applicationId', protect, withdrawApplication)

module.exports = router