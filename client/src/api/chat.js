import api from './axios'

export const getConversations = async () => {
  const response = await api.get('/chat/conversations')
  return response.data
}

export const getOrCreateConversation = async (userId) => {
  const response = await api.post(`/chat/conversations/with/${userId}`)
  return response.data
}

export const getMessages = async (conversationId) => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`)
  return response.data
}

export const getConversationMedia = async (conversationId) => {
  const response = await api.get(`/chat/conversations/${conversationId}/media`)
  return response.data
}

export const createGroupChat = async (data) => {
  const response = await api.post('/chat/conversations/group', data)
  return response.data
}

export const addGroupMember = async (conversationId, userId) => {
  const response = await api.post(`/chat/conversations/${conversationId}/members`, { userId })
  return response.data
}

export const leaveGroup = async (conversationId) => {
  const response = await api.delete(`/chat/conversations/${conversationId}/leave`)
  return response.data
}

export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}
export const getUnreadMessagesCount = async () => {
  const res = await api.get('/chat/unread-count')
  return res.data
}