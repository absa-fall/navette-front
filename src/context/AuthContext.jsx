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
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    setUser(null)
                })
                .finally(() => setLoading(false)) 
        } else {
            setLoading(false) 
        }
    }, [])

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { email, password })
            const { user, token } = response.data
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            setUser(user)
            return user
        } catch (error) {
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