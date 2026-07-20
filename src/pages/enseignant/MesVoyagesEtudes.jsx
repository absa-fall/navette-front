import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, FileText, CheckCircle, Clock, AlertCircle, Lock, Eye, Trash2, Search, PenLine } from 'lucide-react'

const statutJustifConfig = {
    en_attente:  { label: 'En attente',      color: 'bg-gray-100 text-gray-600' },
    soumis:      { label: 'Soumis au VR/Commission',  color: 'bg-blue-100 text-blue-700' },
    transmis_vr: { label: 'Transmis au VR',  color: 'bg-purple-100 text-purple-700' },
    valide:      { label: 'Valide',           color: 'bg-green-100 text-green-700' },
    incomplet:   { label: 'Incomplet',        color: 'bg-red-100 text-red-700' },
}

const statutAutorisationConfig = {
    non_demande:          { label: 'Non demande',          color: 'bg-gray-100 text-gray-600' },
    demande_chef_dept:    { label: 'En attente chef dept', color: 'bg-yellow-100 text-yellow-700' },
    envoye_directeur_ufr: { label: 'Chez directeur UFR',  color: 'bg-blue-100 text-blue-700' },
    envoye_recteur:       { label: 'Chez le Recteur',      color: 'bg-indigo-100 text-indigo-700' },
    approuve_recteur:     { label: 'Approuve par Recteur', color: 'bg-green-100 text-green-700' },
}

export default function MesVoyagesEtudes() {
    const navigate = useNavigate()
    const location = useLocation()
    const [beneficiaires, setBeneficiaires] = useState([])
    const [loading, setLoading]             = useState(true)
    const [expanded, setExpanded]           = useState(null)
    const [message, setMessage]             = useState('')
    const [error, setError]                 = useState('')
    const [selected, setSelected]           = useState([])
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [searchQuery, setSearchQuery]     = useState('')

    useEffect(() => { fetchVoyages() },[location.key])
    const fetchVoyages = async () => {
        try {
            const res = await api.get('/mes-voyages-etudes')
            setBeneficiaires(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 4000)
    }

    // Le rapport est considere pret des qu'il a ete soumis (le VR peut ensuite le valider ou le rejeter).
    const rapportEstFinalise = (b) => ['soumis', 'valide'].includes(b.rapport?.statut)
    const rapportEstRejete = (b) => b.rapport?.statut === 'rejete'

    const demanderAutorisation = async (beneficiaireId) => {
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/demander-autorisation`)
            showMsg('Demande d\'autorisation envoyee au Chef de Departement')
            fetchVoyages()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        if (selected.length === beneficiairesAffiches.length) setSelected([])
        else setSelected(beneficiairesAffiches.map(b => b.id))
    }

    const supprimerSelection = async (ids) => {
        if (!confirm(`Retirer ${ids.length} voyage(s) de votre liste ?`)) return
        setDeleteLoading(true)
        try {
            await Promise.all(ids.map(id => api.patch(`/voyages-etudes/beneficiaire/${id}/masquer`)))
            setBeneficiaires(prev => prev.filter(b => !ids.includes(b.id)))
            setSelected([])
            showMsg('Voyage(s) retire(s) de votre liste')
        } catch (err) {
            showMsg('Erreur lors de la suppression', true)
        } finally {
            setDeleteLoading(false)
        }
    }

    // Rapport ET justificatifs se gèrent désormais sur une seule page dédiée.
    // beneficiaireId est transmis en query param car l'upload des justificatifs en a besoin.
    const allerAuRapport = (b) => {
        navigate(`/enseignant/voyages-etudes/${b.voyage?.id}/rapport?beneficiaireId=${b.id}`)
    }

    const beneficiairesAffiches = beneficiaires.filter(b =>
        searchQuery === '' ||
        b.voyage?.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.voyage?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.autorisation_absence?.numero?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mes voyages d'etudes</h1>
                    <p className="text-gray-500 text-sm mt-1">{beneficiairesAffiches.length} voyage(s)</p>
                </div>

                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par année..."
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
                ) : beneficiaires.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun voyage</h3>
                        <p className="text-gray-400 text-sm">Vous n'avez pas encore ete selectionne pour un voyage d'etudes</p>
                    </div>
                ) : beneficiairesAffiches.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Search size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun resultat</h3>
                        <p className="text-gray-400 text-sm">Aucun voyage ne correspond a votre recherche</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox"
                                    checked={selected.length === beneficiairesAffiches.length && beneficiairesAffiches.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                {selected.length > 0 ? `${selected.length} selectionne(s)` : 'Tout selectionner'}
                            </label>
                            <div className="flex gap-2">
                                {selected.length > 0 && (
                                    <button onClick={() => supprimerSelection(selected)} disabled={deleteLoading}
                                        className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                                        {deleteLoading
                                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                            : <Trash2 size={13} />}
                                        Supprimer ({selected.length})
                                    </button>
                                )}
                            </div>
                        </div>
                        {beneficiairesAffiches.map(b => {
                            const justif = statutJustifConfig[b.statut_justificatif] || statutJustifConfig['en_attente']
                            const getStatutAutorisationAffiche = (b) => {
                                const auto = b.autorisation_absence
                                if (!auto) return statutAutorisationConfig['non_demande']
                                if (auto.statut === 'rejetee') return { label: 'Rejetee', color: 'bg-red-100 text-red-700' }
                                if (auto.statut === 'transmise') return { label: 'Approuve - Transmise', color: 'bg-green-100 text-green-700' }
                                if (auto.statut === 'signee_recteur') return { label: 'Signee, en cours de transmission', color: 'bg-green-100 text-green-700' }
                                if (auto.statut === 'avis_directeur_ufr') return { label: 'Chez le Recteur', color: 'bg-indigo-100 text-indigo-700' }
                                if (auto.statut === 'avis_chef_departement') return { label: 'Chez le Directeur UFR', color: 'bg-blue-100 text-blue-700' }
                                if (auto.statut === 'soumise') return { label: 'En attente chef dept', color: 'bg-yellow-100 text-yellow-700' }
                                return statutAutorisationConfig['non_demande']
                            }

                            const autorisation = getStatutAutorisationAffiche(b)
                            const isExpanded = expanded === b.id
                            const rapportOk = rapportEstFinalise(b)
                            const arreteSigné = b.voyage?.arrete_recteur
                            const peutDemanderAutorisation =
                                b.dans_liste_definitive &&
                                arreteSigné &&
                                (!b.statut_autorisation || b.statut_autorisation === 'non_demande')

                            return (
                                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => setExpanded(isExpanded ? null : b.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <input type="checkbox" checked={selected.includes(b.id)}
                                                    onChange={(e) => { e.stopPropagation(); toggleSelect(b.id) }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                                <div className="bg-blue-100 p-3 rounded-xl">
                                                    <MapPin size={20} className="text-blue-700" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{b.voyage?.destination}</p>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        Du {new Date(b.voyage?.date_debut).toLocaleDateString('fr-FR')} au {new Date(b.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${justif.color}`}>
                                                    {justif.label}
                                                </span>
                                                {b.dans_liste_definitive && (
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                        <CheckCircle size={10} /> Liste definitive
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-5 space-y-4">
                                            {b.voyage?.description && (
                                                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{b.voyage.description}</p>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Autorisation :</span>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${autorisation.color}`}>
                                                    {autorisation.label}
                                                </span>
                                            </div>

                                            {b.dans_liste_definitive && (
                                                <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                                                    arreteSigné
                                                        ? 'bg-green-50 border border-green-200 text-green-700'
                                                        : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                                                }`}>
                                                    {arreteSigné ? <CheckCircle size={16} /> : <Clock size={16} />}
                                                    {arreteSigné
                                                        ? 'L\'arrete a ete signe par le Recteur'
                                                        : 'En attente de la signature de l\'arrete par le Recteur'
                                                    }
                                                </div>
                                            )}

                                            {/* Rapport + justificatifs : tout se passe maintenant sur une seule page */}
                                            <div className="space-y-2">
                                                {rapportOk ? (
                                                    <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                                                        <span className="flex items-center gap-2 text-green-700">
                                                            <CheckCircle size={14} />
                                                            {b.rapport?.statut === 'valide' ? 'Rapport validé' : 'Rapport soumis, en attente du VR'}
                                                        </span>
                                                        <button
                                                            onClick={() => allerAuRapport(b)}
                                                            className="text-blue-700 hover:underline text-xs font-semibold"
                                                        >
                                                            Gérer mon dossier
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => allerAuRapport(b)}
                                                        className={`w-full flex items-center justify-center gap-2 border py-2 rounded-xl text-sm font-semibold transition ${
                                                            rapportEstRejete(b)
                                                                ? 'border-red-300 text-red-700 hover:bg-red-50'
                                                                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <PenLine size={15} />
                                                        {rapportEstRejete(b) ? 'Rapport rejeté — re-soumettre' : 'Rédiger mon rapport et justificatifs'}
                                                    </button>
                                                )}
                                            </div>

                                            {peutDemanderAutorisation && (
                                                <button
                                                    onClick={() => navigate(`/enseignant/autorisation-absence/${b.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                                                >
                                                    <FileText size={16} />
                                                    Demander autorisation d'absence
                                                </button>
                                            )}

                                            {b.autorisation_absence && !['transmise', 'rejetee'].includes(b.autorisation_absence.statut) && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                                                    <Clock size={20} className="text-blue-600" />
                                                    <p className="text-sm text-blue-700">
                                                        Votre demande d'autorisation est en cours de traitement.
                                                    </p>
                                                </div>
                                            )}

                                            {b.autorisation_absence?.statut === 'transmise' && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                                    <CheckCircle size={20} className="text-green-600" />
                                                    <p className="text-sm text-green-700 font-medium">
                                                        Votre autorisation de sortie a ete approuvee et transmise !
                                                    </p>
                                                </div>
                                            )}

                                            {b.autorisation_absence && (
                                                <button
                                                    onClick={() => navigate(`/autorisation-absence/${b.autorisation_absence.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition"
                                                >
                                                    <Eye size={16} />
                                                    Voir l'autorisation d'absence ({b.autorisation_absence.numero})
                                                </button>
                                            )}

                                            {b.dans_liste_definitive && b.voyage?.arrete_recteur && (
                                                <button
                                                    onClick={() => navigate(`/voyages-etudes/${b.voyage.id}/arrete`)}
                                                    className="w-full flex items-center justify-center gap-2 border border-green-600 text-green-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition"
                                                >
                                                    <Eye size={16} />
                                                    Voir l'arrêté de voyage
                                                </button>
                                            )}

                                            {b.dans_liste_definitive && !arreteSigné && b.statut_justificatif === 'valide' && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                                                    <Lock size={16} className="text-gray-400" />
                                                    <p className="text-sm text-gray-500">
                                                        La demande d'autorisation sera disponible apres la signature de l'arrete par le Recteur.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}