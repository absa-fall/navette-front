import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Plus, Users, CheckCircle, Clock, ChevronDown, ChevronUp, Check, X } from 'lucide-react'

const statutConfig = {
    publiee: { label: 'Liste publiee', color: 'bg-orange-100 text-orange-700' },
    definitive: { label: 'Liste definitive', color: 'bg-green-100 text-green-700' },
    brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
}

export default function VoyagesEtudes() {
    const navigate = useNavigate()
    const [voyages, setVoyages] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)
    const [selectedDefinitifs, setSelectedDefinitifs] = useState({})
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetchVoyages()
    }, [])

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

    const toggleExpand = (id) => {
        setExpanded(expanded === id ? null : id)
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
        if (selected.length === 0) {
            setMessage('Selectionnez au moins un beneficiaire')
            return
        }
        setActionLoading(voyageId)
        try {
            await api.post(`/voyages-etudes/${voyageId}/liste-definitive`, {
                beneficiaires: selected
            })
            setMessage('Liste definitive publiee avec succes')
            fetchVoyages()
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
            setTimeout(() => setMessage(''), 3000)
        }
    }

    const approuverAutorisation = async (beneficiaireId) => {
        setActionLoading(beneficiaireId)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/approuver-autorisation`)
            setMessage('Autorisation approuvee')
            fetchVoyages()
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
            setTimeout(() => setMessage(''), 3000)
        }
    }

    const getStatutAutorisationLabel = (statut) => {
        switch (statut) {
            case 'non_demande': return { label: 'Non demande', color: 'bg-gray-100 text-gray-600' }
            case 'demande_chef_dept': return { label: 'Demande au chef dept', color: 'bg-yellow-100 text-yellow-700' }
            case 'autorisation_sortie_chef': return { label: 'Autorisation sortie', color: 'bg-orange-100 text-orange-700' }
            case 'envoye_directeur_ufr': return { label: 'Envoye directeur UFR', color: 'bg-blue-100 text-blue-700' }
            case 'envoye_vr': return { label: 'En attente VR', color: 'bg-purple-100 text-purple-700' }
            case 'approuve': return { label: 'Approuve', color: 'bg-green-100 text-green-700' }
            default: return { label: statut, color: 'bg-gray-100 text-gray-600' }
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Voyages d'etudes</h1>
                        <p className="text-gray-500 text-sm mt-1">{voyages.length} voyage(s)</p>
                    </div>
                    <button
                        onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition">
                        <Plus size={18} />
                        Nouvelle liste
                    </button>
                </div>

                {message && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : voyages.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun voyage</h3>
                        <p className="text-gray-400 text-sm mb-5">Publiez votre premiere liste de beneficiaires</p>
                        <button
                            onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
                            Publier une liste
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {voyages.map(voyage => {
                            const statut = statutConfig[voyage.statut_liste] || statutConfig['brouillon']
                            const isExpanded = expanded === voyage.id
                            const selected = selectedDefinitifs[voyage.id] || []

                            return (
                                <div key={voyage.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Header voyage */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => toggleExpand(voyage.id)}
                                    >
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
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Users size={12} className="text-gray-400" />
                                                        <span className="text-xs text-gray-500">{voyage.beneficiaires?.length || 0} beneficiaire(s)</span>
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

                                    {/* Détails bénéficiaires */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-5 space-y-4">
                                            {voyage.description && (
                                                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{voyage.description}</p>
                                            )}

                                            <h3 className="font-semibold text-gray-700 text-sm">Beneficiaires :</h3>

                                            <div className="space-y-2">
                                                {voyage.beneficiaires?.map(b => {
                                                    const autorisationStatut = getStatutAutorisationLabel(b.statut_autorisation)
                                                    return (
                                                        <div key={b.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                                                            voyage.statut_liste === 'publiee' && selected.includes(b.id)
                                                                ? 'bg-blue-50 border-blue-200'
                                                                : b.dans_liste_definitive
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : 'bg-gray-50 border-gray-100'
                                                        }`}>
                                                            <div className="flex items-center gap-3">
                                                                {/* Checkbox pour liste définitive */}
                                                                {voyage.statut_liste === 'publiee' && (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected.includes(b.id)}
                                                                        onChange={() => toggleDefinitif(voyage.id, b.id)}
                                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                                        onClick={e => e.stopPropagation()}
                                                                    />
                                                                )}
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                                    {b.enseignant?.prenom?.[0]}{b.enseignant?.nom?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        {b.enseignant?.prenom} {b.enseignant?.nom}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{b.enseignant?.ufr}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {/* Statut justificatif */}
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                    b.statut_justificatif === 'valide' ? 'bg-green-100 text-green-700' :
                                                                    b.statut_justificatif === 'soumis' ? 'bg-blue-100 text-blue-700' :
                                                                    b.statut_justificatif === 'incomplet' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {b.statut_justificatif}
                                                                </span>

                                                                {/* Statut autorisation */}
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${autorisationStatut.color}`}>
                                                                    {autorisationStatut.label}
                                                                </span>

                                                                {/* Bouton approuver autorisation */}
                                                                {b.statut_autorisation === 'envoye_vr' && (
                                                                    <button
                                                                        onClick={() => approuverAutorisation(b.id)}
                                                                        disabled={actionLoading === b.id}
                                                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-semibold transition disabled:opacity-50"
                                                                    >
                                                                        {actionLoading === b.id
                                                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                            : 'Approuver'
                                                                        }
                                                                    </button>
                                                                )}

                                                                {b.dans_liste_definitive && (
                                                                    <CheckCircle size={16} className="text-green-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Bouton publier liste définitive */}
                                            {voyage.statut_liste === 'publiee' && (
                                                <button
                                                    onClick={() => publierListeDefinitive(voyage.id)}
                                                    disabled={actionLoading === voyage.id || selected.length === 0}
                                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === voyage.id
                                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        : <Check size={16} />
                                                    }
                                                    Publier liste definitive ({selected.length} selectionne(s))
                                                </button>
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