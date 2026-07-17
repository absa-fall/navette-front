import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, CheckCircle, AlertCircle, FileText, Eye, Trash2, History, Search } from 'lucide-react'

export default function RecteurDashboard() {
    const navigate  = useNavigate()
    const location  = useLocation()
    const [voyages, setVoyages]             = useState([])
    const [loading, setLoading]             = useState(true)
    const [activeTab, setActiveTab]         = useState('arretes')
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage]             = useState('')
    const [error, setError]                 = useState('')
const [searchQuery, setSearchQuery] = useState('')
    const [selectedDefinitifs, setSelectedDefinitifs]         = useState([])
    const [selectedSignes, setSelectedSignes]                 = useState([])
    const [selectedAbsAttente, setSelectedAbsAttente]         = useState([])
    const [selectedAbsHistorique, setSelectedAbsHistorique]   = useState([])
    const [autorisationsAbsence, setAutorisationsAbsence]     = useState([])
    const [arreteOuvert, setArreteOuvert] = useState(null)
    const [arreteForm, setArreteForm]     = useState({
        numero: '', date_arrete: '', visas: '', montant_billet: '', montant_indemnite: ''
    })

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (['arretes', 'autorisations_absence', 'historique_arretes', 'historique_absences'].includes(tab)) setActiveTab(tab)
    }, [location.search])

    useEffect(() => { fetchAll() }, [])

    const fetchAll = async () => {
        try {
            const [voyagesRes, autorisationsAbsenceRes] = await Promise.all([
                api.get('/voyages-etudes'),
                api.get('/autorisations-absence'),
            ])
            setVoyages(voyagesRes.data)
            setAutorisationsAbsence(autorisationsAbsenceRes.data)
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

    const exporterPDFDefinitif = (voyage) => {
        const definitifs = voyage.beneficiaires?.filter(b => b.dans_liste_definitive) || []
        const contenu = `
            <html><head><style>
                body { font-family: Arial, sans-serif; padding: 30px; font-size: 13px; }
                h1 { color: #1d4ed8; font-size: 16px; }
                p { color: #6b7280; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #ffffff; color: #111827; padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #e5e7eb; }
                td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
                tr:nth-child(even) { background: #f9fafb; }
                .footer { margin-top: 30px; font-size: 10px; color: #9ca3af; text-align: center; }
            </style></head><body>
            <h1>Liste definitive des beneficiaires — ${voyage.destination}</h1>
            <p>
                Du ${new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au ${new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                — Total : ${definitifs.length} beneficiaire(s)
            </p>
            <table>
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Prenom</th>
                        <th>Nom</th>
                        <th>UFR</th>
                        <th>Departement</th>
                    </tr>
                </thead>
                <tbody>
                    ${definitifs.map((b, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${b.enseignant?.prenom || ''}</td>
                            <td>${b.enseignant?.nom || ''}</td>
                            <td>${b.enseignant?.ufr || '-'}</td>
                            <td>${b.enseignant?.departement || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">UADB Mobilite — Liste a valider avant redaction de l'arrete — Genere le ${new Date().toLocaleDateString('fr-FR')}</div>
            <button onclick="window.print()" style="position:fixed;bottom:20px;right:20px;background:#1d4ed8;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">
                Imprimer / PDF
            </button>
            </body></html>
        `
        const win = window.open('', '_blank')
        win.document.write(contenu)
        win.document.close()
    }

    const creerArrete = async (voyageId) => {
    if (!arreteForm.numero || !arreteForm.date_arrete || !arreteForm.visas || !arreteForm.montant_billet || !arreteForm.montant_indemnite) {
        showMsg('Veuillez remplir tous les champs', true)
        return
    }
    setActionLoading('arrete_' + voyageId)
    try {
        await api.post(`/voyages-etudes/${voyageId}/arrete`, { ...arreteForm, statut: 'brouillon' })
        setArreteOuvert(null)
        setArreteForm({ numero: '', date_arrete: '', visas: '', montant_billet: '', montant_indemnite: '' })
        // On redirige directement vers l'aperçu/signature de l'arrêté
        navigate(`/voyages-etudes/${voyageId}/arrete`)
    } catch (err) {
        showMsg(err.response?.data?.message || 'Erreur', true)
    } finally {
        setActionLoading(null)
    }
}

    const signerAutorisationAbsence = async (autorisationId) => {
        setActionLoading(autorisationId + '_signer_absence')
        try {
            await api.patch(`/autorisations-absence/${autorisationId}/signer-recteur`)
            showMsg("Autorisation signee et transmise a l'enseignant")
            fetchAll()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    // ===== SELECTION VOYAGES DEFINITIFS =====
    const supprimerVoyages = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} voyage(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/voyages-etudes/${id}`)
            setVoyages(prev => prev.filter(v => !ids.includes(v.id)))
            setSelectedDefinitifs(prev => prev.filter(i => !ids.includes(i)))
            setSelectedSignes(prev => prev.filter(i => !ids.includes(i)))
            showMsg('Suppression effectuee')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }
const supprimerArretes = async (voyageIds) => {
    if (!confirm(`Supprimer ${voyageIds.length} arrete(s) ?`)) return
    let reussis = 0
    let echecs = 0
    for (const voyageId of voyageIds) {
        try {
            const arreteRes = await api.get(`/voyages-etudes/${voyageId}/arrete`)
            if (arreteRes.data?.id) {
                await api.delete(`/arretes/${arreteRes.data.id}`)
            }
            reussis++
        } catch (err) {
            console.error(`Erreur suppression arrete du voyage ${voyageId} :`, err.response?.status, err.response?.data)
            echecs++
        }
    }
    setSelectedSignes([])
    if (echecs === 0) {
        showMsg(`${reussis} arrete(s) supprime(s)`)
    } else {
        showMsg(`${reussis} supprime(s), ${echecs} echec(s) — verifiez la console`, echecs === voyageIds.length)
    }
    fetchAll()
}
    const definitifs                    = voyages.filter(v => v.statut_liste === 'definitive' && !v.arrete_recteur)
    const signes                        = voyages.filter(v => v.arrete_recteur)
    const autorisationsAbsenceEnAttente = autorisationsAbsence.filter(a => a.statut === 'avis_directeur_ufr')
    const autorisationsAbsenceSignees   = autorisationsAbsence.filter(a => ['signee_recteur', 'transmise'].includes(a.statut))

    const filtrerVoyages = (liste) => liste.filter(v =>
        searchQuery === '' ||
        v.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filtrerAbsences = (liste) => liste.filter(a =>
        searchQuery === '' ||
        a.enseignant?.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.enseignant?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.lieu_deplacement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.numero?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const definitifsAffiches    = filtrerVoyages(definitifs)
    const signesAffiches        = filtrerVoyages(signes)
    const absEnAttenteAffichees = filtrerAbsences(autorisationsAbsenceEnAttente)
    const absSigneesAffichees   = filtrerAbsences(autorisationsAbsenceSignees)

    // ===== SELECTION ABSENCES EN ATTENTE =====
    const toggleSelectAbsAttente = (id) =>
        setSelectedAbsAttente(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllAbsAttente = () =>
        setSelectedAbsAttente(selectedAbsAttente.length === absEnAttenteAffichees.length ? [] : absEnAttenteAffichees.map(a => a.id))

    const supprimerAbsAttenteSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedAbsAttente.length} demande(s) ?`)) return
        try {
            for (const id of selectedAbsAttente) await api.delete(`/autorisations-absence/${id}`)
            showMsg('Suppression effectuee')
            setSelectedAbsAttente([])
            fetchAll()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerToutesAbsAttente = async () => {
        if (!confirm('Supprimer toutes les demandes en attente ?')) return
        try {
            for (const a of absEnAttenteAffichees) await api.delete(`/autorisations-absence/${a.id}`)
            showMsg('Toutes les demandes supprimees')
            setSelectedAbsAttente([])
            fetchAll()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    // ===== SELECTION HISTORIQUE ABSENCES =====
    const toggleSelectAbsHistorique = (id) =>
        setSelectedAbsHistorique(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const toggleSelectAllAbsHistorique = () =>
        setSelectedAbsHistorique(selectedAbsHistorique.length === absSigneesAffichees.length ? [] : absSigneesAffichees.map(a => a.id))

    const supprimerAbsHistoriqueSelectionnes = async () => {
        if (!confirm(`Supprimer ${selectedAbsHistorique.length} element(s) ?`)) return
        try {
            for (const id of selectedAbsHistorique) await api.delete(`/autorisations-absence/${id}`)
            showMsg('Suppression effectuee')
            setSelectedAbsHistorique([])
            fetchAll()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerToutAbsHistorique = async () => {
        if (!confirm("Vider tout l'historique des absences ?")) return
        try {
            for (const a of absSigneesAffichees) await api.delete(`/autorisations-absence/${a.id}`)
            showMsg('Historique vide')
            setSelectedAbsHistorique([])
            fetchAll()
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const BarreSelection = ({ selected, total, onSelectAll, onDeleteSelected, onDeleteAll }) => (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
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
       <Layout title="Dashboard" subtitle="Signature des arretes et autorisations">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Recteur</h1>
                    <p className="text-gray-500 text-sm mt-1">Signature des arretes et autorisations</p>
                </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div onClick={() => setActiveTab('arretes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                        <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <FileText size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{definitifs.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Arretes a signer</p>
                    </div>
                    <div onClick={() => setActiveTab('autorisations_absence')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                        <div className="bg-orange-100 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <FileText size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{autorisationsAbsenceEnAttente.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Absences a signer</p>
                    </div>
                    <div onClick={() => setActiveTab('historique_arretes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                        <div className="bg-green-100 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{signes.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Arretes signes</p>
                    </div>
                    <div onClick={() => setActiveTab('historique_absences')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                        <div className="bg-purple-100 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <History size={20} className="text-purple-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{autorisationsAbsenceSignees.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Absences signees</p>
                    </div>
                </div>
                <div className="flex gap-2 border-b border-gray-200 flex-wrap">
                    {[
                        { key: 'arretes', label: 'Arretes a signer', count: definitifs.length, color: 'orange' },
                        { key: 'autorisations_absence', label: 'Absences a signer', count: autorisationsAbsenceEnAttente.length, color: 'purple' },
                        { key: 'historique_arretes', label: 'Historique arretes', count: signes.length, color: 'green' },
                        { key: 'historique_absences', label: 'Historique absences', count: autorisationsAbsenceSignees.length, color: 'purple' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'border-blue-700 text-blue-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`bg-${tab.color}-100 text-${tab.color}-700 text-xs rounded-full px-1.5 py-0.5 font-bold`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
{/* Recherche */}
<div className="relative max-w-sm">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
        type="text"
        placeholder="Rechercher par destination, enseignant, lieu..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
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
                        {/* ===== ARRETES A SIGNER ===== */}
                        {activeTab === 'arretes' && (
                            definitifsAffiches.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun arrete en attente</h3>
                                    <p className="text-gray-400 text-sm">Les listes definitives apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedDefinitifs}
                                        total={definitifsAffiches.length}
                                        onSelectAll={() => setSelectedDefinitifs(
                                            selectedDefinitifs.length === definitifsAffiches.length ? [] : definitifsAffiches.map(v => v.id)
                                        )}
                                        onDeleteSelected={() => supprimerVoyages(selectedDefinitifs)}
                                        onDeleteAll={() => supprimerVoyages(definitifsAffiches.map(v => v.id))}
                                    />
                                    {definitifsAffiches.map(voyage => (
                                        <div key={voyage.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                            selectedDefinitifs.includes(voyage.id) ? 'border-blue-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedDefinitifs.includes(voyage.id)}
                                                        onChange={() => setSelectedDefinitifs(prev =>
                                                            prev.includes(voyage.id) ? prev.filter(i => i !== voyage.id) : [...prev, voyage.id]
                                                        )}
                                                        className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                                    <div className="bg-blue-100 p-3 rounded-xl">
                                                        <MapPin size={20} className="text-blue-700" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{voyage.destination}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} - {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {voyage.beneficiaires?.filter(b => b.dans_liste_definitive).length} beneficiaire(s)
                                                        </p>
                                                    </div>
                                                </div>
                                              <div className="flex items-center gap-2">
                                                    <button onClick={() => navigate(`/voyages-etudes/${voyage.id}/liste-definitive`)}
                                                        className="flex items-center gap-1 border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                                                        <Eye size={12} /> Voir la liste
                                                    </button>
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                                                        En attente
                                                    </span>
                                                </div>
                                            </div>


                                            {arreteOuvert !== voyage.id ? (
                                                <button onClick={() => setArreteOuvert(voyage.id)}
                                                    className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition">
                                                    <FileText size={16} /> Rediger l'arrete
                                                </button>
                                            ) : (
                                                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Numero de l'arrete</label>
                                                        <input type="text" placeholder="Ex : 157/UAD/R/SG/DRH"
                                                            value={arreteForm.numero}
                                                            onChange={e => setArreteForm({ ...arreteForm, numero: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Date de l'arrete</label>
                                                        <input type="date"
                                                            value={arreteForm.date_arrete}
                                                            onChange={e => setArreteForm({ ...arreteForm, date_arrete: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Visas (lois et decrets, un par ligne)</label>
                                                        <textarea placeholder="VU la loi n° 81-59 du 09 novembre 1981..."
                                                            value={arreteForm.visas}
                                                            onChange={e => setArreteForm({ ...arreteForm, visas: e.target.value })}
                                                            rows={5}
                                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Montant billet (FCFA)</label>
                                                            <input type="number" placeholder="500000"
                                                                value={arreteForm.montant_billet}
                                                                onChange={e => setArreteForm({ ...arreteForm, montant_billet: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Indemnite forfaitaire (FCFA)</label>
                                                            <input type="number" placeholder="1000000"
                                                                value={arreteForm.montant_indemnite}
                                                                onChange={e => setArreteForm({ ...arreteForm, montant_indemnite: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => creerArrete(voyage.id)}
    disabled={actionLoading === 'arrete_' + voyage.id}
    className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50">
    {actionLoading === 'arrete_' + voyage.id
        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <FileText size={16} />}
    Aperçu et signature
</button>
                                                        <button onClick={() => setArreteOuvert(null)}
                                                            className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== ABSENCES A SIGNER ===== */}
                        {activeTab === 'autorisations_absence' && (
                            absEnAttenteAffichees.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune demande</h3>
                                    <p className="text-gray-400 text-sm">Les autorisations approuvees par le Directeur UFR apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedAbsAttente}
                                        total={absEnAttenteAffichees.length}
                                        onSelectAll={toggleSelectAllAbsAttente}
                                        onDeleteSelected={supprimerAbsAttenteSelectionnes}
                                        onDeleteAll={supprimerToutesAbsAttente}
                                    />
                                    {absEnAttenteAffichees.map(a => (
                                        <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                            selectedAbsAttente.includes(a.id) ? 'border-purple-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedAbsAttente.includes(a.id)}
                                                        onChange={() => toggleSelectAbsAttente(a.id)}
                                                        className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
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

                                            <div className="bg-purple-50 rounded-xl p-3 mb-4">
                                                <p className="text-sm text-purple-700">
                                                    Le Directeur UFR a approuve cette demande. Votre signature est requise avant transmission a l'enseignant.
                                                </p>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                <button onClick={() => navigate('/autorisation-absence/' + a.id)}
                                                    className="flex items-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                    <Eye size={14} />
                                                    Voir le document
                                                </button>
                                                <button onClick={() => signerAutorisationAbsence(a.id)}
                                                    disabled={actionLoading === a.id + '_signer_absence'}
                                                    className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                    {actionLoading === a.id + '_signer_absence'
                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        : <CheckCircle size={14} />}
                                                    Signer et transmettre a l'enseignant
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== HISTORIQUE ARRETES ===== */}
                        {activeTab === 'historique_arretes' && (
                            signesAffiches.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <History size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun arrete signe</h3>
                                    <p className="text-gray-400 text-sm">Les arretes que vous signez apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedSignes}
                                        total={signesAffiches.length}
                                        onSelectAll={() => setSelectedSignes(
                                            selectedSignes.length === signesAffiches.length ? [] : signesAffiches.map(v => v.id)
                                        )}
                                       onDeleteSelected={() => supprimerArretes(selectedSignes)}
onDeleteAll={() => supprimerArretes(signesAffiches.map(v => v.id))}
                                    />
                                    {signesAffiches.map(voyage => (
                                        <div key={voyage.id} className={`rounded-2xl p-4 flex items-center justify-between border transition ${
                                            selectedSignes.includes(voyage.id) ? 'bg-green-50 border-blue-300' : 'bg-green-50 border-green-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox"
                                                    checked={selectedSignes.includes(voyage.id)}
                                                    onChange={() => setSelectedSignes(prev =>
                                                        prev.includes(voyage.id) ? prev.filter(i => i !== voyage.id) : [...prev, voyage.id]
                                                    )}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{voyage.destination}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} - {new Date(voyage.date_fin).toLocaleDateString('fr-FR')} · {voyage.beneficiaires?.filter(b => b.dans_liste_definitive).length} beneficiaire(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                                                    <CheckCircle size={14} /> Signe
                                                </span>
                                                <button onClick={() => navigate(`/voyages-etudes/${voyage.id}/arrete`)}
                                                    className="flex items-center gap-1.5 border border-green-600 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                                                    <Eye size={13} /> Voir l'arrete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== HISTORIQUE ABSENCES ===== */}
                        {activeTab === 'historique_absences' && (
                            absSigneesAffichees.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <History size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                                    <p className="text-gray-400 text-sm">Les autorisations d'absence signees apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedAbsHistorique}
                                        total={absSigneesAffichees.length}
                                        onSelectAll={toggleSelectAllAbsHistorique}
                                        onDeleteSelected={supprimerAbsHistoriqueSelectionnes}
                                        onDeleteAll={supprimerToutAbsHistorique}
                                    />
                                    {absSigneesAffichees.map(a => (
                                        <div key={a.id} className={`rounded-2xl border p-4 flex items-center justify-between transition ${
                                            selectedAbsHistorique.includes(a.id) ? 'bg-purple-50 border-blue-300' : 'bg-purple-50 border-purple-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox"
                                                    checked={selectedAbsHistorique.includes(a.id)}
                                                    onChange={() => toggleSelectAbsHistorique(a.id)}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                                                    {a.enseignant?.prenom?.[0]}{a.enseignant?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{a.enseignant?.prenom} {a.enseignant?.nom}</p>
                                                    <p className="text-xs text-gray-500">{a.numero} — {a.lieu_deplacement}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-xs font-semibold text-purple-700">
                                                    <CheckCircle size={12} /> Signee et transmise
                                                </span>
                                                <button onClick={() => navigate('/autorisation-absence/' + a.id)}
                                                    className="flex items-center gap-1.5 border border-purple-600 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
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
        </Layout>
    )
}