import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { Bus, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ReinitialiserMotDePasse() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''
    const email = searchParams.get('email') || ''

    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas')
            return
        }
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        setLoading(true)
        try {
            await api.post('/reset-password', {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            })
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réinitialisation')
        } finally {
            setLoading(false)
        }
    }

    if (!token || !email) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Lien invalide</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Ce lien de réinitialisation est incomplet ou invalide. Veuillez en redemander un nouveau.
                    </p>
                    <Link to="/mot-de-passe-oublie"
                        className="block w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition">
                        Redemander un lien
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-md mx-auto flex items-center gap-2">
                    <Bus size={22} />
                    <span className="font-bold text-lg">UADB Mobilité</span>
                </div>
            </div>

            <div className="max-w-md mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">

                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-700 mb-2">Mot de passe réinitialisé !</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition"
                            >
                                Se connecter
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Nouveau mot de passe</h1>
                            <p className="text-gray-500 text-sm mb-6">
                                Choisissez un nouveau mot de passe pour <span className="font-semibold">{email}</span>
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="••••••••" required />
                                        <button type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type={showPassword ? 'text' : 'password'}
                                            value={passwordConfirmation}
                                            onChange={e => setPasswordConfirmation(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="••••••••" required />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Réinitialisation...
                                        </>
                                    ) : 'Réinitialiser le mot de passe'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}