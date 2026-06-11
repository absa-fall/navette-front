import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DemandesEnAttente() {
    const navigate = useNavigate()
    const [demandes, setDemandes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDemandes = async () => {
            try {
                const res = await api.get('/ordres-mission?statut=en_attente_drh')
                setDemandes(res.data)
            } catch (error) {
                console.error('Erreur:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDemandes()
    }, [])

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/ddl/dashboard')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Demandes en attente</h1>
                        <p className="text-gray-500 text-sm">En attente d'approbation par le DRH</p>
                    </div>
                </div>

                {loading ? (
                    <p>Chargement...</p>
                ) : demandes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucune demande en attente</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {demandes.map((demande) => (
                            <div key={demande.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {demande.destination} - {demande.objet_mission}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Date départ : {demande.date_depart}
                                        </p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                                        En attente
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}