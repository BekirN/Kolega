import api from './axios'

export const getFolders = async () => {
  const res = await api.get('/materials/folders')
  return res.data
}

export const createFolder = async (data) => {
  const res = await api.post('/materials/folders', data)
  return res.data
}

export const deleteFolder = async (id) => {
  const res = await api.delete(`/materials/folders/${id}`)
  return res.data
}

export const getMyMaterials = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const res = await api.get(`/materials/my?${params}`)
  return res.data
}

export const getSavedMaterials = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const res = await api.get(`/materials/saved?${params}`)
  return res.data
}

export const getPublicMaterials = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const res = await api.get(`/materials/public?${params}`)
  return res.data
}

export const uploadMaterial = async (data) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) formData.append(key, val)
  })
  const res = await api.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const saveMaterial = async (materialId, data = {}) => {
  const res = await api.post(`/materials/save/${materialId}`, data)
  return res.data
}

export const unsaveMaterial = async (materialId) => {
  const res = await api.delete(`/materials/unsave/${materialId}`)
  return res.data
}

export const deleteMaterial = async (id) => {
  const res = await api.delete(`/materials/${id}`)
  return res.data
}

export const togglePublic = async (id) => {
  const res = await api.put(`/materials/${id}/toggle-public`)
  return res.data
}

export const moveMaterial = async (id, folderId) => {
  const res = await api.put(`/materials/${id}/move`, { folderId })
  return res.data
}