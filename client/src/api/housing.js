import api from './axios'

export const getListings = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const res = await api.get(`/housing?${params}`)
  return res.data
}

export const getListingById = async (id) => {
  const res = await api.get(`/housing/${id}`)
  return res.data
}

export const createListing = async (data) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, val]) => {
    if (key === 'images') {
      val.forEach(img => formData.append('images', img))
    } else if (val !== undefined && val !== null) {
      formData.append(key, val)
    }
  })
  const res = await api.post('/housing', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const updateListing = async (id, data) => {
  const res = await api.put(`/housing/${id}`, data)
  return res.data
}

export const deleteListing = async (id) => {
  const res = await api.delete(`/housing/${id}`)
  return res.data
}

export const getMyListings = async () => {
  const res = await api.get('/housing/my')
  return res.data
}