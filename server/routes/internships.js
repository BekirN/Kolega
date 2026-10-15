const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  upload,
  getMyCompanies,
  createInternship, updateInternship, deleteInternship, getCompanyInternships,
  applyToInternship, getMyApplications, getCompanyApplications,
  downloadApplicationCv, updateApplicationStatus, withdrawApplication,
} = require('../controllers/internshipController')

// Company membership
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
router.get('/applications/:applicationId/cv', protect, downloadApplicationCv)
router.put('/applications/:applicationId/status', protect, updateApplicationStatus)
router.delete('/applications/:applicationId', protect, withdrawApplication)

module.exports = router
