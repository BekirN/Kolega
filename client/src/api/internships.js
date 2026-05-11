import api from './axios'

// Company
export const joinCompany = async (companyId, role = 'HR') => {
  const res = await api.post('/internships/join', { companyId, role })
  return res.data
}

export const getMyCompanies = async () => {
  const res = await api.get('/internships/my-companies')
  return res.data
}

// Internships
export const createInternship = async (data) => {
  const res = await api.post('/internships', data)
  return res.data
}

export const updateInternship = async (id, data) => {
  const res = await api.put(`/internships/${id}`, data)
  return res.data
}

export const deleteInternship = async (id) => {
  const res = await api.delete(`/internships/${id}`)
  return res.data
}

export const getCompanyInternships = async (companyId) => {
  const res = await api.get(`/internships/company/${companyId}`)
  return res.data
}

// Applications
export const applyToInternship = async (internshipId, data) => {
  const formData = new FormData()
  if (data.coverLetter) formData.append('coverLetter', data.coverLetter)
  if (data.cv) formData.append('cv', data.cv)
  const res = await api.post(`/internships/${internshipId}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const getMyApplications = async () => {
  const res = await api.get('/internships/my-applications')
  return res.data
}

export const getCompanyApplications = async (companyId) => {
  const res = await api.get(`/internships/company/${companyId}/applications`)
  return res.data
}

export const updateApplicationStatus = async (applicationId, status, notes) => {
  const res = await api.put(`/internships/applications/${applicationId}/status`, { status, notes })
  return res.data
}

export const withdrawApplication = async (applicationId) => {
  const res = await api.delete(`/internships/applications/${applicationId}`)
  return res.data
}