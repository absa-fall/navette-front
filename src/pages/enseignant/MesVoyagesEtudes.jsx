import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, FileText, Upload, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react'

const statutJustificatifConfig = {
    en_attente: { label: 'En attente', color: 'bg-gray-100 text-gray-600' },
    soumis: { label: 'Soumis', color: 'bg-blue-100 text-blue-700' },
    valide: { label: 'Valide', color: 'bg-green-100 text-green-700' },
    incomplet: { label: 'Incomplet', color: 'bg-red-100 text-red-700' },
}

const statutAutorisationConfig = {
    non_demande: { label: 'Non demande', color: 'bg-gray-100 text-gray-600' },
    demande_chef_dept: { label: 'Demande au chef dept', color: 'bg-yellow-100 text-yellow-700' },
    autorisation_sortie_chef: { label: 'Autorisation sortie chef', color: 'bg-orange-100 text-orange-700' },
    envoye_directeur_ufr: { label: 'Envoye directeur UFR', color: 'bg-blue-100 text-blue-700' },
    envoye_vr: { label: 'Envoye VR', color: 'bg-purple-100 text-purple-700' },
    approuve: { label: 'Approuve', color: 'bg-green-100 text-green-700' },
}

export default function MesVoyagesEtudes() {
    const navigate = useNavigate()
    const [beneficiaires, setBeneficiaires] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)
    const [fichier, setFichier] = useState(null)
    const [uploadLoading, setUploadLoading] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetchVoyages()
    }, [])

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
        setTimeout(() => { setMessage(''); setError('') }, 3000)
    }

    const soumettreJustificatifs = async (beneficiaireId) => {
        if (!fichier) {
            showMsg('Veuillez selectionner un fichier PDF', true)
            return
        }
        setUploadLoading(beneficiaireId)
        try {
            const formData = new FormData()
            formData.append('justificatif_pdf', fichier)
            await api.post(`/voyages-etudes/${beneficiaireId}/justificatifs`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            showMsg('Justificatifs soumis avec succes')
            setFichier(null)
            fetchVoyages()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setUploadLoading(null)
        }
    }

    const demanderAutorisation = async (beneficiaireId) => {
        setActionLoading(beneficiaireId)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/demander-autorisation`)
            showMsg('Demande envoyee au Chef de Departement')
            fetchVoyages()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mes voyages d'etudes</h1>
                    <p className="text-gray-500 text-sm mt-1">{beneficiaires.length} voyage(s)</p>
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
                ) : (
                    <div className="space-y-4">
                        {beneficiaires.map(b => {
                            const justif = statutJustificatifConfig[b.statut_justificatif] || statutJustificatifConfig['en_attente']
                            const autorisation = statutAutorisationConfig[b.statut_autorisation] || statutAutorisationConfig['non_demande']
                            const isExpanded = expanded === b.id

                            return (
                                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Header */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => setExpanded(isExpanded ? null : b.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
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
                                                    Justif: {justif.label}
                                                </span>
                                                {b.dans_liste_definitive && (
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                                                        Liste definitive
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Détails */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-5 space-y-4">
                                            {/* Description voyage */}
                                            {b.voyage?.description && (
                                                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{b.voyage.description}</p>
                                            )}

                                            {/* Statut autorisation */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Autorisation :</span>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${autorisation.color}`}>
                                                    {autorisation.label}
                                                </span>
                                            </div>

                                            {/* Soumettre justificatifs */}
                                            {b.statut_justificatif === 'en_attente' || b.statut_justificatif === 'incomplet' ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-medium text-gray-700">Soumettre vos justificatifs (PDF) :</p>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={e => setFichier(e.target.files[0])}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => soumettreJustificatifs(b.id)}
                                                        disabled={uploadLoading === b.id || !fichier}
                                                        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                                                    >
                                                        {uploadLoading === b.id
                                                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            : <Upload size={16} />
                                                        }
                                                        Soumettre les justificatifs
                                                    </button>
                                                </div>
                                            ) : null}

                                            {/* Demander autorisation absence */}
                                            {b.dans_liste_definitive && b.statut_autorisation === 'non_demande' && (
                                                <button
                                                    onClick={() => demanderAutorisation(b.id)}
                                                    disabled={actionLoading === b.id}
                                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                                                >
                                                    {actionLoading === b.id
                                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        : <FileText size={16} />
                                                    }
                                                    Demander autorisation d'absence
                                                </button>
                                            )}

                                            {/* Autorisation approuvee */}
                                            {b.statut_autorisation === 'approuve' && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                                    <CheckCircle size={20} className="text-green-600" />
                                                    <p className="text-sm text-green-700 font-medium">
                                                        Votre autorisation de sortie a ete approuvee !
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