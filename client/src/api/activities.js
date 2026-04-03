import api from './axios'

export const getActivities = async () => {
  const response = await api.get('/activities')
  return response.data
}

export const getUnreadCount = async () => {
  const response = await api.get('/activities/unread-count')
  return response.data
}

export const markAllAsRead = async () => {
  const response = await api.put('/activities/mark-all-read')
  return response.data
}

export const markActivityAsRead = async (id) => {
  const response = await api.put(`/activities/${id}/read`)
  return response.data
}