import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { MapPin, FileText, CheckCircle, Clock } from 'lucide-react'

export default function ViceRecteurDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        voyagesEnAttente: 0,
        voyagesApprouves: 0,
        rapportsAValider: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/notifications/sidebar')
                setStats({
                    voyagesEnAttente: res.data.voyagesEnAttente || 0,
                    voyagesApprouves: res.data.voyagesApprouves || 0,
                    rapportsAValider: res.data.rapportsAValider || 0,
                })
            } catch (error) {
                console.error('Erreur stats Vice-Recteur:', error)
            }
        }

        fetchStats()
    }, [])

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Vice-Recteur</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des voyages d'études</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card Voyages en attente */}
                    <div 
                        onClick={() => navigate('/vice-recteur/voyages?statut=en_attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyagesEnAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages en attente</p>
                    </div>

                    {/* Card Voyages approuvés */}
                    <div 
                        onClick={() => navigate('/vice-recteur/voyages?statut=approuves')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyagesApprouves}</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages approuvés</p>
                    </div>

                    {/* Card Rapports à valider */}
                    <div 
                        onClick={() => navigate('/vice-recteur/rapports-a-valider')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <FileText size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.rapportsAValider}</p>
                        <p className="text-sm text-gray-500 mt-1">Rapports à valider</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Voyages en attente</h2>
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <MapPin size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">Aucun voyage en attente</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}