import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import SignaturePad from '../../components/SignaturePad'
import html2pdf from 'html2pdf.js'
import api from '../../api/axios'
import {
    MapPin, Plus, Users, CheckCircle, ChevronDown, ChevronUp,
    Check, X, FileText, Eye, Bell, AlertCircle, MessageSquare, Trash2, Search, Clock
} from 'lucide-react'

const statutConfig = {
    publiee:    { label: 'Liste publiee',    bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    definitive: { label: 'Liste definitive', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600' },
    brouillon:  { label: 'Brouillon',        bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
}

const statutJustifConfig = {
    soumis:      { label: 'Soumis chef dep', bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-600' },
    transmis_vr: { label: 'Transmis VR',     bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    valide:      { label: 'Valide',          bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-600' },
    incomplet:   { label: 'Incomplet',       bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500' },
    en_attente:  { label: 'En attente',      bg: 'bg-slate-100', text: 'text-slate-600',  dot: 'bg-slate-400' },
}

export default function VoyagesEtudes() {
    const navigate = useNavigate()
    const location = useLocation()
    const tabParam = new URLSearchParams(location.search).get('tab')
    const [voyages, setVoyages]                       = useState([])
    const [dossiers, setDossiers]                     = useState([])
    const [loading, setLoading]                       = useState(true)
    const [activeTab, setActiveTab]                   = useState(tabParam === 'dossiers' ? 'dossiers' : 'voyages')
    const [expanded, setExpanded]                     = useState(null)
    const [selectedDefinitifs, setSelectedDefinitifs] = useState({})
    const [avisOuvert, setAvisOuvert]                 = useState(null)
    const [commentaire, setCommentaire]               = useState('')
    const [actionLoading, setActionLoading]           = useState(null)
    const [message, setMessage]                       = useState('')
    const [error, setError]                           = useState('')
    const [searchQuery, setSearchQuery]               = useState('')
    const [selectedVoyages, setSelectedVoyages]       = useState([])
    const [selectedDossiers, setSelectedDossiers]     = useState([])
    const [signaturesDefinitives, setSignaturesDefinitives] = useState({})
    const [definitiveStep, setDefinitiveStep]         = useState({})

    useEffect(() => { fetchVoyages(); fetchDossiers() }, [])

    useEffect(() => {
        setSelectedDefinitifs(prev => {
            const updated = { ...prev }
            voyages.forEach(voyage => {
                if (voyage.statut_liste === 'publiee' && updated[voyage.id] === undefined) {
                    updated[voyage.id] = (voyage.beneficiaires || [])
                        .filter(b => getEligibilite(b).eligible)
                        .map(b => b.id)
                }
            })
            return updated
        })
    }, [voyages])

    const fetchVoyages = async () => {
        try {
            const res = await api.get('/voyages-etudes')
            const raw = res.data

            let liste = []
            if (Array.isArray(raw)) {
                liste = raw
            } else if (Array.isArray(raw?.data)) {
                liste = raw.data
            } else if (Array.isArray(raw?.data?.data)) {
                liste = raw.data.data
            } else {
                console.error('GET /voyages-etudes : format inattendu, reponse recue :', raw)
            }

            setVoyages(liste)
        } catch (err) {
            console.error('Erreur fetchVoyages :', err.response?.status, err.response?.data || err.message)
            setVoyages([])
        } finally {
            setLoading(false)
        }
    }

    const fetchDossiers = async () => {
        try {
            const res = await api.get('/voyages-etudes/dossiers-a-valider')
            setDossiers(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Erreur fetchDossiers :', err.response?.status, err.response?.data || err.message)
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
        const signature = signaturesDefinitives[voyageId]
        if (!signature) { showMsg('Veuillez signer la liste avant de la publier', true); return }
        setActionLoading('liste_' + voyageId)
        try {
            await api.post(`/voyages-etudes/${voyageId}/liste-definitive`, { beneficiaires: selected, signature })
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
            const arreteRes = await api.get(`/voyages-etudes/${voyageId}/arrete`)
            await api.post(`/arretes/${arreteRes.data.id}/envoyer-emails`)
            showMsg('Arrete envoye par email a tous les beneficiaires')
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur lors de l\'envoi', true)
        } finally {
            setActionLoading(null)
        }
    }

    const exporterPDFDefinitif = (voyage) => {
        const definitifs = voyage.beneficiaires?.filter(b => b.dans_liste_definitive) || []
        const contenu = `
            <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 13px;">
                <h1 style="color:#1d4ed8; font-size:16px;">Liste definitive des beneficiaires — ${voyage.destination}</h1>
                <p style="color:#6b7280; margin-bottom:20px;">
                    Du ${new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au ${new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                    — Total : ${definitifs.length} beneficiaire(s)
                </p>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">N°</th>
                            <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Prenom</th>
                            <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Nom</th>
                            <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">UFR</th>
                            <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Departement</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${definitifs.map((b, i) => `
                            <tr>
                                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${i + 1}</td>
                                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${b.enseignant?.prenom || ''}</td>
                                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${b.enseignant?.nom || ''}</td>
                                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${b.enseignant?.ufr || '-'}</td>
                                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${b.enseignant?.departement || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top:30px; font-size:10px; color:#9ca3af; text-align:center;">
                    UADB Mobilite — Liste a valider avant redaction de l'arrete — Genere le ${new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
        `
        const element = document.createElement('div')
        element.innerHTML = contenu
        html2pdf().set({
            margin: 10,
            filename: `liste-definitive-${voyage.destination}-${voyage.id}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save()
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

    const supprimerVoyages = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} voyage(s) ?`)) return
        const resultats = await Promise.allSettled(
            ids.map(id => api.delete(`/voyages-etudes/${id}`))
        )
        const reussis = ids.filter((id, i) => resultats[i].status === 'fulfilled')
        setVoyages(prev => prev.filter(v => !reussis.includes(v.id)))
        setSelectedVoyages([])
        if (reussis.length === ids.length) {
            showMsg('Suppression effectuée')
        } else {
            showMsg(`${reussis.length}/${ids.length} voyage(s) supprimé(s)`, reussis.length < ids.length)
        }
    }

    const supprimerDossiers = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} dossier(s) ?`)) return
        await Promise.allSettled(
            ids.map(id => api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`))
        )
        setSelectedDossiers([])
        showMsg('Suppression effectuée')
        fetchDossiers()
    }

    const getStatutAutorisationLabel = (statut) => {
        const map = {
            non_demande:          { label: 'Non demande',       bg: 'bg-slate-100', text: 'text-slate-600',  dot: 'bg-slate-400' },
            demande_chef_dept:    { label: 'Demande chef dept', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
            envoye_directeur_ufr: { label: 'Chez dir. UFR',     bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-600' },
            envoye_recteur:       { label: 'Chez recteur',      bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
            approuve_recteur:     { label: 'Approuve recteur',  bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-600' },
        }
        return map[statut] || { label: statut || 'Non demande', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
    }

    const dossiersEnAttente = dossiers.filter(d =>
        ['soumis', 'transmis_vr', 'valide', 'incomplet'].includes(d.statut_justificatif)
    )

    const getEligibilite = (b) => {
        const justifOK = ['transmis_vr', 'valide'].includes(b.statut_justificatif)
        const avisComm = b.avis?.some(a => a.user?.role === 'commission' && a.avis === 'valide')
        const avisVR   = b.avis?.some(a => a.user?.role === 'vice_recteur' && a.avis === 'valide')
        return { justifOK, avisComm, avisVR, eligible: justifOK && avisComm && avisVR }
    }

    // ===== FILTRAGE PAR RECHERCHE (au bon endroit, réellement appliqué) =====
    const filtrerVoyages = (liste) => liste.filter(v =>
        searchQuery === '' ||
        v.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filtrerDossiers = (liste) => liste.filter(d =>
        searchQuery === '' ||
        d.enseignant?.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.enseignant?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.enseignant?.ufr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.voyage?.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const voyagesAffiches  = filtrerVoyages(voyages)
    const dossiersAffiches = filtrerDossiers(dossiersEnAttente)

    const definitivesCount = voyages.filter(v => v.statut_liste === 'definitive').length
    const publieesCount    = voyages.filter(v => v.statut_liste === 'publiee').length

    // Barre sélection réutilisable
    const BarreSelection = ({ selected, total, onSelectAll, onDeleteSelected, onDeleteAll }) => (
        <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
                <input type="checkbox"
                    checked={selected.length === total && total > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <span className="text-sm text-slate-600">
                    {selected.length > 0 ? `${selected.length} sélectionné(s)` : 'Tout sélectionner'}
                </span>
            </div>
            <div className="flex gap-2">
                {selected.length > 0 && (
                    <button onClick={onDeleteSelected}
                        className="flex items-center gap-1.5 text-xs bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition">
                        <Trash2 size={13} /> Supprimer ({selected.length})
                    </button>
                )}
                <button onClick={onDeleteAll}
                    className="flex items-center gap-1.5 text-xs bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition">
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
                        <h1 className="font-serif text-2xl font-semibold text-blue-950">Voyages d'etudes</h1>
                        <p className="text-slate-500 text-sm mt-1">{voyages.length} voyage(s)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-blue-700 hover:bg-blue-50 transition">
                            <Bell size={18} />
                        </button>
                        <button onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition">
                            <Plus size={18} /> Nouvelle liste
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Voyages',           value: voyages.length,     icon: MapPin },
                        { label: 'Listes definitives', value: definitivesCount,  icon: CheckCircle },
                        { label: 'Listes publiees',    value: publieesCount,     icon: Clock },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="bg-blue-50 w-fit p-2.5 rounded-xl mb-3">
                                <Icon size={18} className="text-blue-700" />
                            </div>
                            <p className="font-serif text-2xl font-semibold text-blue-950">{value}</p>
                            <p className="text-sm text-slate-500 mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Onglets */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button onClick={() => setActiveTab('voyages')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === 'voyages' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        Mes voyages ({voyages.length})
                    </button>
                    <button onClick={() => setActiveTab('dossiers')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${activeTab === 'dossiers' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        Dossiers a valider
                        {dossiersEnAttente.length > 0 && (
                            <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5">{dossiersEnAttente.length}</span>
                        )}
                    </button>
                </div>

                {/* Recherche */}
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par enseignant, UFR, destination..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Messages */}
                {message && (
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 text-sm flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-wrap">{error}</span>
                    </div>
                )}

                {/* ===== ONGLET VOYAGES ===== */}
                {activeTab === 'voyages' && (
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : voyagesAffiches.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                            <MapPin size={40} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-slate-700 font-semibold mb-2">Aucun voyage</h3>
                            <p className="text-slate-400 text-sm mb-5">
                                {voyages.length === 0 ? 'Publiez votre premiere liste de beneficiaires' : 'Aucun résultat pour cette recherche'}
                            </p>
                            <button onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                                Publier une liste
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <BarreSelection
                                selected={selectedVoyages}
                                total={voyagesAffiches.length}
                                onSelectAll={() => setSelectedVoyages(
                                    selectedVoyages.length === voyagesAffiches.length ? [] : voyagesAffiches.map(v => v.id)
                                )}
                                onDeleteSelected={() => supprimerVoyages(selectedVoyages)}
                                onDeleteAll={() => supprimerVoyages(voyagesAffiches.map(v => v.id))}
                            />
                            {voyagesAffiches.map(voyage => {
                                const statut     = statutConfig[voyage.statut_liste] || statutConfig['brouillon']
                                const isExpanded = expanded === voyage.id
                                const selected   = selectedDefinitifs[voyage.id] || []
                                const dStep      = definitiveStep[voyage.id] || 'selection'
                                const definitifs = voyage.beneficiaires?.filter(b => b.dans_liste_definitive) || []

                                return (
                                    <div key={voyage.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${
                                        selectedVoyages.includes(voyage.id) ? 'border-blue-300' : 'border-slate-100'
                                    }`}>
                                        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                                            <input type="checkbox"
                                                checked={selectedVoyages.includes(voyage.id)}
                                                onChange={() => setSelectedVoyages(prev =>
                                                    prev.includes(voyage.id) ? prev.filter(i => i !== voyage.id) : [...prev, voyage.id]
                                                )}
                                                className="w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                                                onClick={e => e.stopPropagation()} />
                                            <div className="flex-1 cursor-pointer hover:bg-slate-50 rounded-xl p-3 transition"
                                                onClick={() => setExpanded(isExpanded ? null : voyage.id)}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-blue-50 p-3 rounded-xl">
                                                            <MapPin size={20} className="text-blue-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-blue-950">{voyage.destination}</p>
                                                            <p className="text-sm text-slate-500 mt-0.5">
                                                                Du {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                    <Users size={12} /> {voyage.beneficiaires?.length || 0} beneficiaire(s)
                                                                </span>
                                                                {voyage.arrete_recteur && (
                                                                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                                        <CheckCircle size={12} /> Arrete signe
                                                                    </span>
                                                                )}
                                                                {voyage.arrete_recteur && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            navigate(`/voyages-etudes/${voyage.id}/arrete`)
                                                                        }}
                                                                        className="flex items-center gap-1.5 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                                                                        <Eye size={13} /> Voir l'arrete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statut.bg} ${statut.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statut.dot}`} />
                                                            {statut.label}
                                                        </span>
                                                        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Détails */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 p-5 space-y-4">
                                                {voyage.description && (
                                                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{voyage.description}</p>
                                                )}
                                                <button onClick={() => navigate(`/voyages-etudes/${voyage.id}/liste-publiee`)}
                                                    className="flex items-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                    <Eye size={14} /> Voir liste publiée ({voyage.beneficiaires?.length || 0})
                                                </button>
                                                {definitifs.length > 0 && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button onClick={() => navigate(`/voyages-etudes/${voyage.id}/liste-definitive`)}
                                                            className="flex items-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                            <Eye size={14} /> Voir liste definitive ({definitifs.length})
                                                        </button>
                                                        {voyage.arrete_recteur && (
                                                            <>
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
                                                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                    {actionLoading === 'arrete_' + voyage.id
                                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        : <FileText size={14} />}
                                                                    Envoyer l'arrete par email
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {!voyage.arrete_recteur && definitifs.length > 0 && (
                                                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                                                        Liste definitive transmise au Recteur — en attente de redaction et signature de l'arrete.
                                                    </p>
                                                )}
                                                <h3 className="font-semibold text-slate-700 text-sm">Beneficiaires :</h3>

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
                                                                        ? 'bg-emerald-50 border-emerald-200'
                                                                        : 'bg-slate-50 border-slate-100'
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        {voyage.statut_liste === 'publiee' && (
                                                                            dStep === 'selection' ? (
                                                                                <input type="checkbox"
                                                                                    checked={selected.includes(b.id)}
                                                                                    onChange={() => toggleDefinitif(voyage.id, b.id)}
                                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                                                                    onClick={e => e.stopPropagation()} />
                                                                            ) : (
                                                                                selected.includes(b.id) && <CheckCircle size={16} className="text-blue-600" />
                                                                            )
                                                                        )}
                                                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                                                                            {b.enseignant?.prenom?.[0]}{b.enseignant?.nom?.[0]}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-blue-950">{b.enseignant?.prenom} {b.enseignant?.nom}</p>
                                                                            <p className="text-xs text-slate-500">{b.enseignant?.ufr} · {b.enseignant?.departement || ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                                                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${justifStatut.bg} ${justifStatut.text}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${justifStatut.dot}`} />
                                                                            {justifStatut.label}
                                                                        </span>
                                                                        {voyage.statut_liste === 'publiee' && (
                                                                            elig.eligible
                                                                                ? <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />Eligible</span>
                                                                                : <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                                    {[!elig.justifOK && 'justif', !elig.avisComm && 'commission', !elig.avisVR && 'VR'].filter(Boolean).join(', ')}
                                                                                  </span>
                                                                        )}
                                                                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${autorisationStatut.bg} ${autorisationStatut.text}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${autorisationStatut.dot}`} />
                                                                            {autorisationStatut.label}
                                                                        </span>
                                                                        {b.dans_liste_definitive && <CheckCircle size={14} className="text-emerald-600" />}
                                                                    </div>
                                                                </div>
                                                                {b.autorisation_absence && b.autorisation_absence.id && (
                                                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                                                        <button onClick={(e) => { e.stopPropagation(); navigate('/autorisation-absence/' + b.autorisation_absence.id) }}
                                                                            className="flex items-center gap-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                                            <Eye size={14} /> Voir l'autorisation d'absence
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {voyage.statut_liste === 'publiee' && (
                                                    <div className="space-y-3">
                                                        {selected.length > 0 && !selected.every(id => {
                                                            const b = voyage.beneficiaires?.find(b => b.id === id)
                                                            return b && getEligibilite(b).eligible
                                                        }) && (
                                                            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3">
                                                                ⚠ Certains beneficiaires selectionnes n'ont pas toutes les conditions requises.
                                                            </p>
                                                        )}

                                                        {dStep === 'selection' && (
                                                            <button onClick={() => setDefinitiveStep(prev => ({ ...prev, [voyage.id]: 'apercu' }))}
                                                                disabled={selected.length === 0}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                                                                <Check size={16} /> Enregistrer la selection ({selected.length})
                                                            </button>
                                                        )}

                                                        {dStep === 'apercu' && (
                                                            <div className="space-y-3">
                                                                <div className="bg-white border border-slate-200 rounded-xl px-8 py-7 font-serif text-slate-900">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="text-[10px] leading-relaxed">
                                                                            <p className="font-bold">REPUBLIQUE DU SENEGAL</p>
                                                                            <p className="italic">Un Peuple-Un But-Une Foi</p>
                                                                            <p>Ministere de l'Enseignement superieur,</p>
                                                                            <p>de la Recherche et de l'Innovation</p>
                                                                            <br />
                                                                            <p className="font-bold">UNIVERSITE ALIOUNE DIOP</p>
                                                                        </div>
                                                                        <div className="text-right text-[11px]">
                                                                            <p>Bambey, le {new Date().toLocaleDateString('fr-FR')}</p>
                                                                        </div>
                                                                    </div>

                                                                    <hr className="border-slate-800 mb-3" />

                                                                    <div className="text-center font-bold text-[14px] underline tracking-wide mb-5">
                                                                        LISTE DEFINITIVE DES BENEFICIAIRES — {voyage.destination?.toUpperCase()}
                                                                    </div>

                                                                    <table className="w-full border-collapse text-[11px] mb-8">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="border border-slate-800 px-3 py-1.5 text-left">N°</th>
                                                                                <th className="border border-slate-800 px-3 py-1.5 text-left">Prenom</th>
                                                                                <th className="border border-slate-800 px-3 py-1.5 text-left">Nom</th>
                                                                                <th className="border border-slate-800 px-3 py-1.5 text-left">UFR</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {selected.map((id, i) => {
                                                                                const b = voyage.beneficiaires?.find(ben => ben.id === id)
                                                                                return (
                                                                                    <tr key={id}>
                                                                                        <td className="border border-slate-800 px-3 py-1.5">{i + 1}</td>
                                                                                        <td className="border border-slate-800 px-3 py-1.5">{b?.enseignant?.prenom}</td>
                                                                                        <td className="border border-slate-800 px-3 py-1.5 font-bold">{b?.enseignant?.nom?.toUpperCase()}</td>
                                                                                        <td className="border border-slate-800 px-3 py-1.5">{b?.enseignant?.ufr || '-'}</td>
                                                                                    </tr>
                                                                                )
                                                                            })}
                                                                        </tbody>
                                                                    </table>

                                                                    <div className="flex justify-end">
                                                                        <SignaturePad
                                                                            storageKey={`signature_vr_definitive_${voyage.id}`}
                                                                            label="Le Vice-Recteur"
                                                                            onSaved={(sig) => setSignaturesDefinitives(prev => ({ ...prev, [voyage.id]: sig }))}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-3">
                                                                    <button onClick={() => setDefinitiveStep(prev => ({ ...prev, [voyage.id]: 'selection' }))}
                                                                        className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                                                                        Modifier la selection
                                                                    </button>
                                                                    <button onClick={() => publierListeDefinitive(voyage.id)}
                                                                        disabled={actionLoading === 'liste_' + voyage.id || !signaturesDefinitives[voyage.id]}
                                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                                                                        {actionLoading === 'liste_' + voyage.id
                                                                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                            : <Check size={16} />}
                                                                        Signer et transferer au Recteur
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
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
                        {dossiersAffiches.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                                <FileText size={40} className="mx-auto mb-4 text-slate-300" />
                                <h3 className="text-slate-700 font-semibold mb-2">Aucun dossier</h3>
                                <p className="text-slate-400 text-sm">
                                    {dossiersEnAttente.length === 0 ? 'Les dossiers transmis par les Chefs de Departement apparaitront ici' : 'Aucun résultat pour cette recherche'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <BarreSelection
                                    selected={selectedDossiers}
                                    total={dossiersAffiches.length}
                                    onSelectAll={() => setSelectedDossiers(
                                        selectedDossiers.length === dossiersAffiches.length ? [] : dossiersAffiches.map(d => d.id)
                                    )}
                                    onDeleteSelected={() => supprimerDossiers(selectedDossiers)}
                                    onDeleteAll={() => supprimerDossiers(dossiersAffiches.map(d => d.id))}
                                />
                                {dossiersAffiches.map(d => {
                                    const avisVR         = d.avis?.find(a => a.user?.role === 'vice_recteur')
                                    const avisCommission = d.avis?.filter(a => a.user?.role === 'commission') || []
                                    const isAvisOuvert   = avisOuvert === d.id

                                    return (
                                        <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition ${
                                            selectedDossiers.includes(d.id) ? 'border-blue-300' : 'border-slate-100'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedDossiers.includes(d.id)}
                                                        onChange={() => setSelectedDossiers(prev =>
                                                            prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]
                                                        )}
                                                        className="w-4 h-4 accent-blue-600 cursor-pointer mt-1" />
                                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                                                        {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-blue-950">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                        <p className="text-xs text-slate-500">{d.enseignant?.ufr} · {d.enseignant?.departement || ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-slate-700">{d.voyage?.destination}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(d.voyage?.date_debut).toLocaleDateString('fr-FR')} - {new Date(d.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>

                                            {d.justificatifs?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Justificatifs ({d.justificatifs.length}) :</p>
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
                                                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Avis commission :</p>
                                                    {avisCommission.map(a => (
                                                        <div key={a.id} className="flex items-start gap-2">
                                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${a.avis === 'valide' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${a.avis === 'valide' ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                                                {a.avis === 'valide' ? 'Valide' : 'Rejete'}
                                                            </span>
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-700">{a.user?.prenom} {a.user?.nom}</p>
                                                                {a.commentaire && <p className="text-xs text-slate-500">{a.commentaire}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {avisVR ? (
                                                <div className={`flex items-center gap-2 p-3 rounded-xl ${avisVR.avis === 'valide' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                                                    {avisVR.avis === 'valide' ? <CheckCircle size={16} className="text-emerald-600" /> : <X size={16} className="text-rose-600" />}
                                                    <p className="text-sm font-medium">
                                                        Votre avis : <span className={avisVR.avis === 'valide' ? 'text-emerald-700' : 'text-rose-700'}>{avisVR.avis === 'valide' ? 'Valide' : 'Rejete'}</span>
                                                    </p>
                                                    {avisVR.commentaire && <p className="text-xs text-slate-500 ml-2">{avisVR.commentaire}</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {isAvisOuvert && (
                                                        <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                                                            placeholder="Commentaire (optionnel)..." rows={2}
                                                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                                    )}
                                                    <div className="flex gap-2">
                                                        {!isAvisOuvert ? (
                                                            <button onClick={() => setAvisOuvert(d.id)}
                                                                className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                                                                <MessageSquare size={14} /> Donner mon avis
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => donnerAvis(d.id, 'valide')}
                                                                    disabled={actionLoading === 'avis_' + d.id + '_valide'}
                                                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                    {actionLoading === 'avis_' + d.id + '_valide'
                                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        : <CheckCircle size={14} />}
                                                                    Valider
                                                                </button>
                                                                <button onClick={() => donnerAvis(d.id, 'rejete')}
                                                                    disabled={actionLoading === 'avis_' + d.id + '_rejete'}
                                                                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                    {actionLoading === 'avis_' + d.id + '_rejete'
                                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        : <X size={14} />}
                                                                    Rejeter
                                                                </button>
                                                                <button onClick={() => { setAvisOuvert(null); setCommentaire('') }}
                                                                    className="text-slate-400 hover:text-slate-600 px-2">
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {d.autorisation_absence && d.autorisation_absence.id && (
                                                <button onClick={() => navigate('/autorisation-absence/' + d.autorisation_absence.id)}
                                                    className="flex items-center gap-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
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