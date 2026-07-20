import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, AlertCircle, Send, Eye, Bell, Users, Trash2, History, Search, Layers, Clock, X } from 'lucide-react'
const tabBadgeColors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-700',
}

export default function ChefDepartementDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const [dossiers, setDossiers]               = useState([])
    const [loading, setLoading]                 = useState(true)
    const [activeTab, setActiveTab]             = useState('listes')
    const [actionLoading, setActionLoading]     = useState(null)
    const [message, setMessage]                 = useState('')
    const [error, setError]                     = useState('')
    const [selectedVoyages, setSelectedVoyages] = useState([])
    const [selectedAuto, setSelectedAuto]       = useState([])
    const [selectedHistorique, setSelectedHistorique] = useState([])
    const [autorisationsAbsence, setAutorisationsAbsence] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filtreRapide, setFiltreRapide] = useState('tous')
    const [pdfAffiche, setPdfAffiche] = useState(null)

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (['listes', 'autorisations', 'historique'].includes(tab)) setActiveTab(tab)
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

    // ===== SELECTION VOYAGES =====
    const toggleSelectVoyage = (id) =>
        setSelectedVoyages(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllVoyages = () =>
        setSelectedVoyages(selectedVoyages.length === voyagesAffiches.length ? [] : voyagesAffiches.map(v => v.id))

   const supprimerVoyagesSelectionnes = async () => {
        if (!confirm(`Masquer ${selectedVoyages.length} voyage(s) de votre vue ?`)) return
        try {
            for (const id of selectedVoyages) await api.delete(`/voyages-etudes/${id}`)
            setDossiers(prev => prev.filter(d => !selectedVoyages.includes(d.voyage?.id)))
            setSelectedVoyages([])
            showMsg('Voyage(s) masque(s) de votre vue')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerTousVoyages = async () => {
        if (!confirm('Masquer tous les voyages de votre vue ?')) return
        try {
            for (const id of voyagesAffiches.map(v => v.id)) await api.delete(`/voyages-etudes/${id}`)
            setDossiers(prev => prev.filter(d => !voyagesAffiches.some(v => v.id === d.voyage?.id)))
            setSelectedVoyages([])
            showMsg('Voyages masques de votre vue')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

   
    // ===== SELECTION AUTORISATIONS EN ATTENTE =====
    const toggleSelectAuto = (id) =>
        setSelectedAuto(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllAuto = () =>
        setSelectedAuto(selectedAuto.length === autorisationsAffichees.length ? [] : autorisationsAffichees.map(a => a.id))

    const supprimerAutoSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedAuto.length} demande(s) ?`)) return
        try {
            for (const id of selectedAuto) await api.delete(`/autorisations-absence/${id}`)
            showMsg('Suppression effectuee')
            setSelectedAuto([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerToutesAuto = async () => {
        if (!confirm('Supprimer toutes les demandes ?')) return
        try {
            for (const a of autorisationsAffichees) await api.delete(`/autorisations-absence/${a.id}`)
            showMsg('Toutes les demandes supprimees')
            setSelectedAuto([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    // ===== SELECTION HISTORIQUE =====
    const toggleSelectHistorique = (id) =>
        setSelectedHistorique(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllHistorique = () =>
        setSelectedHistorique(selectedHistorique.length === historiqueAffiche.length ? [] : historiqueAffiche.map(a => a.id))

    const supprimerHistoriqueSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedHistorique.length} element(s) de l'historique ?`)) return
        try {
            for (const id of selectedHistorique) await api.delete(`/autorisations-absence/${id}`)
            showMsg('Suppression effectuee')
            setSelectedHistorique([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerTouHistorique = async () => {
        if (!confirm("Vider tout l'historique ?")) return
        try {
            for (const a of historiqueAffiche) await api.delete(`/autorisations-absence/${a.id}`)
            showMsg('Historique vide')
            setSelectedHistorique([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

   const notifierEnseignants = async (voyageId) => {
        setActionLoading('notif_' + voyageId)
        try {
            await api.post(`/voyages-etudes/${voyageId}/notifier-enseignants`)
            showMsg('Enseignants notifies avec succes')
            fetchDossiers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally { setActionLoading(null) }
    }



    const voyagesUniques          = [...new Map(dossiers.map(d => [d.voyage?.id, d.voyage])).values()].filter(Boolean)
    const autorisationsEnAttente  = autorisationsAbsence.filter(a => a.statut === 'soumise')
    const historiqueAutorisations = autorisationsAbsence.filter(a => a.avis_chef_departement !== null)

    // ===== STATS DERIVEES =====
    const nouvellesListes = voyagesUniques.filter(v => !v.enseignants_notifies).length
    const signeesCeMois = historiqueAutorisations.filter(a => {
        const d = new Date(a.updated_at || a.periode_debut)
        const now = new Date()
        return a.avis_chef_departement === 'favorable' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    // ===== FILTRAGE PAR RECHERCHE =====
    const filtrerVoyages = (liste) => liste.filter(v =>
        searchQuery === '' ||
        v.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filtrerAutorisations = (liste) => liste.filter(a =>
        searchQuery === '' ||
        a.enseignant?.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.enseignant?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.lieu_deplacement?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ===== FILTRAGE RAPIDE (chips) =====
    const appliquerFiltreRapide = (liste, champDate) => {
        if (filtreRapide === 'tous') return liste
        const maintenant = new Date()
        return liste.filter(item => {
            const dateVal = item[champDate]
            if (!dateVal) return true
            const d = new Date(dateVal)
            if (filtreRapide === 'semaine') {
                const debut = new Date(maintenant); debut.setDate(maintenant.getDate() - 7)
                return d >= debut
            }
            if (filtreRapide === 'mois') {
                return d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear()
            }
            if (filtreRapide === 'retard') {
                return d < maintenant
            }
            return true
        })
    }

    const voyagesAffiches        = appliquerFiltreRapide(filtrerVoyages(voyagesUniques), 'date_debut')
    const autorisationsAffichees = appliquerFiltreRapide(filtrerAutorisations(autorisationsEnAttente), 'periode_debut')
    const historiqueAffiche      = filtrerAutorisations(historiqueAutorisations)

    const BarreSelection = ({ selected, total, onSelectAll, onDeleteSelected, onDeleteAll }) => (
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
                <input type="checkbox"
                    checked={selected.length === total && total > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                <span className="text-sm text-gray-600">
                    {selected.length > 0 ? `${selected.length} selectionne(s)` : 'Tout selectionner'}
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

                {/* ===== BANDE DE STATS ===== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="bg-blue-100 w-9 h-9 rounded-full flex items-center justify-center mb-2.5">
                            <Layers size={16} className="text-blue-700" />
                        </div>
                        <p className="text-xl font-bold text-gray-800">{dossiers.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Total dossiers</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="bg-blue-100 w-9 h-9 rounded-full flex items-center justify-center mb-2.5">
                            <Bell size={16} className="text-blue-700" />
                        </div>
                        <p className="text-xl font-bold text-gray-800">{nouvellesListes}</p>
                        <p className="text-xs text-gray-500 mt-1">Nouvelles listes</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="bg-orange-100 w-9 h-9 rounded-full flex items-center justify-center mb-2.5">
                            <Clock size={16} className="text-orange-700" />
                        </div>
                        <p className="text-xl font-bold text-gray-800">{autorisationsEnAttente.length}</p>
                        <p className="text-xs text-gray-500 mt-1">En attente</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="bg-green-100 w-9 h-9 rounded-full flex items-center justify-center mb-2.5">
                            <CheckCircle size={16} className="text-green-700" />
                        </div>
                        <p className="text-xl font-bold text-gray-800">{signeesCeMois}</p>
                        <p className="text-xs text-gray-500 mt-1">Signées ce mois</p>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-200 flex-wrap">
                    {[
                        { key: 'listes', label: 'Nouvelles listes', icon: <Bell size={14} />, count: voyagesUniques.length, color: 'blue' },
                        { key: 'autorisations', label: "Demandes d'autorisation", icon: null, count: autorisationsEnAttente.length, color: 'green' },
                        { key: 'historique', label: 'Historique', icon: <History size={14} />, count: historiqueAutorisations.length, color: 'gray' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 rounded-t-lg ${
                                activeTab === tab.key
                                    ? 'border-blue-700 text-blue-700 bg-slate-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}>
                            {tab.icon} {tab.label}
                            {tab.count > 0 && (
                                <span className={`${tabBadgeColors[tab.color]} text-xs rounded-full px-1.5 py-0.5 font-bold`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Recherche + filtres rapides */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative max-w-sm flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par destination, enseignant, numéro..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {[
                        { key: 'tous', label: 'Tous' },
                        { key: 'semaine', label: 'Cette semaine' },
                        { key: 'mois', label: 'Ce mois' },
                        { key: 'retard', label: 'En retard' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFiltreRapide(f.key)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition ${
                                filtreRapide === f.key
                                    ? 'bg-blue-100 text-blue-700 border-transparent'
                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}>
                            {f.label}
                        </button>
                    ))}
                </div>

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
                            voyagesAffiches.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <Bell size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune liste</h3>
                                    <p className="text-gray-400 text-sm">
                                        {voyagesUniques.length === 0 ? 'Les listes publiees par le Vice-Recteur apparaitront ici' : 'Aucun résultat pour cette recherche'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedVoyages}
                                        total={voyagesAffiches.length}
                                        onSelectAll={toggleSelectAllVoyages}
                                        onDeleteSelected={supprimerVoyagesSelectionnes}
                                        onDeleteAll={supprimerTousVoyages}
                                    />
                                    {voyagesAffiches.map(v => (
                                        <div key={v.id} className={`bg-white rounded-xl border overflow-hidden transition ${
                                            selectedVoyages.includes(v.id) ? 'border-blue-300' : 'border-gray-100 shadow-sm'
                                        }`}>
                                            <div className="flex items-center gap-3 p-4">
                                                <input type="checkbox"
                                                    checked={selectedVoyages.includes(v.id)}
                                                    onChange={() => toggleSelectVoyage(v.id)}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer flex-shrink-0" />
                                                <div className="flex items-center justify-between flex-1 px-2 py-1">
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
                                                            onClick={() => navigate(`/voyages-etudes/${v.id}/liste-publiee`)}
                                                            className="flex items-center gap-1 border border-purple-200 text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                                                            <FileText size={12} />
                                                            Voir la liste (PDF)
                                                        </button>
                                                        <button
                                                            onClick={() => notifierEnseignants(v.id)}
                                                            disabled={actionLoading === 'notif_' + v.id || v.enseignants_notifies}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-70 ${
                                                                v.enseignants_notifies
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                                                            }`}>
                                                            {actionLoading === 'notif_' + v.id
                                                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                : v.enseignants_notifies
                                                                    ? <CheckCircle size={12} />
                                                                    : <Bell size={12} />}
                                                            {v.enseignants_notifies ? 'Notifié' : 'Notifier'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== ONGLET AUTORISATIONS EN ATTENTE ===== */}
                        {activeTab === 'autorisations' && (
                            autorisationsAffichees.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune demande</h3>
                                    <p className="text-gray-400 text-sm">
                                        {autorisationsEnAttente.length === 0 ? "Les demandes d'autorisation d'absence apparaitront ici" : 'Aucun résultat pour cette recherche'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <BarreSelection
                                        selected={selectedAuto}
                                        total={autorisationsAffichees.length}
                                        onSelectAll={toggleSelectAllAuto}
                                        onDeleteSelected={supprimerAutoSelectionnes}
                                        onDeleteAll={supprimerToutesAuto}
                                    />
                                    {autorisationsAffichees.map(a => (
                                        <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                            selectedAuto.includes(a.id) ? 'border-blue-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedAuto.includes(a.id)}
                                                        onChange={() => toggleSelectAuto(a.id)}
                                                        className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
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
                                               <button onClick={() => navigate('/autorisation-absence/' + a.id)}
    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
    <CheckCircle size={14} />
    Signer et transmettre au Directeur UFR
</button>
                                                <button onClick={() => navigate('/autorisation-absence/' + a.id)}
                                                    className="flex items-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                    <Eye size={14} />
                                                    Voir le document
                                                </button>
                                                {a.justificatif_url && (
                                                  <button onClick={() => setPdfAffiche(a.justificatif_url)}
    className="flex items-center gap-2 border border-purple-700 text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
    <FileText size={14} />
    Voir justificatif
</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== ONGLET HISTORIQUE ===== */}
                        {activeTab === 'historique' && (
                            historiqueAffiche.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <History size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                                    <p className="text-gray-400 text-sm">
                                        {historiqueAutorisations.length === 0 ? 'Les demandes que vous avez signees apparaitront ici' : 'Aucun résultat pour cette recherche'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedHistorique}
                                        total={historiqueAffiche.length}
                                        onSelectAll={toggleSelectAllHistorique}
                                        onDeleteSelected={supprimerHistoriqueSelectionnes}
                                        onDeleteAll={supprimerTouHistorique}
                                    />
                                    {historiqueAffiche.map(a => (
                                        <div key={a.id} className={`rounded-2xl border p-4 flex items-center justify-between transition ${
                                            selectedHistorique.includes(a.id) ? 'bg-gray-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox"
                                                    checked={selectedHistorique.includes(a.id)}
                                                    onChange={() => toggleSelectHistorique(a.id)}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">
                                                    {a.enseignant?.prenom?.[0]}{a.enseignant?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{a.enseignant?.prenom} {a.enseignant?.nom}</p>
                                                    <p className="text-xs text-gray-500">{a.numero} — {a.lieu_deplacement}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    a.avis_chef_departement === 'favorable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {a.avis_chef_departement === 'favorable' ? 'Avis favorable' : 'Rejetee'}
                                                </span>
                                                {a.justificatif_url && (
                                                    <a href={a.justificatif_url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 border border-purple-400 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                                                        <FileText size={13} /> Justificatif
                                                    </a>
                                                )}
                                                <button onClick={() => navigate('/autorisation-absence/' + a.id)}
                                                    className="flex items-center gap-1.5 border border-gray-400 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                                                    <Eye size={13} /> Voir
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
            {pdfAffiche && (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Aperçu du justificatif</h3>
                <button onClick={() => setPdfAffiche(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X size={18} />
                </button>
            </div>
            <iframe
                src={pdfAffiche}
                className="flex-1 w-full rounded-b-2xl"
                title="Justificatif PDF"
            />
        </div>
    </div>
)}
        </Layout>
        
    )
}