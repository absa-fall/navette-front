import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, X, Eye, EyeOff } from 'lucide-react'

const ROLES = [
    { value: 'admin',            label: 'Administrateur' },
    { value: 'ddl',              label: 'DDL' },
    { value: 'drh',              label: 'DRH' },
    { value: 'sg_drh',           label: 'SG - DRH' },
    { value: 'chauffeur',        label: 'Chauffeur' },
    { value: 'sg_vr',            label: 'SG - Vice-Recteur' },
    { value: 'vice_recteur',     label: 'Vice-Recteur' },
    { value: 'recteur',          label: 'Recteur' },
    { value: 'chef_departement', label: 'Chef de Département' },
    { value: 'directeur_ufr',    label: 'Directeur UFR' },
    { value: 'commission',       label: 'Commission' },
    { value: 'enseignant',       label: 'Enseignant' },
]

const UFR_OPTIONS = ['SATIC', 'SDD', 'ECOMIJ', 'ISFAR']

const TYPE_PROFIL_OPTIONS = [
    { value: 'PER',       label: 'PER' },
    { value: 'PATS',      label: 'PATS' },
    { value: 'ATR',       label: 'ATR' },
    { value: 'Vacataire', label: 'Vacataire' },
]

const STATUT_OPTIONS = [
    { value: 'permanent',      label: 'Permanent' },
    { value: 'non_permanent',  label: 'Non permanent' },
    { value: 'contractuel',    label: 'Contractuel' },
    { value: 'vacataire',      label: 'Vacataire' },
]

const formVide = {
    nom: '', prenom: '', email: '', password: '',
    role: '', type_profil: '', statut: '', ufr: '',
    matricule: '', tel: '',
}

export default function AdminUtilisateurs() {
    const [users, setUsers]               = useState([])
    const [loading, setLoading]           = useState(true)
    const [search, setSearch]             = useState('')
    const [filtreRole, setFiltreRole]     = useState('')
    const [message, setMessage]           = useState('')
    const [error, setError]               = useState('')
    const [modalOuvert, setModalOuvert]   = useState(false)
    const [modeEdition, setModeEdition]   = useState(false)
    const [userSelectionne, setUserSelectionne] = useState(null)
    const [form, setForm]                 = useState(formVide)
    const [actionLoading, setActionLoading] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(null)

    useEffect(() => { fetchUsers() }, [])

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users')
            setUsers(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 3000)
    }

    const ouvrirCreation = () => {
        setForm(formVide)
        setModeEdition(false)
        setUserSelectionne(null)
        setModalOuvert(true)
    }

    const ouvrirEdition = (user) => {
        setForm({
            nom:         user.nom || '',
            prenom:      user.prenom || '',
            email:       user.email || '',
            password:    '',
            role:        user.role || '',
            type_profil: user.type_profil || '',
            statut:      user.statut || '',
            ufr:         user.ufr || '',
            matricule:   user.matricule || '',
            tel:         user.tel || '',
        })
        setUserSelectionne(user)
        setModeEdition(true)
        setModalOuvert(true)
    }

    const fermerModal = () => {
        setModalOuvert(false)
        setForm(formVide)
        setUserSelectionne(null)
        setModeEdition(false)
        setShowPassword(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setActionLoading('submit')
        try {
            if (modeEdition) {
                await api.put(`/users/${userSelectionne.id}`, form)
                showMsg('Utilisateur modifie avec succes')
            } else {
                await api.post('/users', form)
                showMsg('Utilisateur cree avec succes')
            }
            fermerModal()
            fetchUsers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur lors de la sauvegarde', true)
        } finally {
            setActionLoading(null)
        }
    }

    const toggleActif = async (user) => {
        setActionLoading('toggle_' + user.id)
        try {
            await api.patch(`/users/${user.id}/toggle-active`)
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, is_active: !u.is_active } : u
            ))
            showMsg(user.is_active ? 'Compte desactive' : 'Compte active')
        } catch (err) {
            showMsg('Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    const supprimerUser = async (user) => {
        if (!confirm(`Supprimer ${user.prenom} ${user.nom} ? Cette action est irreversible.`)) return
        setDeleteLoading(user.id)
        try {
            await api.delete(`/users/${user.id}`)
            setUsers(prev => prev.filter(u => u.id !== user.id))
            showMsg('Utilisateur supprime')
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur lors de la suppression', true)
        } finally {
            setDeleteLoading(null)
        }
    }

    const usersFiltres = users.filter(u => {
        const matchSearch = search === '' ||
            u.nom?.toLowerCase().includes(search.toLowerCase()) ||
            u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        const matchRole = filtreRole === '' || u.role === filtreRole
        return matchSearch && matchRole
    })

    const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
                        <p className="text-gray-500 text-sm mt-1">{users.length} utilisateur(s) au total</p>
                    </div>
                    <button onClick={ouvrirCreation}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition">
                        <Plus size={16} /> Nouvel utilisateur
                    </button>
                </div>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <XCircle size={16} /> {error}
                    </div>
                )}

                {/* Filtres */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, prenom, email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous les roles</option>
                        {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : usersFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Users size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun utilisateur trouve</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">UFR</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {usersFiltres.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                                                    {u.prenom?.[0]}{u.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{u.prenom} {u.nom}</p>
                                                    <p className="text-xs text-gray-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                                {getRoleLabel(u.role)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 text-xs">{u.ufr || '-'}</td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                u.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {u.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Activer / Desactiver */}
                                                <button
                                                    onClick={() => toggleActif(u)}
                                                    disabled={actionLoading === 'toggle_' + u.id}
                                                    title={u.is_active ? 'Desactiver' : 'Activer'}
                                                    className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                                                        u.is_active
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-gray-400 hover:bg-gray-100'
                                                    }`}>
                                                    {actionLoading === 'toggle_' + u.id
                                                        ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                        : u.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                </button>

                                                {/* Modifier */}
                                                <button
                                                    onClick={() => ouvrirEdition(u)}
                                                    title="Modifier"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit2 size={16} />
                                                </button>

                                                {/* Supprimer */}
                                                <button
                                                    onClick={() => supprimerUser(u)}
                                                    disabled={deleteLoading === u.id}
                                                    title="Supprimer"
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                    {deleteLoading === u.id
                                                        ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                        : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal creation / edition */}
            {modalOuvert && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">
                                {modeEdition ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}
                            </h2>
                            <button onClick={fermerModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Prenom</label>
                                    <input name="prenom" value={form.prenom} onChange={handleChange} required
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                                    <input name="nom" value={form.nom} onChange={handleChange} required
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required
                                    disabled={modeEdition}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {modeEdition ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                                </label>
                                <div className="relative">
                                    <input name="password" type={showPassword ? 'text' : 'password'}
                                        value={form.password} onChange={handleChange}
                                        required={!modeEdition}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                                <select name="role" value={form.role} onChange={handleChange} required
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Choisir un role...</option>
                                    {ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type profil</label>
                                    <select name="type_profil" value={form.type_profil} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Aucun</option>
                                        {TYPE_PROFIL_OPTIONS.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                                    <select name="statut" value={form.statut} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Aucun</option>
                                        {STATUT_OPTIONS.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">UFR</label>
                                <select name="ufr" value={form.ufr} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Aucune</option>
                                    {UFR_OPTIONS.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Matricule</label>
                                    <input name="matricule" value={form.matricule} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Telephone</label>
                                    <input name="tel" value={form.tel} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={fermerModal}
                                    className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                                    Annuler
                                </button>
                                <button type="submit" disabled={actionLoading === 'submit'}
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                                    {actionLoading === 'submit'
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : modeEdition ? 'Enregistrer' : 'Creer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}