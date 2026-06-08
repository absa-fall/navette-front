import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const statutConfig = {
    en_attente: { label: 'En attente VR', color: 'bg-orange-100 text-orange-700', icon: Clock },
    approuve: { label: 'Approuvé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function EnseignantMesVoyages() {
    const navigate = useNavigate()
    const [voyages, setVoyages] = useState([])
    const [eligibilite, setEligibilite] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/voyages'),
            api.get('/voyages/eligibilite')
        ]).then(([voyagesRes, eligRes]) => {
            setVoyages(voyagesRes.data)
            setEligibilite(eligRes.data)
        }).catch(() => {})
        .finally(() => setLoading(false))
    }, [])

    return (
        <Layout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mes voyages d'études</h1>
                        <p className="text-gray-500 text-sm mt-1">{voyages.length} voyage(s)</p>
                    </div>
                    {eligibilite?.eligible && (
                        <button
                            onClick={() => navigate('/enseignant/voyages/nouveau')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl transition"
                        >
                            <Plus size={18} />
                            Nouveau voyage
                        </button>
                    )}
                </div>

                {/* Bandeau éligibilité */}
                {eligibilite && !eligibilite.eligible && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle size={20} className="text-orange-600 flex-shrink-0" />
                        <p className="text-sm text-orange-700">{eligibilite.message}</p>
                    </div>
                )}

                {eligibilite?.eligible && voyages.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700">Vous êtes éligible pour soumettre une demande.</p>
                    </div>
                )}

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : voyages.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun voyage</h3>
                        <p className="text-gray-400 text-sm mb-5">Vous n'avez pas encore soumis de demande</p>
                        {eligibilite?.eligible && (
                            <button
                                onClick={() => navigate('/enseignant/voyages/nouveau')}
                                className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                            >
                                Soumettre une demande
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {voyages.map(voyage => {
                            const statut = statutConfig[voyage.statut] || statutConfig['en_attente']
                            const Icon = statut.icon
                            return (
                                <div key={voyage.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-green-100 p-3 rounded-xl">
                                                <MapPin size={20} className="text-green-700" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{voyage.destination}</p>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    Du {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{voyage.objet}</p>
                                            </div>
                                        </div>
                                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                                            <Icon size={12} />
                                            {statut.label}
                                        </span>
                                    </div>

                                    {/* Commentaire rejet */}
                                    {voyage.statut === 'rejete' && voyage.commentaire_vr && (
                                        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                                            <p className="text-xs text-red-600">{voyage.commentaire_vr}</p>
                                        </div>
                                    )}

                                    {/* Rapport manquant */}
                                    {voyage.statut === 'approuve' && !voyage.rapport && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-orange-600">
                                                <AlertTriangle size={14} />
                                                <span className="text-xs font-medium">Rapport à soumettre</span>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/enseignant/rapports/nouveau/${voyage.id}`)}
                                                className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-200 transition"
                                            >
                                                Soumettre rapport
                                            </button>
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