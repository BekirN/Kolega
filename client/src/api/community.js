import api from './axios'

export const getPosts = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const response = await api.get(`/community/posts?${params}`)
  return response.data
}

export const getPostById = async (id) => {
  const response = await api.get(`/community/posts/${id}`)
  return response.data
}

export const createPost = async (data) => {
  const formData = new FormData()
  formData.append('content', data.content)
  if (data.title) formData.append('title', data.title)
  if (data.category) formData.append('category', data.category)
  if (data.images) {
    data.images.forEach(img => formData.append('images', img))
  }
  const response = await api.post('/community/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const deletePost = async (id) => {
  const response = await api.delete(`/community/posts/${id}`)
  return response.data
}

export const createComment = async (id, data) => {
  const response = await api.post(`/community/posts/${id}/comments`, data)
  return response.data
}

export const deleteComment = async (postId, commentId) => {
  const response = await api.delete(`/community/posts/${postId}/comments/${commentId}`)
  return response.data
}

export const getEvents = async () => {
  const response = await api.get('/community/events')
  return response.data
}

export const attendEvent = async (id) => {
  const response = await api.post(`/community/events/${id}/attend`)
  return response.data
}