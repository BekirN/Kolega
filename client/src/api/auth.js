import api from './axios'

export const register = async (data) => {
  const response = await api.post('/auth/register', data)
  return response.data
}

export const login = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const getUserProfile = async (id) => {
  const response = await api.get(`/auth/profile/${id}`)
  return response.data
}

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data)
  return response.data
}

export const updateProfileImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await api.put('/auth/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const searchUsers = async (q) => {
  const response = await api.get(`/auth/search?q=${q}`)
  return response.data
}

export const uploadIndexImage = async (file) => {
  const formData = new FormData()
  formData.append('indexImage', file)
  const res = await api.post('/auth/upload-index', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}