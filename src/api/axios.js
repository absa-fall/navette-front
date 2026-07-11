import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    }
})


api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
    } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json'
    }
    
    return config
})

// Gérer les erreurs 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api