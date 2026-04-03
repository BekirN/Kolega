import api from './axios'

export const getCompanies = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const response = await api.get(`/companies?${params}`)
  return response.data
}

export const getCompanyById = async (id) => {
  const response = await api.get(`/companies/${id}`)
  return response.data
}

export const createReview = async (id, data) => {
  const response = await api.post(`/companies/${id}/reviews`, data)
  return response.data
}