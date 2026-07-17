import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { Mail, Lock, KeyRound, IdCard, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ActiverCompte() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [matricule, setMatricule] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
if (!passwordRegex.test(password)) {
    setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.')
    return
}
        if (password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/activer-compte', {
                email: email.toLowerCase().trim(),
                code: code.trim(),
                matricule: matricule.trim(),
                password,
                password_confirmation: passwordConfirmation,
            })
            setSuccess(res.data.message || 'Compte activé avec succès.')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'activation')
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-900/85" />

            <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
                <button
                    onClick={() => navigate('/login')}
                    className="bg-white/15 backdrop-blur-sm p-2 rounded-xl border border-white/20 hover:bg-white/25 transition"
                    title="Retour à la connexion"
                >
                    <ArrowLeft className="text-white" size={18} />
                </button>
                <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-white/20">
                    <img src="/logo-uadb.png" alt="Logo UADB" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-white font-bold text-lg drop-shadow">UADB Mobilité</span>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">

                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Activer mon compte</h1>
                    <p className="text-blue-100 mb-8">
                        Utilisez le code reçu par email pour activer votre compte et définir votre mot de passe.
                    </p>

                    {error && (
                        <div className="bg-red-500/20 border border-red-300/40 text-red-50 rounded-xl p-4 mb-6 text-sm flex items-center gap-2 backdrop-blur-sm">
                            <span>⚠️ {error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/20 border border-green-300/40 text-green-50 rounded-xl p-4 mb-6 text-sm flex items-center gap-2 backdrop-blur-sm">
                            <CheckCircle size={16} /> {success}
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
                                    className="w-full border border-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/50"
                                    placeholder="votre@uadb.edu.sn"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Code d'activation
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full border border-white/30 rounded-xl pl-10 pr-4 py-3 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/50"
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Matricule
                            </label>
                            <div className="relative">
                                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                                <input
                                    type="text"
                                    value={matricule}
                                    onChange={(e) => setMatricule(e.target.value)}
                                    className="w-full border border-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/50"
                                    placeholder="Votre matricule"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                               <input
    type={showPassword ? 'text' : 'password'}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full border border-white/30 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/50"
    placeholder="••••••••"
    minLength={8}
    required
/><p className="text-xs text-blue-200/70 mt-1">
    Min. 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial.
</p>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full border border-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/50"
                                    placeholder="••••••••"
                                    minLength={6}
                                    required
                                />
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
                                    Activation...
                                </>
                            ) : 'Activer mon compte'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-blue-100 mt-6">
                        Déjà activé ?{' '}
                        <Link to="/login" className="text-white font-semibold hover:underline">
                            Se connecter
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    )
}