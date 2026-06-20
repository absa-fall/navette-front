import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, AlertCircle, Send, Eye, Bell, Users, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export default function ChefDepartementDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const [dossiers, setDossiers]               = useState([])
    const [loading, setLoading]                 = useState(true)
    const [activeTab, setActiveTab]             = useState('listes')
    const [actionLoading, setActionLoading]     = useState(null)
    const [message, setMessage]                 = useState('')
    const [error, setError]                     = useState('')
    const [voyageOuvert, setVoyageOuvert]       = useState(null)
    const [beneficiaires, setBeneficiaires]     = useState({})
    const [loadingBenef, setLoadingBenef]       = useState(null)
    const [selectedVoyages, setSelectedVoyages] = useState([])
    const [selectedJustif, setSelectedJustif]   = useState([])
    const [selectedAuto, setSelectedAuto]       = useState([])
    const [autorisationsAbsence, setAutorisationsAbsence] = useState([])


    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (['listes', 'justificatifs', 'autorisations'].includes(tab)) setActiveTab(tab)
    }, [location.search])

    useEffect(() => { fetchDossiers() }, [])

   const fetchDossiers = async () => {
    try {
        const [resDossiers, resAutos] = await Promise.all([
            api.get('/voyages-etudes/dossiers-departement'),
            api.get('/autorisations-absence'),
        ])
        setDossiers(resDossiers.data)
        setAutorisationsAbsence(resAutos.data)
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

    const toggleVoyage = async (voyageId) => {
        if (voyageOuvert === voyageId) { setVoyageOuvert(null); return }
        setVoyageOuvert(voyageId)
        if (beneficiaires[voyageId]) return
        setLoadingBenef(voyageId)
        try {
            const res = await api.get(`/voyages-etudes/${voyageId}/beneficiaires`)
            setBeneficiaires(prev => ({ ...prev, [voyageId]: res.data }))
        } catch {
            showMsg('Impossible de charger les bénéficiaires', true)
        } finally {
            setLoadingBenef(null)
        }
    }

    // ===== SÉLECTION VOYAGES =====
    const toggleSelectVoyage = (id) =>
        setSelectedVoyages(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllVoyages = () =>
        setSelectedVoyages(selectedVoyages.length === voyagesUniques.length ? [] : voyagesUniques.map(v => v.id))

    const supprimerVoyagesSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedVoyages.length} voyage(s) ?`)) return
        try {
            for (const id of selectedVoyages) await api.delete(`/voyages-etudes/${id}`)
            showMsg('Suppression effectuée')
            setSelectedVoyages([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerTousVoyages = async () => {
        if (!confirm('Supprimer tous les voyages ?')) return
        try {
            for (const v of voyagesUniques) await api.delete(`/voyages-etudes/${v.id}`)
            showMsg('Tous les voyages supprimés')
            setSelectedVoyages([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    // ===== SÉLECTION JUSTIFICATIFS =====
    const toggleSelectJustif = (id) =>
        setSelectedJustif(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllJustif = () =>
        setSelectedJustif(selectedJustif.length === dossiersJustif.length ? [] : dossiersJustif.map(d => d.id))

    const supprimerJustifSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedJustif.length} dossier(s) ?`)) return
        try {
            for (const id of selectedJustif) await api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`)
            showMsg('Suppression effectuée')
            setSelectedJustif([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerTousJustif = async () => {
        if (!confirm('Supprimer tous les dossiers justificatifs ?')) return
        try {
            for (const d of dossiersJustif) await api.delete(`/voyages-etudes/beneficiaire/${d.id}/dossier`)
            showMsg('Tous les dossiers supprimés')
            setSelectedJustif([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    // ===== SÉLECTION AUTORISATIONS =====
    const toggleSelectAuto = (id) =>
        setSelectedAuto(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllAuto = () =>
        setSelectedAuto(selectedAuto.length === dossiersAutorisation.length ? [] : dossiersAutorisation.map(d => d.id))

    const supprimerAutoSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedAuto.length} demande(s) ?`)) return
        try {
            for (const id of selectedAuto) await api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`)
            showMsg('Suppression effectuée')
            setSelectedAuto([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerToutesAuto = async () => {
        if (!confirm('Supprimer toutes les demandes ?')) return
        try {
            for (const d of dossiersAutorisation) await api.delete(`/voyages-etudes/beneficiaire/${d.id}/dossier`)
            showMsg('Toutes les demandes supprimées')
            setSelectedAuto([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const notifierEnseignants = async (voyageId) => {
        setActionLoading('notif_' + voyageId)
        try {
            await api.post(`/voyages-etudes/${voyageId}/notifier-enseignants`)
            showMsg('Enseignants notifies avec succes')
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally { setActionLoading(null) }
    }

    const envoyerAuVR = async (id) => {
        setActionLoading(id + '_vr')
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${id}/envoyer-vr`)
            showMsg('Dossier transmis au Vice-Recteur et a la Commission')
            fetchDossiers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally { setActionLoading(null) }
    }

    const autorisationSortie = async (id) => {
        setActionLoading(id + '_sortie')
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${id}/autorisation-sortie`)
            showMsg('Autorisation de sortie envoyee au Directeur UFR')
            fetchDossiers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally { setActionLoading(null) }
    }

const signerEtTransmettre = async (autorisationId) => {
    setActionLoading(autorisationId + '_signer')
    try {
        await api.patch(`/autorisations-absence/${autorisationId}/avis-chef-departement`, {
            avis: 'favorable',
        })
        showMsg('Autorisation signee et transmise au Directeur UFR')
        fetchDossiers()
    } catch (err) {
        showMsg(err.response?.data?.message || 'Erreur', true)
    } finally {
        setActionLoading(null)
    }
}

    const dossiersJustif       = dossiers.filter(d => !["transmis_vr", "valide"].includes(d.statut_justificatif))
    const dossiersAutorisation = dossiers.filter(d => d.statut_autorisation === 'demande_chef_dept')
    const voyagesUniques       = [...new Map(dossiers.map(d => [d.voyage?.id, d.voyage])).values()].filter(Boolean)

    // Barre sélection réutilisable
    const BarreSelection = ({ selected, total, onSelectAll, onDeleteSelected, onDeleteAll, label }) => (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
                <input type="checkbox"
                    checked={selected.length === total && total > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                <span className="text-sm text-gray-600">
                    {selected.length > 0 ? `${selected.length} sélectionné(s)` : 'Tout sélectionner'}
                </span>
            </div>
            <div className="flex gap-2">
                {selected.length > 0 && (
                    <button onClick={onDeleteSelected}
                        className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        <Trash2 size={13} /> Supprimer ({selected.length})
                    </button>
                )}
                <button onClick={onDeleteAll}
                    className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                    <Trash2 size={13} /> Supprimer tout
                </button>
            </div>
        </div>
    )

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Chef de Departement</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des dossiers de voyage d'etudes</p>
                </div>

                {/* Onglets */}
                <div className="flex gap-2 border-b border-gray-200">
                    {[
                        { key: 'listes', label: 'Nouvelles listes', icon: <Bell size={14} />, count: voyagesUniques.length, color: 'blue' },
                        { key: 'justificatifs', label: 'Justificatifs reçus', icon: null, count: dossiersJustif.length, color: 'blue' },
                        { key: 'autorisations', label: "Demandes d'autorisation", icon: null, count: dossiersAutorisation.length, color: 'green' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'border-blue-700 text-blue-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}>
                            {tab.icon} {tab.label}
                            {tab.count > 0 && (
                                <span className={`bg-${tab.color}-100 text-${tab.color}-700 text-xs rounded-full px-1.5 py-0.5 font-bold`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Messages */}
                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ===== ONGLET NOUVELLES LISTES ===== */}
                        {activeTab === 'listes' && (
                            voyagesUniques.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <Bell size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune liste</h3>
                                    <p className="text-gray-400 text-sm">Les listes publiées par le Vice-Recteur apparaîtront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedVoyages}
                                        total={voyagesUniques.length}
                                        onSelectAll={toggleSelectAllVoyages}
                                        onDeleteSelected={supprimerVoyagesSelectionnes}
                                        onDeleteAll={supprimerTousVoyages}
                                    />
                                    {voyagesUniques.map(v => (
                                        <div key={v.id} className={`bg-white rounded-xl border overflow-hidden transition ${
                                            selectedVoyages.includes(v.id) ? 'border-blue-300' : 'border-gray-100 shadow-sm'
                                        }`}>
                                            <div className="flex items-center gap-3 p-4">
                                                <input type="checkbox"
                                                    checked={selectedVoyages.includes(v.id)}
                                                    onChange={() => toggleSelectVoyage(v.id)}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer flex-shrink-0"
                                                    onClick={e => e.stopPropagation()} />
                                                <div className="flex items-center justify-between flex-1 cursor-pointer hover:bg-blue-50 rounded-lg px-2 py-1 transition"
                                                    onClick={() => toggleVoyage(v.id)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <Users size={14} className="text-blue-700" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{v.destination}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(v.date_debut).toLocaleDateString('fr-FR')} - {new Date(v.date_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); notifierEnseignants(v.id) }}
                                                            disabled={actionLoading === 'notif_' + v.id}
                                                            className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50">
                                                            {actionLoading === 'notif_' + v.id
                                                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                : <Bell size={12} />}
                                                            Notifier
                                                        </button>
                                                        {voyageOuvert === v.id
                                                            ? <ChevronUp size={16} className="text-blue-600" />
                                                            : <ChevronDown size={16} className="text-gray-400" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {voyageOuvert === v.id && (
                                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                                    {loadingBenef === v.id ? (
                                                        <div className="flex justify-center py-4">
                                                            <div className="w-5 h-5 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    ) : beneficiaires[v.id]?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                                Bénéficiaires ({beneficiaires[v.id].length})
                                                            </p>
                                                            {beneficiaires[v.id].map(b => (
                                                                <div key={b.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                                            {b.enseignant?.prenom?.[0]}{b.enseignant?.nom?.[0]}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-800">{b.enseignant?.prenom} {b.enseignant?.nom}</p>
                                                                            <p className="text-xs text-gray-400">{b.enseignant?.ufr}{b.enseignant?.departement ? ` — ${b.enseignant.departement}` : ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                                        b.statut_justificatif === 'soumis'      ? 'bg-blue-100 text-blue-700' :
                                                                        b.statut_justificatif === 'transmis_vr' ? 'bg-purple-100 text-purple-700' :
                                                                        b.statut_justificatif === 'valide'      ? 'bg-green-100 text-green-700' :
                                                                        'bg-gray-100 text-gray-500'
                                                                    }`}>
                                                                        {b.statut_justificatif === 'soumis'      ? 'Soumis'      :
                                                                         b.statut_justificatif === 'transmis_vr' ? 'Transmis VR' :
                                                                         b.statut_justificatif === 'valide'      ? 'Validé'      :
                                                                         'En attente'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 text-center py-3">Aucun bénéficiaire trouvé</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== ONGLET AUTORISATIONS ===== */}
{activeTab === 'autorisations' && (
    autorisationsAbsence.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-gray-700 font-semibold mb-2">Aucune demande</h3>
            <p className="text-gray-400 text-sm">Les demandes d'autorisation d'absence apparaîtront ici</p>
        </div>
    ) : (
        <div className="space-y-4">
            {autorisationsAbsence.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                                {a.enseignant?.prenom?.[0]}{a.enseignant?.nom?.[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{a.enseignant?.prenom} {a.enseignant?.nom}</p>
                                <p className="text-xs text-gray-500">{a.numero}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-gray-700 text-sm">{a.lieu_deplacement}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(a.periode_debut).toLocaleDateString('fr-FR')} - {new Date(a.periode_fin).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-xl p-3">
                        Motif : {a.motif_mission}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => signerEtTransmettre(a.id)}
                            disabled={actionLoading === a.id + '_signer'}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                            {actionLoading === a.id + '_signer'
                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <CheckCircle size={14} />}
                            Signer l'autorisation → Transmettre au Directeur UFR
                        </button>

                        <button
                            onClick={() => navigate('/autorisation-absence/' + a.id + '/document')}
                            className="flex items-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition"
                        >
                            <Eye size={14} />
                            Voir le document
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
)}
                    </>
                )}
            </div>
        </Layout>
    )
}