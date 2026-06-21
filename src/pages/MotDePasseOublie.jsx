import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bus, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

export default function MotDePasseOublie() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await api.post('/forgot-password', { email })
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi du lien')
        } finally {
            setLoading(false)
        }
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
                            <h2 className="text-xl font-bold text-green-700 mb-2">Email envoyé !</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Si un compte existe avec l'adresse <span className="font-semibold">{email}</span>,
                                un lien de réinitialisation vient de lui être envoyé. Vérifiez votre boîte de réception
                                (et vos spams).
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition"
                            >
                                Retour à la connexion
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition">
                                <ArrowLeft size={16} />
                                Retour à la connexion
                            </button>

                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Mot de passe oublié ?</h1>
                            <p className="text-gray-500 text-sm mb-6">
                                Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="email" value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="votre@email.com" required />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Envoi...
                                        </>
                                    ) : 'Envoyer le lien'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}