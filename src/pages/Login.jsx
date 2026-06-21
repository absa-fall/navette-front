import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, Bus } from 'lucide-react'

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
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">

            {/* Panneau gauche */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Bus className="text-white" size={28} />
                    </div>
                    <span className="text-white font-bold text-xl">UADB Mobilité</span>
                </div>
                <div>
                    <h2 className="text-white text-4xl font-bold leading-tight mb-4">
                        Gestion des navettes et voyages d'études
                    </h2>
                    <p className="text-blue-200 text-lg">
                        Université Alioune Diop de Bambey — Plateforme de mobilité universitaire
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-white font-bold text-2xl">7</p>
                        <p className="text-blue-200 text-sm">Rôles utilisateurs</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-white font-bold text-2xl">2</p>
                        <p className="text-blue-200 text-sm">Modules principaux</p>
                    </div>
                </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
    Pas encore de compte ?{' '}
    <button onClick={() => navigate('/inscription')}
        className="text-blue-700 font-semibold hover:underline">
        S'inscrire
    </button>
</p>

            {/* Panneau droit */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">

                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="bg-blue-700 p-2 rounded-xl">
                            <Bus className="text-white" size={24} />
                        </div>
                        <span className="text-blue-900 font-bold text-lg">UADB Mobilité</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Connexion</h1>
                    <p className="text-gray-500 mb-8">Connectez-vous à votre espace</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm flex items-center gap-2">
                            <span> </span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    placeholder="votre@uadb.edu.sn"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                
                            </div>
                             <div className="text-right mt-1.5">
                                <Link to="/mot-de-passe-oublie" className="text-sm text-blue-700 hover:underline">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Connexion...
                                </>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <div className="mt-8 p-4 bg-white border border-gray-200 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Comptes de test</p>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            <p>• ddl@uadb.edu.sn</p>
                            <p>• drh@uadb.edu.sn</p>
                            <p>• sg.drh@uadb.edu.sn</p>
                            <p>• chauffeur@uadb.edu.sn</p>
                            <p>• sg.vr@uadb.edu.sn</p>
                            <p>• vr@uadb.edu.sn</p>
                            <p>• enseignant@uadb.edu.sn</p>
                            <p>• vacataire@uadb.edu.sn</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">🔑 Mot de passe : <strong>password</strong></p>
                    </div>
                </div>
            </div>
        </div>
    )
}