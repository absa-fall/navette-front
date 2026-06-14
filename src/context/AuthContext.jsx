import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        const savedToken = localStorage.getItem('token')

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser))
            api.get('/me')
                .then(res => {
                    const freshUser = res.data.user
                    localStorage.setItem('user', JSON.stringify(freshUser))
                    setUser(freshUser)
                })
                .catch((err) => {
                    console.error('Erreur /me:', err.response?.data || err.message)
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    setUser(null)
                })
                .finally(() => setLoading(false)) // ✅ attend la fin de /me
        } else {
            setLoading(false) // ✅ pas de token, on arrête directement
        }
    }, [])

    const login = async (email, password) => {
        console.log("Tentative de login avec :", email, password)
        try {
            const response = await api.post('/login', { email, password })
            console.log("Réponse API :", response.data)
            const { user, token } = response.data
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            setUser(user)
            return user
        } catch (error) {
            console.error("Erreur API :", error.response?.data || error.message)
            throw error
        }
    }

    const logout = async () => {
        await api.post('/logout')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)