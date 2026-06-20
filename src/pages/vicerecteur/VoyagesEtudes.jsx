import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
    MapPin, Plus, Users, CheckCircle, ChevronDown, ChevronUp,
    Check, X, FileText, Eye, Bell, AlertCircle, MessageSquare, Trash2
} from 'lucide-react'

const statutConfig = {
    publiee:    { label: 'Liste publiee',    color: 'bg-orange-100 text-orange-700' },
    definitive: { label: 'Liste definitive', color: 'bg-green-100 text-green-700' },
    brouillon:  { label: 'Brouillon',        color: 'bg-gray-100 text-gray-700' },
}

const statutJustifConfig = {
    soumis:      { label: 'Soumis chef dep', color: 'bg-blue-100 text-blue-700' },
    transmis_vr: { label: 'Transmis VR',     color: 'bg-purple-100 text-purple-700' },
    valide:      { label: 'Valide',           color: 'bg-green-100 text-green-700' },
    incomplet:   { label: 'Incomplet',        color: 'bg-red-100 text-red-700' },
    en_attente:  { label: 'En attente',       color: 'bg-gray-100 text-gray-600' },
}

export default function VoyagesEtudes() {
    const navigate = useNavigate()
    const [voyages, setVoyages]                       = useState([])
    const [dossiers, setDossiers]                     = useState([])
    const [loading, setLoading]                       = useState(true)
    const [activeTab, setActiveTab]                   = useState('voyages')
    const [expanded, setExpanded]                     = useState(null)
    const [selectedDefinitifs, setSelectedDefinitifs] = useState({})
    const [avisOuvert, setAvisOuvert]                 = useState(null)
    const [commentaire, setCommentaire]               = useState('')
    const [actionLoading, setActionLoading]           = useState(null)
    const [message, setMessage]                       = useState('')
    const [error, setError]                           = useState('')

    // Sélections suppression
    const [selectedVoyages, setSelectedVoyages]   = useState([])
    const [selectedDossiers, setSelectedDossiers] = useState([])

    useEffect(() => { fetchVoyages(); fetchDossiers() }, [])

    const fetchVoyages = async () => {
        try {
            const res = await api.get('/voyages-etudes')
            setVoyages(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchDossiers = async () => {
        try {
            const res = await api.get('/voyages-etudes/dossiers-a-valider')
            setDossiers(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 5000)
    }

    const toggleDefinitif = (voyageId, beneficiaireId) => {
        setSelectedDefinitifs(prev => {
            const current = prev[voyageId] || []
            return {
                ...prev,
                [voyageId]: current.includes(beneficiaireId)
                    ? current.filter(i => i !== beneficiaireId)
                    : [...current, beneficiaireId]
            }
        })
    }

    const publierListeDefinitive = async (voyageId) => {
        const selected = selectedDefinitifs[voyageId] || []
        if (selected.length === 0) { showMsg('Selectionnez au moins un beneficiaire', true); return }
        setActionLoading('liste_' + voyageId)
        try {
            await api.post(`/voyages-etudes/${voyageId}/liste-definitive`, { beneficiaires: selected })
            showMsg('Liste definitive publiee et envoyee au Recteur et aux Chefs de Departement')
            fetchVoyages()
        } catch (err) {
            const data = err.response?.data
            if (data?.erreurs) showMsg('Conditions non reunies : ' + data.erreurs.join(' | '), true)
            else showMsg(data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    const notifierBeneficiaires = async (voyageId) => {
        setActionLoading('notif_' + voyageId)
        try {
            await api.post(`/voyages-etudes/${voyageId}/notifier-beneficiaires`)
            showMsg('Enseignants beneficiaires notifies')
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }
    const envoyerArrete = async (voyageId) => {
    setActionLoading('arrete_' + voyageId)
    try {
        const voyage = voyages.find(v => v.id === voyageId)
        const arreteRes = await api.get(`/voyages-etudes/${voyageId}/arrete`)
        await api.post(`/arretes/${arreteRes.data.id}/envoyer-emails`)
        showMsg('Arrete envoye par email a tous les beneficiaires')
    } catch (err) {
        showMsg(err.response?.data?.message || 'Erreur lors de l\'envoi', true)
    } finally {
        setActionLoading(null)
    }
}

    const donnerAvis = async (beneficiaireId, avis) => {
        setActionLoading('avis_' + beneficiaireId + '_' + avis)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/avis`, {
                avis, commentaire: commentaire || null,
            })
            showMsg(avis === 'valide' ? 'Dossier valide' : 'Dossier rejete')
            setAvisOuvert(null)
            setCommentaire('')
            fetchDossiers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    // ===== SUPPRESSIONS =====
    const supprimerVoyages = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} voyage(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/voyages-etudes/${id}`)
            setVoyages(prev => prev.filter(v => !ids.includes(v.id)))
            setSelectedVoyages([])
            showMsg('Suppression effectuée')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerDossiers = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} dossier(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`)
            setDossiers(prev => prev.filter(d => !ids.includes(d.id)))
            setSelectedDossiers([])
            showMsg('Suppression effectuée')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const getStatutAutorisationLabel = (statut) => {
        const map = {
            non_demande:          { label: 'Non demande',       color: 'bg-gray-100 text-gray-600' },
            demande_chef_dept:    { label: 'Demande chef dept', color: 'bg-yellow-100 text-yellow-700' },
            envoye_directeur_ufr: { label: 'Chez dir. UFR',    color: 'bg-blue-100 text-blue-700' },
            envoye_recteur:       { label: 'Chez recteur',      color: 'bg-indigo-100 text-indigo-700' },
            approuve_recteur:     { label: 'Approuve recteur',  color: 'bg-green-100 text-green-700' },
        }
        return map[statut] || { label: statut || 'Non demande', color: 'bg-gray-100 text-gray-600' }
    }

    const dossiersEnAttente = dossiers.filter(d =>
        ['transmis_vr', 'valide', 'incomplet'].includes(d.statut_justificatif)
    )

    const getEligibilite = (b) => {
        const justifOK = ['transmis_vr', 'valide'].includes(b.statut_justificatif)
        const avisComm = b.avis?.some(a => a.user?.role === 'commission' && a.avis === 'valide')
        const avisVR   = b.avis?.some(a => a.user?.role === 'vice_recteur' && a.avis === 'valide')
        return { justifOK, avisComm, avisVR, eligible: justifOK && avisComm && avisVR }
    }

    // Barre sélection réutilisable
    const BarreSelection = ({ selected, total, onSelectAll, onDeleteSelected, onDeleteAll }) => (
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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Voyages d'etudes</h1>
                        <p className="text-gray-500 text-sm mt-1">{voyages.length} voyage(s)</p>
                    </div>
                    <button onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition">
                        <Plus size={18} /> Nouvelle liste
                    </button>
                </div>

                {/* Onglets */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button onClick={() => setActiveTab('voyages')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'voyages' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Mes voyages ({voyages.length})
                    </button>
                    <button onClick={() => setActiveTab('dossiers')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${activeTab === 'dossiers' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Dossiers a valider
                        {dossiersEnAttente.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{dossiersEnAttente.length}</span>
                        )}
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-wrap">{error}</span>
                    </div>
                )}

                {/* ===== ONGLET VOYAGES ===== */}
                {activeTab === 'voyages' && (
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : voyages.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun voyage</h3>
                            <p className="text-gray-400 text-sm mb-5">Publiez votre premiere liste de beneficiaires</p>
                            <button onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                                className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
                                Publier une liste
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <BarreSelection
                                selected={selectedVoyages}
                                total={voyages.length}
                                onSelectAll={() => setSelectedVoyages(
                                    selectedVoyages.length === voyages.length ? [] : voyages.map(v => v.id)
                                )}
                                onDeleteSelected={() => supprimerVoyages(selectedVoyages)}
                                onDeleteAll={() => supprimerVoyages(voyages.map(v => v.id))}
                            />
                            {voyages.map(voyage => {
                                const statut     = statutConfig[voyage.statut_liste] || statutConfig['brouillon']
                                const isExpanded = expanded === voyage.id
                                const selected   = selectedDefinitifs[voyage.id] || []
                                const definitifs = voyage.beneficiaires?.filter(b => b.dans_liste_definitive) || []

                                return (
                                    <div key={voyage.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${
                                        selectedVoyages.includes(voyage.id) ? 'border-blue-300' : 'border-gray-100'
                                    }`}>
                                        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                                            <input type="checkbox"
                                                checked={selectedVoyages.includes(voyage.id)}
                                                onChange={() => setSelectedVoyages(prev =>
                                                    prev.includes(voyage.id) ? prev.filter(i => i !== voyage.id) : [...prev, voyage.id]
                                                )}
                                                className="w-4 h-4 accent-blue-700 cursor-pointer flex-shrink-0"
                                                onClick={e => e.stopPropagation()} />
                                            <div className="flex-1 cursor-pointer hover:bg-gray-50 rounded-xl p-3 transition"
                                                onClick={() => setExpanded(isExpanded ? null : voyage.id)}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-blue-100 p-3 rounded-xl">
                                                            <MapPin size={20} className="text-blue-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{voyage.destination}</p>
                                                            <p className="text-sm text-gray-500 mt-0.5">
                                                                Du {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <Users size={12} /> {voyage.beneficiaires?.length || 0} beneficiaire(s)
                                                                </span>
                                                                {voyage.arrete_recteur && (
                                                                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                                                        <CheckCircle size={12} /> Arrete signe
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statut.color}`}>
                                                            {statut.label}
                                                        </span>
                                                        {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Détails */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 p-5 space-y-4">
                                                {voyage.description && (
                                                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{voyage.description}</p>
                                                )}

                                               {voyage.arrete_recteur && definitifs.length > 0 && (
    <div className="flex gap-2 flex-wrap">
        <button onClick={() => notifierBeneficiaires(voyage.id)}
            disabled={actionLoading === 'notif_' + voyage.id}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
            {actionLoading === 'notif_' + voyage.id
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Bell size={14} />}
            Notifier les {definitifs.length} beneficiaire(s) definitif(s)
        </button>
        <button onClick={() => envoyerArrete(voyage.id)}
            disabled={actionLoading === 'arrete_' + voyage.id}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
            {actionLoading === 'arrete_' + voyage.id
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FileText size={14} />}
            Envoyer l'arrete par email
        </button>
    </div>
)}
                                                <h3 className="font-semibold text-gray-700 text-sm">Beneficiaires :</h3>

                                                <div className="space-y-2">
                                                    {voyage.beneficiaires?.map(b => {
                                                        const justifStatut       = statutJustifConfig[b.statut_justificatif] || statutJustifConfig['en_attente']
                                                        const autorisationStatut = getStatutAutorisationLabel(b.statut_autorisation)
                                                        const elig               = getEligibilite(b)

                                                        return (
                                                            <div key={b.id} className={`p-3 rounded-xl border ${
                                                                voyage.statut_liste === 'publiee' && selected.includes(b.id)
                                                                    ? 'bg-blue-50 border-blue-200'
                                                                    : b.dans_liste_definitive
                                                                        ? 'bg-green-50 border-green-200'
                                                                        : 'bg-gray-50 border-gray-100'
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        {voyage.statut_liste === 'publiee' && (
                                                                            <input type="checkbox"
                                                                                checked={selected.includes(b.id)}
                                                                                onChange={() => toggleDefinitif(voyage.id, b.id)}
                                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                                                onClick={e => e.stopPropagation()} />
                                                                        )}
                                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                                            {b.enseignant?.prenom?.[0]}{b.enseignant?.nom?.[0]}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-800">{b.enseignant?.prenom} {b.enseignant?.nom}</p>
                                                                            <p className="text-xs text-gray-500">{b.enseignant?.ufr} · {b.enseignant?.departement || ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${justifStatut.color}`}>
                                                                            {justifStatut.label}
                                                                        </span>
                                                                        {voyage.statut_liste === 'publiee' && (
                                                                            elig.eligible
                                                                                ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✓ Eligible</span>
                                                                                : <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                                                                                    ⚠ {[!elig.justifOK && 'justif', !elig.avisComm && 'commission', !elig.avisVR && 'VR'].filter(Boolean).join(', ')}
                                                                                  </span>
                                                                        )}
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${autorisationStatut.color}`}>
                                                                            {autorisationStatut.label}
                                                                        </span>
                                                                        {b.dans_liste_definitive && <CheckCircle size={14} className="text-green-600" />}
                                                                    </div>
                                                                </div>
                                                                {b.autorisation_absence && b.autorisation_absence.id && (
    <div className="mt-2 pt-2 border-t border-gray-200">
        <button onClick={(e) => { e.stopPropagation(); navigate('/autorisation-absence/' + b.autorisation_absence.id + '/document') }}
                                                                            className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                                            <Eye size={14} /> Voir l'autorisation d'absence
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {voyage.statut_liste === 'publiee' && (
                                                    <div className="space-y-2">
                                                        {selected.length > 0 && !selected.every(id => {
                                                            const b = voyage.beneficiaires?.find(b => b.id === id)
                                                            return b && getEligibilite(b).eligible
                                                        }) && (
                                                            <p className="text-xs text-orange-600 bg-orange-50 rounded-xl p-3">
                                                                ⚠ Certains beneficiaires selectionnes n'ont pas toutes les conditions requises.
                                                            </p>
                                                        )}
                                                        <button onClick={() => publierListeDefinitive(voyage.id)}
                                                            disabled={actionLoading === 'liste_' + voyage.id || selected.length === 0}
                                                            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                                                            {actionLoading === 'liste_' + voyage.id
                                                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                : <Check size={16} />}
                                                            Publier liste definitive ({selected.length} selectionne(s))
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* ===== ONGLET DOSSIERS ===== */}
                {activeTab === 'dossiers' && (
                    <div className="space-y-4">
                        {dossiersEnAttente.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                                <h3 className="text-gray-700 font-semibold mb-2">Aucun dossier</h3>
                                <p className="text-gray-400 text-sm">Les dossiers transmis par les Chefs de Departement apparaitront ici</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <BarreSelection
                                    selected={selectedDossiers}
                                    total={dossiersEnAttente.length}
                                    onSelectAll={() => setSelectedDossiers(
                                        selectedDossiers.length === dossiersEnAttente.length ? [] : dossiersEnAttente.map(d => d.id)
                                    )}
                                    onDeleteSelected={() => supprimerDossiers(selectedDossiers)}
                                    onDeleteAll={() => supprimerDossiers(dossiersEnAttente.map(d => d.id))}
                                />
                                {dossiersEnAttente.map(d => {
                                    const avisVR         = d.avis?.find(a => a.user?.role === 'vice_recteur')
                                    const avisCommission = d.avis?.filter(a => a.user?.role === 'commission') || []
                                    const isAvisOuvert   = avisOuvert === d.id

                                    return (
                                        <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition ${
                                            selectedDossiers.includes(d.id) ? 'border-blue-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedDossiers.includes(d.id)}
                                                        onChange={() => setSelectedDossiers(prev =>
                                                            prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]
                                                        )}
                                                        className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                                        {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                        <p className="text-xs text-gray-500">{d.enseignant?.ufr} · {d.enseignant?.departement || ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-700">{d.voyage?.destination}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(d.voyage?.date_debut).toLocaleDateString('fr-FR')} - {new Date(d.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>

                                            {d.justificatifs?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Justificatifs ({d.justificatifs.length}) :</p>
                                                    {d.justificatifs.map(j => (
                                                        <button key={j.id}
                                                            onClick={() => window.open(`http://127.0.0.1:8000/storage/${j.fichier_pdf}`, '_blank')}
                                                            className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                                                            <Eye size={14} /> {j.nom_original || 'Fichier PDF'}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {avisCommission.length > 0 && (
                                                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Avis commission :</p>
                                                    {avisCommission.map(a => (
                                                        <div key={a.id} className="flex items-start gap-2">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.avis === 'valide' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {a.avis === 'valide' ? 'Valide' : 'Rejete'}
                                                            </span>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-700">{a.user?.prenom} {a.user?.nom}</p>
                                                                {a.commentaire && <p className="text-xs text-gray-500">{a.commentaire}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {avisVR ? (
                                                <div className={`flex items-center gap-2 p-3 rounded-xl ${avisVR.avis === 'valide' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                                    {avisVR.avis === 'valide' ? <CheckCircle size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />}
                                                    <p className="text-sm font-medium">
                                                        Votre avis : <span className={avisVR.avis === 'valide' ? 'text-green-700' : 'text-red-700'}>{avisVR.avis === 'valide' ? 'Valide' : 'Rejete'}</span>
                                                    </p>
                                                    {avisVR.commentaire && <p className="text-xs text-gray-500 ml-2">{avisVR.commentaire}</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {isAvisOuvert && (
                                                        <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                                                            placeholder="Commentaire (optionnel)..." rows={2}
                                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                                    )}
                                                    <div className="flex gap-2">
                                                        {!isAvisOuvert ? (
                                                            <button onClick={() => setAvisOuvert(d.id)}
                                                                className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                                                <MessageSquare size={14} /> Donner mon avis
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => donnerAvis(d.id, 'valide')}
                                                                    disabled={actionLoading === 'avis_' + d.id + '_valide'}
                                                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                    {actionLoading === 'avis_' + d.id + '_valide'
                                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        : <CheckCircle size={14} />}
                                                                    Valider
                                                                </button>
                                                                <button onClick={() => donnerAvis(d.id, 'rejete')}
                                                                    disabled={actionLoading === 'avis_' + d.id + '_rejete'}
                                                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                    {actionLoading === 'avis_' + d.id + '_rejete'
                                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        : <X size={14} />}
                                                                    Rejeter
                                                                </button>
                                                                <button onClick={() => { setAvisOuvert(null); setCommentaire('') }}
                                                                    className="text-gray-400 hover:text-gray-600 px-2">
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                         {d.autorisation_absence && d.autorisation_absence.id && (
    <button onClick={() => navigate('/autorisation-absence/' + d.autorisation_absence.id + '/document')}
        className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
        <Eye size={14} /> Voir l'autorisation d'absence
    </button>
)}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    )
}