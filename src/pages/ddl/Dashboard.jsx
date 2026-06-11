import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Bus, MapPin, FileText, Clock, XCircle } from 'lucide-react'

export default function DDLDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        demandesNavette: 0,
        voyagesEtudes: 0,
        enAttente: 0,
        rejetees: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/notifications/sidebar')
                setStats({
                    demandesNavette: (res.data.mesDemandes || 0) + (res.data.mesDemandesRejetees || 0),
                    voyagesEtudes: 0,
                    enAttente: res.data.mesDemandes || 0,
                    rejetees: res.data.mesDemandesRejetees || 0,
                })
            } catch (error) {
                console.error('Erreur stats:', error)
            }
        }

        fetchStats()
    }, [])

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Bonjour, {user?.prenom} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Bienvenue sur votre espace UADB Mobilité
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Demandes navette - clickeable */}
                    <div 
                        onClick={() => navigate('/ddl/navettes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-blue-100 p-2 rounded-xl">
                                <Bus size={20} className="text-blue-700" />
                            </div>
                            <span className="text-xs text-gray-400">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.demandesNavette}</p>
                        <p className="text-sm text-gray-500 mt-1">Demandes navette</p>
                    </div>

                    {/* Voyages d'études - clickeable */}
                    <div 
                        onClick={() => navigate('/ddl/voyages')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-green-100 p-2 rounded-xl">
                                <MapPin size={20} className="text-green-700" />
                            </div>
                            <span className="text-xs text-gray-400">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyagesEtudes}</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages d'études</p>
                    </div>

                    {/* En attente - clickeable */}
                    <div 
                        onClick={() => navigate('/ddl/en-attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <Clock size={20} className="text-orange-700" />
                            </div>
                            <span className="text-xs text-gray-400">En cours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>

                    {/* Demandes rejetées - clickeable */}
                    <div 
                        onClick={() => navigate('/ddl/demandes-rejetees')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-red-100 p-2 rounded-xl">
                                <XCircle size={20} className="text-red-700" />
                            </div>
                            <span className="text-xs text-gray-400">Refusées</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.rejetees}</p>
                        <p className="text-sm text-gray-500 mt-1">Demandes rejetées</p>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="/ddl/navettes/nouvelle" className="flex items-center gap-4 p-4 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group">
                            <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition">
                                <Bus size={22} className="text-blue-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Demander une navette</p>
                                <p className="text-sm text-gray-500">Soumettre un ordre de mission</p>
                            </div>
                        </a>

                        <a href="/ddl/voyages/nouveau" className="flex items-center gap-4 p-4 border-2 border-dashed border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group">
                            <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition">
                                <MapPin size={22} className="text-green-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Voyage d'études</p>
                                <p className="text-sm text-gray-500">Soumettre une demande</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Dernières demandes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes dernières demandes</h2>
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <FileText size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">Aucune demande pour le moment</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}