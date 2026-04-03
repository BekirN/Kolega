import api from './axios'

export const getTutors = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString()
  const response = await api.get(`/tutoring?${params}`)
  return response.data
}

export const getTutorById = async (id) => {
  const response = await api.get(`/tutoring/${id}`)
  return response.data
}

export const createTutorProfile = async (data) => {
  const response = await api.post('/tutoring/profile', data)
  return response.data
}

export const createBooking = async (id, data) => {
  const response = await api.post(`/tutoring/${id}/book`, data)
  return response.data
}

export const getMyBookings = async () => {
  const response = await api.get('/tutoring/my-bookings')
  return response.data
}

export const getTutorBookings = async () => {
  const response = await api.get('/tutoring/my-tutor-bookings')
  return response.data
}

export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.put(`/tutoring/bookings/${bookingId}/status`, { status })
  return response.data
}

export const createTutorReview = async (id, data) => {
  const response = await api.post(`/tutoring/${id}/reviews`, data)
  return response.data
}