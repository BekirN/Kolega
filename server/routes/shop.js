const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  upload,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
} = require('../controllers/shopController')

router.get('/', getItems)
router.get('/my', protect, getMyItems)
router.get('/:id', getItemById)
router.post('/', protect, upload.array('images', 5), createItem)
router.put('/:id', protect, updateItem)
router.delete('/:id', protect, deleteItem)

module.exports = router