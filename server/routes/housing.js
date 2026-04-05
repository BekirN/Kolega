const express = require('express')
const router = express.Router()
const housingController = require('../controllers/housingController')
const { protect } = require('../middleware/auth')

router.get('/my', protect, housingController.getMyListings)
router.get('/', housingController.getListings)
router.get('/:id', housingController.getListingById)
router.post('/', protect, housingController.upload.array('images', 8), housingController.createListing)
router.put('/:id', protect, housingController.updateListing)
router.delete('/:id', protect, housingController.deleteListing)

module.exports = router