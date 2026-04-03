const express = require('express')
const router = express.Router()
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
} = require('../controllers/shopController')
const { protect } = require('../middleware/auth')

router.get('/', getItems)
router.get('/my-items', protect, getMyItems)
router.get('/:id', getItemById)
router.post('/', protect, createItem)
router.put('/:id', protect, updateItem)
router.delete('/:id', protect, deleteItem)

module.exports = router
