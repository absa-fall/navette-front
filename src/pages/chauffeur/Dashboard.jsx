import Layout from '../../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Bus, ClipboardList, CheckCircle, Clock } from 'lucide-react'

export default function ChauffeurDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        trajetsAssignes: 0,
        enAttente: 0,
        trajetsEffectues: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/notifications/sidebar')
                setStats({
                    trajetsAssignes: res.data.trajetsAssignes || 0,
                    enAttente: res.data.enAttente || 0,
                    trajetsEffectues: res.data.trajetsEffectues || 0,
                })
            } catch (error) {
                console.error('Erreur stats chauffeur:', error)
            }
        }

        fetchStats()
    }, [])

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Chauffeur</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion de vos trajets</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card Trajets assignés */}
                    <div 
                        onClick={() => navigate('/chauffeur/trajets?statut=assignes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <Bus size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.trajetsAssignes}</p>
                        <p className="text-sm text-gray-500 mt-1">Trajets assignés</p>
                    </div>

                    {/* Card En attente */}
                    <div 
                        onClick={() => navigate('/chauffeur/trajets?statut=en_attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>

                    {/* Card Trajets effectués */}
                    <div 
                        onClick={() => navigate('/chauffeur/trajets?statut=effectues')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.trajetsEffectues}</p>
                        <p className="text-sm text-gray-500 mt-1">Trajets effectués</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Réservations</h2>
                    <p className="text-gray-500 text-sm mb-4">Voir et valider les réservations des passagers</p>
                    <button
                        onClick={() => navigate('/chauffeur/reservations')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                    >
                        <ClipboardList size={18} />
                        Voir les réservations
                    </button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes trajets du jour</h2>
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <ClipboardList size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">Aucun trajet assigné aujourd'hui</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}