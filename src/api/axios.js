import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
    }
})

// Ajouter le token automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    
    // ✅ NE PAS définir Content-Type pour les FormData
    // Le navigateur le définit automatiquement avec le boundary
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