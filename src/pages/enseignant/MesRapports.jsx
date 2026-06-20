import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
    FileText, CheckCircle, XCircle, Clock, RefreshCw, Download, Eye,
    Trash2, Send, AlertCircle, Plus, MapPin, Upload, X, ShieldCheck
} from 'lucide-react'

const statutConfig = {
    soumis: { label: 'Soumis',  color: 'bg-blue-100 text-blue-700',  icon: Clock },
    valide: { label: 'Validé',  color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700',    icon: XCircle },
}

const autorisationStatutConfig = {
    demande_chef_dept:     { label: 'En attente Chef Dép',     color: 'bg-yellow-100 text-yellow-700' },
    envoye_directeur_ufr:  { label: 'Chez Directeur UFR',      color: 'bg-orange-100 text-orange-700' },
    envoye_recteur:        { label: 'Chez le Recteur',         color: 'bg-purple-100 text-purple-700' },
    approuve_recteur:      { label: 'Approuvé Recteur',        color: 'bg-blue-100 text-blue-700' },
    approuve:              { label: 'Approuvée ✓',             color: 'bg-green-100 text-green-700' },
    rejete:                { label: 'Rejetée',                 color: 'bg-red-100 text-red-700' },
}

export default function EnseignantMesRapports() {
    const navigate  = useNavigate()

    // États
    const [rapports, setRapports]                   = useState([])
    const [mesVoyages, setMesVoyages]               = useState([])
    const [autorisations, setAutorisations]         = useState([])
    const [loading, setLoading]                     = useState(true)
    const [selected, setSelected]                   = useState(null)
    const [suppLoading, setSuppLoading]             = useState(null)
    const [confirmSupp, setConfirmSupp]             = useState(null)
    const [selectedRapports, setSelectedRapports]   = useState([])
    const [showChoixVoyage, setShowChoixVoyage]     = useState(false)
    const [message, setMessage]                     = useState('')
    const [error, setError]                         = useState('')
    const [activeTab, setActiveTab]                 = useState('rapports') // 'rapports' | 'voyages' | 'autorisations'

    // Justificatif groupé
    const [justifPanelOuvert, setJustifPanelOuvert] = useState(null)
    const [justifBeneficiaireId, setJustifBeneficiaireId] = useState('')
    const [justifFichiers, setJustifFichiers]       = useState([])
    const [justifLoading, setJustifLoading]         = useState(false)

    useEffect(() => { fetchAll() }, [])

    const fetchAll = () => {
        setLoading(true)
        Promise.all([
            api.get('/rapports'),
            api.get('/mes-voyages-etudes'),
            api.get('/autorisations-absence'),
        ]).then(([r1, r2, r3]) => {
            setRapports(r1.data)
            setMesVoyages(r2.data)
            setAutorisations(r3.data)
        }).catch(() => {})
          .finally(() => setLoading(false))
    }

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 4000)
    }

    const voirPDF = (rapport) => {
        if (rapport.fichier_pdf)
            window.open(`http://127.0.0.1:8000/storage/${rapport.fichier_pdf}`, '_blank')
    }

    const telechargerPDF = (rapport) => {
        if (rapport.fichier_pdf) {
            const link = document.createElement('a')
            link.href = `http://127.0.0.1:8000/storage/${rapport.fichier_pdf}`
            link.download = `rapport_${rapport.voyage?.destination}_${rapport.id}.pdf`
            link.click()
        }
    }

    const toggleSelectRapport = (id) => {
        setSelectedRapports(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const supprimerRapport = async (rapportId) => {
        setSuppLoading(rapportId)
        try {
            await api.delete(`/rapports/${rapportId}/historique`)
            setRapports(prev => prev.filter(r => r.id !== rapportId))
            setConfirmSupp(null)
            showMsg('Rapport supprimé de l\'historique')
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur lors de la suppression', true)
        } finally {
            setSuppLoading(null)
        }
    }

    const supprimerSelection = async () => {
        for (const id of selectedRapports) {
            try { await api.delete(`/rapports/${id}/historique`) } catch {}
        }
        setRapports(prev => prev.filter(r => !selectedRapports.includes(r.id)))
        setSelectedRapports([])
        showMsg(`${selectedRapports.length} rapport(s) supprimé(s)`)
    }

    const supprimerTousRejetes = async () => {
        const rejetes = rapports.filter(r => r.statut === 'rejete')
        for (const r of rejetes) {
            try { await api.delete(`/rapports/${r.id}/historique`) } catch {}
        }
        setRapports(prev => prev.filter(r => r.statut !== 'rejete'))
        showMsg('Historique des rapports rejetés supprimé')
    }

    const ouvrirPanelJustificatif = (rapportId) => {
        setJustifPanelOuvert(rapportId)
        setJustifBeneficiaireId('')
        setJustifFichiers([])
    }

    const handleFichiersComplementaires = (e) => {
        const nouveaux = Array.from(e.target.files)
        const total = [...justifFichiers, ...nouveaux]
        if (total.length > 4) {
            showMsg('Maximum 4 fichiers complémentaires (le rapport compte comme 1/5)', true)
            return
        }
        setJustifFichiers(total)
    }

    const retirerFichierComplementaire = (index) => {
        setJustifFichiers(prev => prev.filter((_, i) => i !== index))
    }

    const soumettreGroupe = async (rapport) => {
        if (!justifBeneficiaireId) { showMsg('Sélectionnez un voyage', true); return }
        setJustifLoading(true)
        try {
            await api.post(`/voyages-etudes/beneficiaire/${justifBeneficiaireId}/justificatif-rapport`, {
                rapport_id: rapport.id,
            })
            if (justifFichiers.length > 0) {
                const formData = new FormData()
                justifFichiers.forEach(f => formData.append('justificatifs[]', f))
                await api.post(`/voyages-etudes/beneficiaire/${justifBeneficiaireId}/justificatifs`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }
            showMsg('Rapport et justificatifs envoyés avec succès au Chef de Département')
            setJustifPanelOuvert(null)
            setJustifBeneficiaireId('')
            setJustifFichiers([])
            fetchAll()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur lors de l\'envoi', true)
        } finally {
            setJustifLoading(false)
        }
    }

    const voyagesEnAttente = mesVoyages.filter(b =>
        ['en_attente', 'incomplet'].includes(b.statut_justificatif)
    )
    const rapportsRejetes = rapports.filter(r => r.statut === 'rejete')

    // Badges compteurs pour les tabs
    const tabs = [
        { id: 'rapports',       label: 'Mes rapports',       count: rapports.length },
        { id: 'voyages',        label: 'Mes voyages',         count: mesVoyages.length },
        { id: 'autorisations',  label: 'Autorisations',       count: autorisations.length },
    ]

    return (
        <Layout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mon espace</h1>
                        <p className="text-gray-500 text-sm mt-1">Rapports, voyages et autorisations d'absence</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {activeTab === 'rapports' && selectedRapports.length > 0 && (
                            <button onClick={supprimerSelection}
                                className="flex items-center gap-2 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition">
                                <Trash2 size={14} /> Supprimer sélection ({selectedRapports.length})
                            </button>
                        )}
                        {activeTab === 'rapports' && rapportsRejetes.length > 0 && (
                            <button onClick={supprimerTousRejetes}
                                className="flex items-center gap-2 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition">
                                <Trash2 size={14} /> Supprimer rejetés ({rapportsRejetes.length})
                            </button>
                        )}
                        {mesVoyages.length > 0 && (
                            <button onClick={() => setShowChoixVoyage(true)}
                                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition">
                                <Plus size={18} /> Nouveau rapport
                            </button>
                        )}
                    </div>
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

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                activeTab === tab.id
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Modal choix voyage */}
                {showChoixVoyage && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">Choisir un voyage</h3>
                                <button onClick={() => setShowChoixVoyage(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500">Sélectionnez le voyage pour lequel vous voulez soumettre un rapport :</p>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {mesVoyages.map(b => (
                                    <button key={b.id}
                                        onClick={() => navigate(`/enseignant/rapports/nouveau/${b.voyage?.id}`)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition text-left">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <MapPin size={16} className="text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{b.voyage?.destination}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(b.voyage?.date_debut).toLocaleDateString('fr-FR')} — {new Date(b.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ===================== TAB RAPPORTS ===================== */}
                        {activeTab === 'rapports' && (
                            rapports.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun rapport</h3>
                                    <p className="text-gray-400 text-sm">Vos rapports apparaîtront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {rapports.map(rapport => {
                                        const statut = statutConfig[rapport.statut] || statutConfig['soumis']
                                        const Icon   = statut.icon
                                        const isJustifOuvert = justifPanelOuvert === rapport.id

                                        return (
                                            <div key={rapport.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                <div className="p-5 hover:bg-gray-50 transition">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <input type="checkbox"
                                                                checked={selectedRapports.includes(rapport.id)}
                                                                onChange={() => toggleSelectRapport(rapport.id)}
                                                                className="w-4 h-4 rounded border-gray-300 text-red-600 cursor-pointer"
                                                            />
                                                            <div className="bg-blue-100 p-3 rounded-xl cursor-pointer"
                                                                onClick={() => setSelected(selected === rapport.id ? null : rapport.id)}>
                                                                <FileText size={20} className="text-blue-700" />
                                                            </div>
                                                            <div className="cursor-pointer"
                                                                onClick={() => setSelected(selected === rapport.id ? null : rapport.id)}>
                                                                <p className="font-semibold text-gray-800">
                                                                    Rapport — {rapport.voyage?.destination}
                                                                </p>
                                                                <p className="text-sm text-gray-500 mt-0.5">
                                                                    Déposé le {new Date(rapport.date_depot).toLocaleDateString('fr-FR')}
                                                                </p>
                                                                {rapport.fichier_pdf && (
                                                                    <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                                                        <FileText size={12} /> PDF joint
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                                                            <Icon size={12} /> {statut.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {selected === rapport.id && (
                                                    <div className="border-t border-gray-100 p-5 space-y-4">
                                                        {rapport.contenu && (
                                                            <div className="bg-gray-50 rounded-xl p-4">
                                                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Note</p>
                                                                <p className="text-sm text-gray-700 whitespace-pre-line">{rapport.contenu}</p>
                                                            </div>
                                                        )}

                                                        {rapport.fichier_pdf && (
                                                            <div className="flex gap-3">
                                                                <button onClick={() => voirPDF(rapport)}
                                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-200 transition">
                                                                    <Eye size={16} /> Voir le PDF
                                                                </button>
                                                                <button onClick={() => telechargerPDF(rapport)}
                                                                    className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-200 transition">
                                                                    <Download size={16} /> Télécharger
                                                                </button>
                                                            </div>
                                                        )}

                                                        {rapport.statut === 'rejete' && rapport.commentaire_vr && (
                                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                                <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Commentaire du Vice-Recteur</p>
                                                                <p className="text-sm text-red-700">{rapport.commentaire_vr}</p>
                                                            </div>
                                                        )}

                                                        {rapport.statut === 'rejete' && (
                                                            <button
                                                                onClick={() => navigate(`/enseignant/rapports/resoumettre/${rapport.id}`)}
                                                                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                                                                <RefreshCw size={16} /> Re-soumettre le rapport
                                                            </button>
                                                        )}

                                                        {voyagesEnAttente.length > 0 && (
                                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                                                                {!isJustifOuvert ? (
                                                                    <button onClick={() => ouvrirPanelJustificatif(rapport.id)}
                                                                        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                                                                        <Send size={14} /> Envoyer comme justificatif (+ fichiers complémentaires)
                                                                    </button>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                                                            <Send size={14} /> Soumettre rapport + justificatifs
                                                                        </p>
                                                                        <select
                                                                            value={justifBeneficiaireId}
                                                                            onChange={e => setJustifBeneficiaireId(e.target.value)}
                                                                            className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                                                                            <option value="">Sélectionnez un voyage...</option>
                                                                            {voyagesEnAttente.map(b => (
                                                                                <option key={b.id} value={b.id}>
                                                                                    {b.voyage?.destination} — {new Date(b.voyage?.date_debut).toLocaleDateString('fr-FR')}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-green-200">
                                                                            <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                                                                            <span className="text-xs text-gray-700">Ce rapport sera inclus comme justificatif</span>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                Ajouter d'autres justificatifs (optionnel, max 4 fichiers PDF)
                                                                            </label>
                                                                            <input type="file" accept=".pdf" multiple
                                                                                onChange={handleFichiersComplementaires}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white" />
                                                                            {justifFichiers.length > 0 && (
                                                                                <div className="space-y-1 mt-2">
                                                                                    {justifFichiers.map((f, i) => (
                                                                                        <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-2 py-1.5 border border-gray-200">
                                                                                            <span className="flex items-center gap-1.5 text-gray-700 truncate">
                                                                                                <FileText size={12} /> {f.name}
                                                                                            </span>
                                                                                            <button onClick={() => retirerFichierComplementaire(i)} className="text-gray-400 hover:text-red-500">
                                                                                                <X size={12} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => soumettreGroupe(rapport)}
                                                                                disabled={justifLoading || !justifBeneficiaireId}
                                                                                className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                                {justifLoading
                                                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                                    : <Send size={14} />}
                                                                                Envoyer tout
                                                                            </button>
                                                                            <button onClick={() => setJustifPanelOuvert(null)}
                                                                                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition">
                                                                                Annuler
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {confirmSupp === rapport.id ? (
                                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                                                <p className="text-sm text-red-700 font-medium">Confirmer la suppression de ce rapport ?</p>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => supprimerRapport(rapport.id)}
                                                                        disabled={suppLoading === rapport.id}
                                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                                        {suppLoading === rapport.id
                                                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                                                            : 'Confirmer'}
                                                                    </button>
                                                                    <button onClick={() => setConfirmSupp(null)}
                                                                        className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                                                        Annuler
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => setConfirmSupp(rapport.id)}
                                                                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition">
                                                                <Trash2 size={14} /> Supprimer de l'historique
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}

                        {/* ===================== TAB VOYAGES ===================== */}
                        {activeTab === 'voyages' && (
                            mesVoyages.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapPin size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun voyage</h3>
                                    <p className="text-gray-400 text-sm">Vous n'avez pas encore de voyage d'études</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {mesVoyages.map(b => {
                                        const statutJustif = {
                                            en_attente:   { label: 'En attente',        color: 'bg-gray-100 text-gray-600' },
                                            soumis:       { label: 'Justificatifs soumis', color: 'bg-blue-100 text-blue-700' },
                                            transmis_vr:  { label: 'Transmis au VR',    color: 'bg-orange-100 text-orange-700' },
                                            valide:       { label: 'Validé',            color: 'bg-green-100 text-green-700' },
                                            incomplet:    { label: 'Incomplet',          color: 'bg-red-100 text-red-700' },
                                        }[b.statut_justificatif] || { label: b.statut_justificatif, color: 'bg-gray-100 text-gray-600' }

                                        const statutAutorisation = autorisationStatutConfig[b.statut_autorisation]

                                        return (
                                            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-3 rounded-xl">
                                                            <MapPin size={20} className="text-blue-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{b.voyage?.destination}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(b.voyage?.date_debut).toLocaleDateString('fr-FR')} — {new Date(b.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statutJustif.color}`}>
                                                        {statutJustif.label}
                                                    </span>
                                                </div>

                                                {/* Statut liste définitive */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {b.dans_liste_definitive && (
                                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                            <CheckCircle size={11} /> Liste définitive
                                                        </span>
                                                    )}
                                                    {b.voyage?.arrete_recteur && (
                                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                                                            <ShieldCheck size={11} /> Arrêté signé
                                                        </span>
                                                    )}
                                                    {statutAutorisation && (
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statutAutorisation.color}`}>
                                                            Autorisation : {statutAutorisation.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}

                        {/* ===================== TAB AUTORISATIONS ===================== */}
                        {activeTab === 'autorisations' && (
                            autorisations.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune autorisation</h3>
                                    <p className="text-gray-400 text-sm">Vos autorisations d'absence apparaîtront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {autorisations.map(a => {
                                        const cfg = autorisationStatutConfig[a.statut] || { label: 'En attente', color: 'bg-gray-100 text-gray-600' }
                                        return (
                                            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-100 p-3 rounded-xl">
                                                            <ShieldCheck size={20} className="text-purple-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">
                                                                Autorisation — {a.beneficiaire?.voyage?.destination ?? a.voyage?.destination ?? '—'}
                                                            </p>
                                                            {(a.date_debut || a.beneficiaire?.voyage?.date_debut) && (
                                                                <p className="text-sm text-gray-500 mt-0.5">
                                                                    Du {new Date(a.date_debut ?? a.beneficiaire?.voyage?.date_debut).toLocaleDateString('fr-FR')}
                                                                    {' '}au {new Date(a.date_fin ?? a.beneficiaire?.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                Créée le {new Date(a.created_at).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                {/* Avis chef département */}
                                                {a.avis_chef_departement && (
                                                    <div className="mt-3 bg-gray-50 rounded-xl p-3">
                                                        <p className="text-xs font-semibold text-gray-500 mb-1">Avis Chef de Département</p>
                                                        <p className="text-sm text-gray-700">{a.avis_chef_departement}</p>
                                                    </div>
                                                )}

                                                {/* Avis directeur UFR */}
                                                {a.avis_directeur_ufr && (
                                                    <div className="mt-3 bg-gray-50 rounded-xl p-3">
                                                        <p className="text-xs font-semibold text-gray-500 mb-1">Avis Directeur UFR</p>
                                                        <p className="text-sm text-gray-700">{a.avis_directeur_ufr}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}