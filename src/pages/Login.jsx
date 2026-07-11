import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, Bus, ArrowLeft } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
        const user = await login(email, password)
        switch (user.role) {
            case 'ddl': navigate('/ddl/dashboard'); break
            case 'enseignant': navigate('/enseignant/dashboard'); break
            case 'admin': navigate('/admin/dashboard'); break
            case 'drh': navigate('/drh/dashboard'); break
            case 'sg_drh': navigate('/sg-drh/dashboard'); break
            case 'chauffeur': navigate('/chauffeur/dashboard'); break
            case 'sg_vr': navigate('/sg-vr/dashboard'); break
            case 'vice_recteur': navigate('/vice-recteur/dashboard'); break
            case 'usager': navigate('/usager/dashboard'); break
            case 'chef_departement': navigate('/chef-departement/dashboard'); break
            case 'directeur_ufr': navigate('/directeur-ufr/dashboard'); break
            case 'recteur': navigate('/recteur/dashboard'); break
            case 'commission': navigate('/commission/dashboard'); break
            default: navigate('/login'); break
        }
    } catch (err) {
        console.error('DEBUG erreur complète:', err)
        setError(
            err.response?.data?.message
            || err.message
            || 'Erreur inconnue'
        )
    } finally {
        setLoading(false)
    }
}

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">

           <img
    src="/rectorat-uadb.png"
    alt="Rectorat UADB"
    className="absolute inset-0 w-full h-full object-cover"
/>
            {/* Overlay sombre pour lisibilite */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-900/85" />

          {/* Logo en haut */}
<div className="absolute top-6 left-6 z-10 flex items-center gap-3">
    <button
        onClick={() => navigate('/')}
        className="bg-white/15 backdrop-blur-sm p-2 rounded-xl border border-white/20 hover:bg-white/25 transition"
        title="Retour à l'accueil"
    >
        <ArrowLeft className="text-white" size={18} />
    </button>
    <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-white/20">
        <img src="/logo-uadb.png" alt="Logo UADB" className="w-8 h-8 object-contain" />
    </div>
    <span className="text-white font-bold text-lg drop-shadow">UADB Mobilite</span>
</div>

            {/* Carte de connexion semi-transparente */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">

                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Connexion</h1>
                    <p className="text-blue-100 mb-8">Connectez-vous a votre espace</p>

                    {error && (
                        <div className="bg-red-500/20 border border-red-300/40 text-red-50 rounded-xl p-4 mb-6 text-sm flex items-center gap-2 backdrop-blur-sm">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                                    placeholder="votre@uadb.edu.sn"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-white/30 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                                    placeholder="********"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="text-right mt-1.5">
                                <Link to="/mot-de-passe-oublie" className="text-sm text-blue-200 hover:text-white hover:underline">
                                    Mot de passe oublie ?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-blue-800 font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                                    Connexion...
                                </>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-blue-100 mt-6">
                        Pas encore de compte ?{' '}
                        <button
                            onClick={() => navigate('/inscription')}
                            className="text-white font-semibold hover:underline"
                        >
                            S'inscrire
                        </button>
                    </p>

                </div>
            </div>
        </div>
    )
}