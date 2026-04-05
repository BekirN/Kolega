const express = require('express')
const router = express.Router()
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  uploadFile,
  upload,
  createGroupChat,
  getConversationMedia,
  addGroupMember,
  leaveGroup,
  getUnreadMessagesCount,
} = require('../controllers/chatController')
const { protect } = require('../middleware/auth')

router.get('/conversations', protect, getConversations)
router.get('/conversations/:conversationId/messages', protect, getMessages)
router.get('/conversations/:conversationId/media', protect, getConversationMedia)
router.post('/conversations/with/:userId', protect, getOrCreateConversation)
router.post('/conversations/group', protect, createGroupChat)
router.post('/conversations/:conversationId/members', protect, addGroupMember)
router.delete('/conversations/:conversationId/leave', protect, leaveGroup)
router.post('/upload', protect, upload.single('file'), uploadFile)
router.get('/unread-count', protect, getUnreadMessagesCount)

module.exports = router