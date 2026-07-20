import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { STORAGE_URL } from '../../api/storageUrl'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { FileText, CheckCircle, AlertCircle, Eye, MessageSquare, X, Trash2, MapPin, Search, Layers } from 'lucide-react'


export default function CommissionDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [dossiers, setDossiers]           = useState([])
    const [listesPubliees, setListesPubliees] = useState([])
    const [loading, setLoading]             = useState(true)
    const [avisOuvert, setAvisOuvert]       = useState(null)
    const [commentaire, setCommentaire]     = useState('')
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage]             = useState('')
    const [error, setError]                 = useState('')
    const [filtreVue, setFiltreVue]         = useState('listes')
    const [selected, setSelected]           = useState([])
    const [selectedListes, setSelectedListes] = useState([])
    const [justifOuvert, setJustifOuvert]   = useState(null)
    const [pdfAffiche, setPdfAffiche] = useState(null) 
    const [searchQuery, setSearchQuery]     = useState('')

    useEffect(() => { fetchDossiers(); fetchListesPubliees() }, [])

    const fetchDossiers = async () => {
        try {
            const res = await api.get('/voyages-etudes/dossiers-a-valider')
            setDossiers(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchListesPubliees = async () => {
        try {
            const res = await api.get('/voyages-etudes/listes-publiees')
            setListesPubliees(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 3000)
    }

    const donnerAvis = async (beneficiaireId, avis) => {
        setActionLoading('avis_' + beneficiaireId + '_' + avis)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/avis`, {
                avis,
                commentaire: commentaire || null,
            })
            showMsg(
                avis === 'valide'
                    ? 'Dossier valide et transmis au Vice-Recteur'
                    : 'Dossier rejete. Le Vice-Recteur a ete informe.'
            )
            setAvisOuvert(null)
            setCommentaire('')
            fetchDossiers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    // ===== SÉLECTION DOSSIERS TRAITÉS =====
    const toggleSelect = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAll = () =>
        setSelected(selected.length === traitesAffiches.length ? [] : traitesAffiches.map(d => d.id))

    const supprimerSelectionnes = async () => {
        if (!confirm(`Supprimer ${selected.length} dossier(s) ?`)) return
        try {
            for (const id of selected) await api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`)
            showMsg('Suppression effectuée')
            setSelected([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerTous = async () => {
        if (!confirm('Supprimer tous les dossiers traités ?')) return
        try {
            for (const d of traitesAffiches) await api.delete(`/voyages-etudes/beneficiaire/${d.id}/dossier`)
            showMsg('Tous les dossiers supprimés')
            setSelected([])
            fetchDossiers()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    // ===== SÉLECTION LISTES PUBLIÉES =====
    const toggleSelectListe = (id) =>
        setSelectedListes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllListes = () =>
        setSelectedListes(selectedListes.length === listesPublieesAffichees.length ? [] : listesPublieesAffichees.map(v => v.id))

    const supprimerListesSelectionnees = async () => {
        if (!confirm(`Supprimer ${selectedListes.length} liste(s) ?`)) return
        try {
            for (const id of selectedListes) await api.delete(`/voyages-etudes/${id}`)
            showMsg('Liste(s) supprimée(s) de votre vue')
            setSelectedListes([])
            fetchListesPubliees()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerToutesListes = async () => {
        if (!confirm('Supprimer toutes les listes publiées de votre vue ?')) return
        try {
            for (const v of listesPublieesAffichees) await api.delete(`/voyages-etudes/${v.id}`)
            showMsg('Toutes les listes supprimées de votre vue')
            setSelectedListes([])
            fetchListesPubliees()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

   
const monRole = user?.role

const enAttente = dossiers.filter(d => !d.avis?.some(a => a.user_id === user?.id))
const traites   = dossiers.filter(d =>  d.avis?.some(a => a.user_id === user?.id))

    // Filtres de recherche
    const filtrerListes = (liste) => liste.filter(v =>
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

    const listesPublieesAffichees = filtrerListes(listesPubliees)
    const enAttenteAffiches       = filtrerDossiers(enAttente)
    const traitesAffiches         = filtrerDossiers(traites)

    const totalDossiers = listesPubliees.length + enAttente.length + traites.length

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Commission Voyages d'etudes</h1>
                    <p className="text-gray-500 text-sm mt-1">Validation des dossiers de justificatifs</p>
                </div>

               {/* Cartes statistiques — cliquables, juste un effet hover, pas de couleur au clic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Layers size={20} className="text-blue-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{totalDossiers}</p>
                        <p className="text-sm text-gray-500 mt-1">Total des dossiers</p>
                    </div>

                    <div
                        onClick={() => setFiltreVue('listes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-purple-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <MapPin size={20} className="text-purple-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{listesPubliees.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Listes publiées</p>
                    </div>

                    <div
                        onClick={() => setFiltreVue('attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-orange-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <FileText size={20} className="text-orange-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{enAttente.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Dossiers a traiter</p>
                    </div>

                    <div
                        onClick={() => setFiltreVue('traites')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} className="text-green-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{traites.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Dossiers traites</p>
                    </div>
                </div>
{/* Onglets de navigation (séparés des cartes stats) */}
<div className="flex gap-2 border-b border-gray-200 flex-wrap">
    {[
        { key: 'listes', label: 'Listes publiées', count: listesPubliees.length, accent: false },
        { key: 'attente', label: 'A traiter', count: enAttente.length, accent: true },
        { key: 'traites', label: 'Traites', count: traites.length, accent: false },
    ].map(tab => (
        <button key={tab.key} onClick={() => setFiltreVue(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                filtreVue === tab.key
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                tab.accent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}>
                {tab.count}
            </span>
        </button>
    ))}
</div>
                {/* Recherche */}
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par enseignant, année, UFR..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                        <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* ===== ONGLET LISTES PUBLIEES ===== */}
                        {filtreVue === 'listes' && (
                            listesPubliees.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune liste publiee</h3>
                                    <p className="text-gray-400 text-sm">Les listes publiees par le Vice-Recteur apparaitront ici</p>
                                </div>
                            ) : listesPublieesAffichees.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <Search size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun resultat</h3>
                                    <p className="text-gray-400 text-sm">Aucune liste ne correspond a votre recherche</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                                        Listes publiees ({listesPublieesAffichees.length})
                                    </h2>

                                    {/* Barre sélection listes */}
                                    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox"
                                                checked={selectedListes.length === listesPublieesAffichees.length && listesPublieesAffichees.length > 0}
                                                onChange={toggleSelectAllListes}
                                                className="w-4 h-4 accent-gray-700 cursor-pointer" />
                                            <span className="text-sm text-gray-600">
                                                {selectedListes.length > 0 ? `${selectedListes.length} sélectionnée(s)` : 'Tout sélectionner'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedListes.length > 0 && (
                                                <button onClick={supprimerListesSelectionnees}
                                                    className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                                                    <Trash2 size={13} /> Supprimer ({selectedListes.length})
                                                </button>
                                            )}
                                            <button onClick={supprimerToutesListes}
                                                className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                                                <Trash2 size={13} /> Supprimer tout
                                            </button>
                                        </div>
                                    </div>

                                    {listesPublieesAffichees.map(v => (
                                        <div key={v.id} className={`rounded-xl border shadow-sm overflow-hidden ${
                                            selectedListes.includes(v.id) ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-100'
                                        }`}>
                                            <div className="flex items-center gap-3 p-4">
                                                <input type="checkbox"
                                                    checked={selectedListes.includes(v.id)}
                                                    onChange={() => toggleSelectListe(v.id)}
                                                    className="w-4 h-4 accent-gray-700 cursor-pointer" />
                                                <div className="flex items-center justify-between flex-1 px-2 py-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <MapPin size={14} className="text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{v.destination}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(v.date_debut).toLocaleDateString('fr-FR')} - {new Date(v.date_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/voyages-etudes/${v.id}/liste-publiee`)}
                                                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                                                        <FileText size={12} />
                                                        Voir la liste (PDF)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== ONGLET EN ATTENTE ===== */}
                        {filtreVue === 'attente' && (
                            enAttente.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun dossier en attente</h3>
                                    <p className="text-gray-400 text-sm">Tous les dossiers ont ete traites</p>
                                </div>
                            ) : enAttenteAffiches.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <Search size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun resultat</h3>
                                    <p className="text-gray-400 text-sm">Aucun dossier ne correspond a votre recherche</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                                        A traiter ({enAttenteAffiches.length})
                                    </h2>
                                    {enAttenteAffiches.map(d => {
                                        const isAvisOuvert = avisOuvert === d.id
                                        const avisVR = d.avis?.find(a => a.user?.role === 'vice_recteur')

                                        return (
                                            <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 relative">
                                                {avisVR && (
                                                    <span className={`absolute top-5 right-5 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                                                        avisVR.avis === 'valide' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {avisVR.avis === 'valide' ? <CheckCircle size={12} /> : <X size={12} />}
                                                        Avis VR : {avisVR.avis === 'valide' ? 'Valide' : 'Rejete'}
                                                    </span>
                                                )}

                                                <div className="flex items-start justify-between pr-32">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                                            {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                            <p className="text-xs text-gray-500">{d.enseignant?.ufr}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right -mt-2">
                                                    <p className="text-sm font-medium text-gray-700">{d.voyage?.destination}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(d.voyage?.date_debut).toLocaleDateString('fr-FR')} - {new Date(d.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>

                                                {avisVR?.commentaire && (
                                                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{avisVR.commentaire}</p>
                                                )}

                                                {d.justificatifs?.length > 0 && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Justificatifs ({d.justificatifs.length}) :</p>
                                                        {d.justificatifs.map(j => (
                                                          <button key={j.id}
    onClick={() => {
        if (j.nom_original?.startsWith('Rapport_de_voyage_')) {
    navigate(`/rapports/${d.rapport_id}/document`)
} else {
    setPdfAffiche(`${STORAGE_URL}/storage/${j.fichier_pdf}`)
}
    }}
    className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
    <Eye size={14} /> {j.nom_original || 'Fichier PDF'}
</button>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    {isAvisOuvert && (
                                                        <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                                                            placeholder="Commentaire (optionnel)..." rows={2}
                                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                                                    )}
                                                    <div className="flex gap-2 flex-wrap">
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
                                                                    Valider le dossier
                                                                </button>
                                                                <button onClick={() => donnerAvis(d.id, 'rejete')}
                                                                    disabled={actionLoading === 'avis_' + d.id + '_rejete'}
                                                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                    {actionLoading === 'avis_' + d.id + '_rejete'
                                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        : <X size={14} />}
                                                                    Rejeter le dossier
                                                                </button>
                                                                <button onClick={() => { setAvisOuvert(null); setCommentaire('') }}
                                                                    className="text-gray-400 hover:text-gray-600 px-2">
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}

                        {/* ===== ONGLET TRAITÉS ===== */}
                        {filtreVue === 'traites' && (
                            traites.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun dossier traite</h3>
                                    <p className="text-gray-400 text-sm">Les dossiers que vous avez traites apparaitront ici</p>
                                </div>
                            ) : traitesAffiches.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <Search size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun resultat</h3>
                                    <p className="text-gray-400 text-sm">Aucun dossier ne correspond a votre recherche</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                                        Traites ({traitesAffiches.length})
                                    </h2>

                                    {/* Barre sélection */}
                                    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox"
                                                checked={selected.length === traitesAffiches.length && traitesAffiches.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 accent-gray-700 cursor-pointer" />
                                            <span className="text-sm text-gray-600">
                                                {selected.length > 0 ? `${selected.length} sélectionné(s)` : 'Tout sélectionner'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {selected.length > 0 && (
                                                <button onClick={supprimerSelectionnes}
                                                    className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                                                    <Trash2 size={13} /> Supprimer ({selected.length})
                                                </button>
                                            )}
                                            <button onClick={supprimerTous}
                                                className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                                                <Trash2 size={13} /> Supprimer tout
                                            </button>
                                        </div>
                                    </div>

                                    {/* Liste dossiers traités */}
                                    {traitesAffiches.map(d => {
                                        const monAvis = d.avis?.find(a => a.user?.role === 'commission')
                                        const isOuvert = justifOuvert === d.id
                                        return (
                                            <div key={d.id} className={`rounded-2xl border p-4 transition ${
                                                selected.includes(d.id) ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-100 shadow-sm'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox"
                                                            checked={selected.includes(d.id)}
                                                            onChange={() => toggleSelect(d.id)}
                                                            className="w-4 h-4 accent-gray-700 cursor-pointer" />
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold text-xs">
                                                            {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                            <p className="text-xs text-gray-500">{d.voyage?.destination}</p>
                                                            {monAvis?.commentaire && (
                                                                <p className="text-xs text-gray-500 mt-0.5">"{monAvis.commentaire}"</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {d.justificatifs?.length > 0 && (
                                                            <button onClick={() => setJustifOuvert(isOuvert ? null : d.id)}
                                                                className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                                                <Eye size={13} /> Voir justificatifs ({d.justificatifs.length})
                                                            </button>
                                                        )}
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                            monAvis?.avis === 'valide'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {monAvis?.avis === 'valide' ? 'Valide' : 'Rejete'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isOuvert && d.justificatifs?.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                                                      {d.justificatifs.map(j => (
    <button key={j.id}
        onClick={() => {
            if (j.nom_original?.startsWith('Rapport_de_voyage_')) {
                navigate(`/rapports/${d.rapport_id}/document`)
            } else {
                setPdfAffiche(`${STORAGE_URL}/storage/${j.fichier_pdf}`)
            }
        }}
        className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
        <FileText size={14} /> {j.nom_original || 'Fichier PDF'}
    </button>
))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                        )
                                    })}
                                </div>
                            )
                        )}
                    </div>
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
)}  </Layout>
    )
}