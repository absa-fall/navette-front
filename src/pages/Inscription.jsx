import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bus, User, Mail, Lock, Building2, BadgeCheck, Eye, EyeOff, Calendar, BookOpen } from 'lucide-react'

const DEPARTEMENTS_PAR_UFR = {
    SATIC: ['SA', 'TIC'],
    SDD: [],
    ECOMIJ: [],
    ISFAR: [],
}

export default function Inscription() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        type_profil: '',
        statut: '',
        ufr: '',
        departement: '',
        matricule: '',
        tel: '',
        date_embauche: '',
        role: 'usager',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const estPermanent = form.statut === 'permanent'
    const departementsDisponibles = DEPARTEMENTS_PAR_UFR[form.ufr] || []

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: value,
            // Reset departement si UFR change
            ...(name === 'ufr' && { departement: '' }),
            // Reset statut si type_profil change
            ...(name === 'type_profil' && { statut: '', date_embauche: '', departement: '' }),
        }))
    }

    const handleSubmit = async (e) => {
    e.preventDefault()
   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])[A-Za-z\d@$!%*?&._\-#]{8,}$/
if (!passwordRegex.test(form.password)) {
    setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&._-#)')
    return
}
    if (form.password !== form.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
    }
    setLoading(true)
    setError('')
        try {
       const data = {
    ...form,
    role: form.type_profil === 'PER' ? 'enseignant' : 'usager',
    type_profil: form.type_profil === 'Vacataire' ? 'vacataire' : form.type_profil,
    statut: form.type_profil === 'Vacataire' ? 'vacataire' : form.statut,
}
            await api.post('/register', data)
            setSuccess(true)
       } catch (err) {
    console.error('DEBUG erreur complète:', err)
    setError(
        err.response?.data?.message
        || err.message
        || 'Erreur inconnue à l\'inscription'
    )
} finally {
    setLoading(false)
}
    }

   if (success) {
    return (
        <div className="min-h-screen relative flex items-center justify-center p-6">
            <img
                src="/bus1.png"
                alt="Bus UADB"
                className="fixed inset-0 w-full h-full object-cover -z-10"
            />
            <div className="fixed inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/75 to-blue-900/90 -z-10" />
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center relative z-10">
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
    <div className="min-h-screen relative">

       {/* Image de fond fixe */}
<img
    src="/rectorat-uadb.png"
    alt="Rectorat UADB"
    className="fixed inset-0 w-full h-full object-cover -z-10"
/>
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/75 to-blue-900/90 -z-10" />

        {/* Header */}
        <div className="bg-blue-900/70 backdrop-blur-sm text-white p-4 relative z-10">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
    <img src="/logo-uadb.png" alt="Logo UADB" className="w-7 h-7 object-contain bg-white rounded-lg p-0.5" />
    <span className="font-bold text-lg">UADB Mobilité</span>
</div>
                    <button onClick={() => navigate('/login')}
                        className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                        Se connecter
                    </button>
                </div>
            </div>

           <div className="max-w-lg mx-auto p-6 relative z-10">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="prenom" value={form.prenom}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Prénom" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
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
{/* Confirmation mot de passe */}
<div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
    <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type={showPassword ? 'text' : 'password'}
            name="confirmPassword" value={form.confirmPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••" required />
    </div>
</div>
                        {/* Type profil et Statut */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type profil *</label>
                                <select name="type_profil" value={form.type_profil}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required>
                                    <option value="">Choisir...</option>
<option value="PER">PER</option>
<option value="PATS">PATS</option>
<option value="ATR">ATR</option>
<option value="Vacataire">Vacataire</option>
                                </select>
                            </div>
                            <div>
                              {form.type_profil === 'Vacataire' ? (
    <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 italic">
        Vacataire (automatique)
    </div>
) : (
    <select name="statut" value={form.statut}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={form.type_profil !== 'Vacataire'}>
        <option value="">Choisir...</option>
        <option value="permanent">Permanent</option>
        <option value="non_permanent">Non permanent</option>
        <option value="contractuel">Contractuel</option>
        <option value="vacataire">Vacataire</option>
    </select>
)}
                            </div>
                        </div>

                        {/* UFR */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">UFR *</label>
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

                        {/* Département — uniquement si permanent et UFR avec départements connus */}
                        {estPermanent && form.ufr && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Département {departementsDisponibles.length > 0 ? '*' : ''}
                                </label>
                                <div className="relative">
                                    <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    {departementsDisponibles.length > 0 ? (
                                        <select name="departement" value={form.departement}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required>
                                            <option value="">Sélectionnez votre département</option>
                                            {departementsDisponibles.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" name="departement" value={form.departement}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ex: Mathématiques, Physique..." />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Matricule et Tel */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                                <input type="text" name="matricule" value={form.matricule}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optionnel" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input type="text" name="tel" value={form.tel}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="77 000 00 00" />
                            </div>
                        </div>

                        {/* Date d'embauche — uniquement si permanent */}
                        {estPermanent && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="date" name="date_embauche" value={form.date_embauche}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                            </div>
                        )}

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