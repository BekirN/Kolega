const express = require('express')
const router = express.Router()
const {
  getPosts, getPostById, createPost, deletePost,
  createComment, deleteComment,
  getEvents, createEvent, attendEvent,
} = require('../controllers/communityController')
const { protect, adminOnly } = require('../middleware/auth')
const { upload } = require('../controllers/communityController')
// Postovi
router.get('/posts', getPosts)
router.get('/posts/:id', getPostById)
router.post('/posts', protect, upload.array('images', 4), createPost)
router.delete('/posts/:id', protect, deletePost)

// Komentari
router.post('/posts/:id/comments', protect, createComment)
router.delete('/posts/:id/comments/:commentId', protect, deleteComment)

// Eventi
router.get('/events', getEvents)
router.post('/events', protect, adminOnly, createEvent)
router.post('/events/:id/attend', protect, attendEvent)

module.exports = router