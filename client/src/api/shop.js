import api from './axios'

export const getShopItems = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const response = await api.get(`/shop?${params}`)
  return response.data
}

export const getShopItemById = async (id) => {
  const response = await api.get(`/shop/${id}`)
  return response.data
}

export const createShopItem = async (data) => {
  const response = await api.post('/shop', data)
  return response.data
}

export const updateShopItem = async (id, data) => {
  const response = await api.put(`/shop/${id}`, data)
  return response.data
}

export const deleteShopItem = async (id) => {
  const response = await api.delete(`/shop/${id}`)
  return response.data
}

export const getMyShopItems = async () => {
  const response = await api.get('/shop/my-items')
  return response.data
}