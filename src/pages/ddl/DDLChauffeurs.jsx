import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Users, Search, Plus, Edit2, CheckCircle, XCircle, X, Eye,  } from 'lucide-react'

const formVide = {
    nom: '', prenom: '', email: '', 
    role: 'chauffeur', matricule: '', tel: '', nationalite: '',
}

export default function DDLChauffeurs() {
    const [users, setUsers]               = useState([])
    const [loading, setLoading]           = useState(true)
    const [search, setSearch]             = useState('')
    const [message, setMessage]           = useState('')
    const [error, setError]               = useState('')
    const [modalOuvert, setModalOuvert]   = useState(false)
    const [modeEdition, setModeEdition]   = useState(false)
    const [userSelectionne, setUserSelectionne] = useState(null)
    const [form, setForm]                 = useState(formVide)
    const [actionLoading, setActionLoading] = useState(null)
   

    useEffect(() => { fetchChauffeurs() }, [])

    const fetchChauffeurs = async () => {
        try {
            const res = await api.get('/users')
            setUsers(res.data.filter(u => u.role === 'chauffeur'))
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
        role:        'chauffeur',
        matricule:   user.matricule || '',
        tel:         user.tel || '',
        nationalite: user.nationalite || '',
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
        
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
    e.preventDefault()
    setActionLoading('submit')
    try {
        const data = { ...form, role: 'chauffeur' }
        if (modeEdition) {
            await api.put(`/users/${userSelectionne.id}`, data)
            showMsg('Chauffeur modifié avec succès')
        } else {
            const res = await api.post('/users', data)
            const mdp = res.data.mot_de_passe_genere
            showMsg(`Chauffeur créé avec succès. Mot de passe : ${mdp}`)
        }
        fermerModal()
        fetchChauffeurs()
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
            showMsg(user.is_active ? 'Compte désactivé' : 'Compte activé')
        } catch (err) {
            showMsg('Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    const usersFiltres = users.filter(u =>
        search === '' ||
        u.nom?.toLowerCase().includes(search.toLowerCase()) ||
        u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chauffeurs</h1>
                        <p className="text-gray-500 text-sm mt-1">{users.length} chauffeur(s) au total</p>
                    </div>
                    <button onClick={ouvrirCreation}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition">
                        <Plus size={16} /> Nouveau chauffeur
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

                {/* Recherche */}
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom, email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : usersFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Users size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun chauffeur trouvé</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Chauffeur</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Matricule</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Téléphone</th>
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
                                        <td className="px-5 py-4 text-gray-500 text-xs">{u.matricule || '-'}</td>
                                        <td className="px-5 py-4 text-gray-500 text-xs">{u.tel || '-'}</td>
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
                                                {/* Activer / Désactiver */}
                                                <button
                                                    onClick={() => toggleActif(u)}
                                                    disabled={actionLoading === 'toggle_' + u.id}
                                                    title={u.is_active ? 'Désactiver' : 'Activer'}
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

                                                {/* Pas de bouton Supprimer : réservé à l'admin */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal création / édition */}
            {modalOuvert && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">
                                {modeEdition ? 'Modifier un chauffeur' : 'Nouveau chauffeur'}
                            </h2>
                            <button onClick={fermerModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
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

                            

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Matricule</label>
                                    <input name="matricule" value={form.matricule} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                                    <input name="tel" value={form.tel} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
<div>
    <label className="block text-xs font-medium text-gray-600 mb-1">Nationalité</label>
    <input name="nationalite" value={form.nationalite} onChange={handleChange}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                                        : modeEdition ? 'Enregistrer' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}