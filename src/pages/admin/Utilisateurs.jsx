import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Users, Plus, Power, X, Check, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'

const roleLabels = {
    ddl: 'Demandeur (DDL)',
    drh: 'DRH',
    sg_drh: 'SG - DRH',
    chauffeur: 'Chauffeur',
    sg_vr: 'SG - Vice-Recteur',
    vice_recteur: 'Vice-Recteur',
    admin: 'Administrateur',
    enseignant: 'Enseignant',
    usager: 'Usager Navette',
     chef_departement: 'Chef de Departement',   
    directeur_ufr: 'Directeur UFR',             
    recteur: 'Recteur',
}

const roleColors = {
    ddl: 'bg-blue-100 text-blue-700',
    drh: 'bg-purple-100 text-purple-700',
    sg_drh: 'bg-indigo-100 text-indigo-700',
    chauffeur: 'bg-yellow-100 text-yellow-700',
    sg_vr: 'bg-orange-100 text-orange-700',
    vice_recteur: 'bg-red-100 text-red-700',
    admin: 'bg-gray-100 text-gray-700',
    enseignant: 'bg-green-100 text-green-700',
    usager: 'bg-teal-100 text-teal-700',
    chef_departement: 'bg-cyan-100 text-cyan-700',   
    directeur_ufr: 'bg-lime-100 text-lime-700',       
    recteur: 'bg-rose-100 text-rose-700',
}

// Rôles qui ont besoin de type_profil, statut, ufr
const rolesAvecProfil = ['ddl', 'usager', 'enseignant']

export default function AdminUtilisateurs() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [modalQR, setModalQR] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        role: 'usager',
        type_profil: '',
        statut: '',
        ufr: '',
        matricule: '',
        tel: '',
    })

    useEffect(() => {
        chargerUsers()
    }, [])

    const chargerUsers = () => {
        api.get('/users')
            .then(res => setUsers(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const resetForm = () => {
        setForm({
            nom: '', prenom: '', email: '', password: '',
            role: 'usager', type_profil: '', statut: '',
            ufr: '', matricule: '', tel: '',
        })
        setError('')
    }

    const creerUser = async () => {
        if (!form.nom || !form.prenom || !form.email || !form.password) {
            setError('Veuillez remplir tous les champs obligatoires')
            return
        }
        if (form.role === 'usager' && (!form.type_profil || !form.statut || !form.ufr)) {
            setError('Pour un usager, type profil, statut et UFR sont obligatoires')
            return
        }
        setActionLoading('create')
        setError('')
        try {
            await api.post('/register', form)
            setSuccess('Utilisateur créé avec succès !')
            setModal(false)
            resetForm()
            chargerUsers()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la création')
        } finally {
            setActionLoading(null)
        }
    }

    const toggleActive = async (id) => {
        setActionLoading(id)
        try {
            await api.patch(`/users/${id}/toggle-active`)
            chargerUsers()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const usagers = users.filter(u => u.role === 'usager')
    const autresUsers = users.filter(u => u.role !== 'usager')

    const renderTable = (liste, titre) => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">{titre} ({liste.length})</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Utilisateur</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Rôle</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Profil</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Statut</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {liste.length === 0 ? (
                            <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Aucun utilisateur</td></tr>
                        ) : liste.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-700 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {user.prenom?.[0]}{user.nom?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{user.prenom} {user.nom}</p>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                        {roleLabels[user.role] || user.role}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-sm text-gray-600">{user.type_profil || '—'}</p>
                                    <p className="text-xs text-gray-400">{user.ufr || '—'}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {user.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(user.id)}
                                            disabled={actionLoading === user.id}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                                                user.is_active
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                        >
                                            {actionLoading === user.id
                                                ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                : <Power size={12} />
                                            }
                                            {user.is_active ? 'Désactiver' : 'Activer'}
                                        </button>

                                        {/* Bouton QR pour les usagers */}
                                        {user.role === 'usager' && user.qr_code && (
                                            <button
                                                onClick={() => setModalQR(user)}
                                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition"
                                            >
                                                <QrCode size={12} />
                                                QR
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    return (
        <Layout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
                        <p className="text-gray-500 text-sm mt-1">{users.length} utilisateur(s)</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setModal(true) }}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                        <Plus size={18} />
                        Nouvel utilisateur
                    </button>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <Check size={16} /> {success}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {renderTable(usagers, '👥 Usagers Navette')}
                        {renderTable(autresUsers, '⚙️ Autres utilisateurs')}
                    </div>
                )}
            </div>

            {/* Modal QR usager */}
            {modalQR && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">
                                QR — {modalQR.prenom} {modalQR.nom}
                            </h2>
                            <button onClick={() => setModalQR(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{modalQR.email}</p>
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                <QRCode value={modalQR.qr_code} size={180} level="H" />
                            </div>
                        </div>
                        <p className="font-mono text-sm font-bold text-gray-600 tracking-widest">
                            {modalQR.qr_code}
                        </p>
                    </div>
                </div>
            )}

            {/* Modal créer utilisateur */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-800">Nouvel utilisateur</h2>
                            <button onClick={() => { setModal(false); setError('') }} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input type="text" value={form.prenom}
                                        onChange={e => setForm({ ...form, prenom: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                    <input type="text" value={form.nom}
                                        onChange={e => setForm({ ...form, nom: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input type="email" value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                                <input type="password" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                                <select value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {Object.entries(roleLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Champs profil pour usager, ddl, enseignant */}
                            {rolesAvecProfil.includes(form.role) && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Type profil {form.role === 'usager' ? '*' : ''}
                                            </label>
                                            <select value={form.type_profil}
                                                onChange={e => setForm({ ...form, type_profil: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner</option>
                                                <option value="PER">PER</option>
                                                <option value="PATS">PATS</option>
                                                <option value="ATR">ATR</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Statut {form.role === 'usager' ? '*' : ''}
                                            </label>
                                            <select value={form.statut}
                                                onChange={e => setForm({ ...form, statut: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner</option>
                                                <option value="permanent">Permanent</option>
                                                <option value="non_permanent">Non permanent</option>
                                                <option value="contractuel">Contractuel</option>
                                                <option value="vacataire">Vacataire</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                UFR {form.role === 'usager' ? '*' : ''}
                                            </label>
                                            <select value={form.ufr}
                                                onChange={e => setForm({ ...form, ufr: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner</option>
                                                <option value="SATIC">SATIC</option>
                                                <option value="SDD">SDD</option>
                                                <option value="ECOMIJ">ECOMIJ</option>
                                                <option value="ISFAR">ISFAR</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                                            <input type="text" value={form.matricule}
                                                onChange={e => setForm({ ...form, matricule: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input type="text" value={form.tel}
                                    onChange={e => setForm({ ...form, tel: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="77 000 00 00" />
                            </div>

                            {/* Info QR pour usager */}
                            {form.role === 'usager' && (
                                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-700 flex items-center gap-2">
                                    <QrCode size={16} />
                                    Un QR code unique sera généré automatiquement pour cet usager
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setModal(false); setError('') }}
                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                            <button onClick={creerUser} disabled={actionLoading === 'create'}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {actionLoading === 'create' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}