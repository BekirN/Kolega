import api from './axios'

export const sendConnectionRequest = async (userId) => {
  const response = await api.post(`/connections/request/${userId}`)
  return response.data
}

export const respondToRequest = async (connectionId, action) => {
  const response = await api.put(`/connections/respond/${connectionId}`, { action })
  return response.data
}

export const getConnectionStatus = async (userId) => {
  const response = await api.get(`/connections/status/${userId}`)
  return response.data
}

export const getPendingRequests = async () => {
  const response = await api.get('/connections/pending')
  return response.data
}

export const getConnections = async () => {
  const response = await api.get('/connections')
  return response.data
}

export const getActivities = async () => {
  const response = await api.get('/connections/activities')
  return response.data
}
