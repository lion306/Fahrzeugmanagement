import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Vehicle API
export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  search: (query) => api.get(`/vehicles/search?query=${encodeURIComponent(query)}`)
}

// Phase API
export const phaseApi = {
  get: (vehicleId) => api.get(`/phases/${vehicleId}`),
  update: (vehicleId, data) => api.put(`/phases/${vehicleId}`, data)
}

// Delay API
export const delayApi = {
  getStats: () => api.get('/delays/stats'),
  getActive: () => api.get('/delays/active'),
  getAll: () => api.get('/delays'),
  getByVehicle: (vehicleId) => api.get(`/delays/vehicle/${vehicleId}`),
  resolve: (id) => api.put(`/delays/${id}/resolve`)
}

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  getDelayThresholds: () => api.get('/settings/delay-thresholds'),
  updateDelayThresholds: (thresholds) => api.put('/settings/delay-thresholds/update', thresholds),
  getCalculationMode: () => api.get('/settings/calculation-mode'),
  updateCalculationMode: (mode) => api.put('/settings/calculation-mode/update', { mode })
}

// PDF API
export const pdfApi = {
  generate: (vehicleId) => api.get(`/pdf/generate/${vehicleId}`, { responseType: 'blob' }),
  getTemplates: () => api.get('/pdf/templates'),
  getActiveTemplate: () => api.get('/pdf/templates/active'),
  uploadTemplate: (formData) => api.post('/pdf/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  activateTemplate: (id) => api.put(`/pdf/templates/${id}/activate`),
  deleteTemplate: (id) => api.delete(`/pdf/templates/${id}`)
}

// Auth API
export const authApi = {
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword })
}

export default api
