import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Calendar, FileText, CheckCircle, Building2, ShieldCheck, Clock, XCircle, ChevronDown, ChevronUp, Trash2, AlertCircle, Eye } from 'lucide-react'

const statutConfig = {
    soumise:               { label: 'En attente Chef Dép',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    avis_chef_departement: { label: 'Chez Directeur UFR',    color: 'bg-orange-100 text-orange-700', icon: Clock },
    avis_directeur_ufr:    { label: 'Chez le Recteur',       color: 'bg-purple-100 text-purple-700', icon: Clock },
    signee_recteur:        { label: 'Signée par le Recteur', color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
    transmise_vr:          { label: 'Approuvée ✓',           color: 'bg-green-100 text-green-700',   icon: CheckCircle },
    rejete:                { label: 'Rejetée',               color: 'bg-red-100 text-red-700',       icon: XCircle },
}

export default function DemandeAutorisationAbsence() {
    const navigate = useNavigate()
    const { beneficiaireId } = useParams()

    const [form, setForm] = useState({
        motif_mission:    "Voyage d'étude",
        lieu_deplacement: '',
        periode_debut:    '',
        periode_fin:      '',
        organisme_charge: "Université Alioune Diop de Bambey (Voyage d'études)",
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError]     = useState('')

    const [autorisations, setAutorisations] = useState([])
    const [loadingList, setLoadingList]     = useState(true)
    const [expanded, setExpanded]           = useState(null)
    const [selected, setSelected]           = useState([])
    const [deleteMsg, setDeleteMsg]         = useState('')

    useEffect(() => {
        api.get('/autorisations-absence')
            .then(r => setAutorisations(r.data))
            .catch(() => {})
            .finally(() => setLoadingList(false))
    }, [])

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        setSelected(prev => prev.length === autorisations.length ? [] : autorisations.map(a => a.id))
    }

    const supprimer = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} demande(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/autorisations-absence/${id}`)
            setAutorisations(prev => prev.filter(a => !ids.includes(a.id)))
            setSelected([])
            setDeleteMsg('Suppression effectuee')
            setTimeout(() => setDeleteMsg(''), 3000)
        } catch {
            setDeleteMsg('Erreur lors de la suppression')
            setTimeout(() => setDeleteMsg(''), 3000)
        }
    }

    const handleSubmit = async () => {
        if (!form.lieu_deplacement || !form.periode_debut || !form.periode_fin || !form.organisme_charge.trim()) {
            setError('Veuillez remplir tous les champs obligatoires')
            return
        }
        setLoading(true)
        setError('')
        try {
            await api.post(`/voyages-etudes/beneficiaire/${beneficiaireId}/autorisation-absence`, form)
            setSuccess(true)
            setTimeout(() => navigate('/enseignant/voyages-etudes'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la soumission')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-green-100 p-5 rounded-full mb-4">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Demande soumise !</h2>
                    <p className="text-gray-500">Votre demande a été transmise au Chef de Département.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">

                {/* ===================== FORMULAIRE ===================== */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Demande d'autorisation d'absence</h1>
                    <p className="text-gray-500 text-sm mt-1">Cette demande sera transmise au Chef de Département puis suivra le circuit de validation.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText size={14} className="inline mr-1" />
                            Motif de la mission <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={form.motif_mission}
                            onChange={e => setForm({ ...form, motif_mission: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={14} className="inline mr-1" />
                            Lieu du déplacement <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={form.lieu_deplacement}
                            onChange={e => setForm({ ...form, lieu_deplacement: e.target.value })}
                            placeholder="Ex: Montréal (Canada)"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={14} className="inline mr-1" />
                                Début <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={form.periode_debut}
                                onChange={e => setForm({ ...form, periode_debut: e.target.value })}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={14} className="inline mr-1" />
                                Fin <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={form.periode_fin}
                                onChange={e => setForm({ ...form, periode_fin: e.target.value })}
                                min={form.periode_debut}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Building2 size={14} className="inline mr-1" />
                            Organisme prenant en charge frais transport/séjour <span className="text-red-500">*</span>
                        </label>
                        <textarea value={form.organisme_charge}
                            onChange={e => setForm({ ...form, organisme_charge: e.target.value })}
                            rows={2}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)}
                        className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                        Annuler
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Envoi...' : 'Soumettre la demande'}
                    </button>
                </div>

                {/* ===================== LISTE AUTORISATIONS ===================== */}
                <div className="pt-4">

                    {/* Titre + actions bulk */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-purple-600" />
                            Mes autorisations précédentes
                            {autorisations.length > 0 && (
                                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    {autorisations.length}
                                </span>
                            )}
                        </h2>
                        {selected.length > 0 && (
                            <button
                                onClick={() => supprimer(selected)}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                            >
                                <Trash2 size={14} /> Supprimer ({selected.length})
                            </button>
                        )}
                    </div>

                    {/* Message suppression */}
                    {deleteMsg && (
                        <div className={`mb-3 rounded-xl p-3 text-sm flex items-center gap-2 ${deleteMsg.includes('Erreur') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                            {deleteMsg.includes('Erreur') ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                            {deleteMsg}
                        </div>
                    )}

                    {loadingList ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : autorisations.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
                            <ShieldCheck size={28} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Aucune autorisation précédente</p>
                        </div>
                    ) : (
                        <>
                            {/* Sélectionner tout */}
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <input
                                    type="checkbox"
                                    checked={selected.length === autorisations.length && autorisations.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 accent-blue-700 cursor-pointer"
                                />
                                <span className="text-sm text-gray-500">Tout sélectionner</span>
                            </div>

                            <div className="space-y-3">
                                {autorisations.map(a => {
                                    const cfg  = statutConfig[a.statut] || { label: a.statut, color: 'bg-gray-100 text-gray-600', icon: Clock }
                                    const Icon = cfg.icon
                                    const open = expanded === a.id
                                    const isSelected = selected.includes(a.id)

                                    return (
                                        <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${isSelected ? 'border-blue-300' : 'border-gray-100'}`}>
                                            <div className="p-4 flex items-start gap-3">

                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(a.id)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="mt-1 w-4 h-4 accent-blue-700 cursor-pointer flex-shrink-0"
                                                />

                                                {/* Contenu cliquable */}
                                                <button
                                                    onClick={() => setExpanded(open ? null : a.id)}
                                                    className="flex-1 flex items-start justify-between text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-100 p-2.5 rounded-xl">
                                                            <ShieldCheck size={18} className="text-purple-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 text-sm">
                                                                {a.numero} — {a.lieu_deplacement}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {new Date(a.periode_debut).toLocaleDateString('fr-FR')} → {new Date(a.periode_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                                                            <Icon size={10} /> {cfg.label}
                                                        </span>
                                                        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Détail déplié */}
                                            {open && (
                                                <div className="border-t border-gray-100 p-4 space-y-3">

                                                    {/* Bouton voir document */}
                                                    <button
                                                        onClick={() => navigate(`/autorisation-absence/${a.id}/document`)}
                                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                                                    >
                                                        <Eye size={14} /> Voir le document
                                                    </button>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-gray-50 rounded-xl p-3">
                                                            <p className="text-xs font-semibold text-gray-500 mb-1">Motif</p>
                                                            <p className="text-sm text-gray-700">{a.motif_mission}</p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-xl p-3">
                                                            <p className="text-xs font-semibold text-gray-500 mb-1">Organisme</p>
                                                            <p className="text-sm text-gray-700">{a.organisme_charge}</p>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suivi du circuit</p>

                                                    <div className={`rounded-xl p-3 border ${a.avis_chef_departement ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-gray-600">Chef de Département</p>
                                                            {a.avis_chef_departement
                                                                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{a.avis_chef_departement}</span>
                                                                : <span className="text-xs text-gray-400">En attente</span>}
                                                        </div>
                                                        {a.commentaire_chef_departement && (
                                                            <p className="text-xs text-gray-600 mt-1">{a.commentaire_chef_departement}</p>
                                                        )}
                                                    </div>

                                                    <div className={`rounded-xl p-3 border ${a.avis_directeur_ufr ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-gray-600">Directeur UFR</p>
                                                            {a.avis_directeur_ufr
                                                                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{a.avis_directeur_ufr}</span>
                                                                : <span className="text-xs text-gray-400">En attente</span>}
                                                        </div>
                                                        {a.commentaire_directeur_ufr && (
                                                            <p className="text-xs text-gray-600 mt-1">{a.commentaire_directeur_ufr}</p>
                                                        )}
                                                    </div>

                                                    <div className={`rounded-xl p-3 border ${a.date_signature_recteur ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-gray-600">Recteur</p>
                                                            {a.date_signature_recteur
                                                                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Signé le {new Date(a.date_signature_recteur).toLocaleDateString('fr-FR')}</span>
                                                                : <span className="text-xs text-gray-400">En attente</span>}
                                                        </div>
                                                    </div>

                                                    <div className={`rounded-xl p-3 border ${a.date_transmission_vr ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-gray-600">Vice-Recteur</p>
                                                            {a.date_transmission_vr
                                                                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Transmis le {new Date(a.date_transmission_vr).toLocaleDateString('fr-FR')}</span>
                                                                : <span className="text-xs text-gray-400">En attente</span>}
                                                        </div>
                                                    </div>

                                                    {/* Supprimer un seul */}
                                                    <button
                                                        onClick={() => supprimer([a.id])}
                                                        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold py-2.5 rounded-xl transition"
                                                    >
                                                        <Trash2 size={14} /> Supprimer cette demande
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </Layout>
    )
}