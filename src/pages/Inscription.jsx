import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bus, User, Mail, Lock, Building2, BadgeCheck, Eye, EyeOff } from 'lucide-react'

export default function Inscription() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        type_profil: '',
        statut: '',
        ufr: '',
        matricule: '',
        tel: '',
        role: 'usager',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'type_profil' && { statut: '' })
        }))
    }

    const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
        
        const data = {
            ...form,
            role: form.type_profil === 'PER' && form.statut === 'permanent'
                ? 'enseignant'
                : 'usager'
        }
        await api.post('/register', data)
        setSuccess(true)
    } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la création du compte')
    } finally {
        setLoading(false)
    }
}

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BadgeCheck size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Compte créé !</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Votre compte a été créé avec succès. Un QR code unique vous a été assigné.
                        Connectez-vous pour accéder à votre espace.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bus size={22} />
                        <span className="font-bold text-lg">UADB Mobilité</span>
                    </div>
                    <button onClick={() => navigate('/login')}
                        className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                        Se connecter
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Créer un compte</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Inscrivez-vous pour réserver la navette UADB
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nom et Prénom */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prénom *
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="prenom" value={form.prenom}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Prénom" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom *
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="nom" value={form.nom}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom" required />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="email" name="email" value={form.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="votre@email.com" required />
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe *
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'}
                                    name="password" value={form.password}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••" required />
                                <button type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Type profil et Statut */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type profil *
                                </label>
                                <select name="type_profil" value={form.type_profil}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required>
                                    <option value="">Choisir...</option>
                                    <option value="PER">PER</option>
                                    <option value="PATS">PATS</option>
                                    <option value="ATR">ATR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut *
                                </label>
                                <select name="statut" value={form.statut}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required>
                                    <option value="">Choisir...</option>
                                    {form.type_profil === 'PER' ? (
                                        <option value="permanent">Permanent</option>
                                    ) : (
                                        <>
                                            <option value="permanent">Permanent</option>
                                            <option value="non_permanent">Non permanent</option>
                                            <option value="contractuel">Contractuel</option>
                                            <option value="vacataire">Vacataire</option>
                                        </>
                                    )}
                                </select>
                                {form.type_profil === 'PER' && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Les PER sont automatiquement enregistrés comme Permanent.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* UFR */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                UFR *
                            </label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select name="ufr" value={form.ufr}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required>
                                    <option value="">Sélectionnez votre UFR</option>
                                    <option value="SATIC">UFR SATIC</option>
                                    <option value="SDD">UFR SDD</option>
                                    <option value="ECOMIJ">UFR ECOMIJ</option>
                                    <option value="ISFAR">UFR ISFAR</option>
                                </select>
                            </div>
                        </div>

                        {/* Matricule et Tel */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Matricule
                                </label>
                                <input type="text" name="matricule" value={form.matricule}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optionnel" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Téléphone
                                </label>
                                <input type="text" name="tel" value={form.tel}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="77 000 00 00" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Création...
                                </>
                            ) : 'Créer mon compte'}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Déjà un compte ?{' '}
                            <button type="button" onClick={() => navigate('/login')}
                                className="text-blue-700 font-semibold hover:underline">
                                Se connecter
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}