import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function DRHDashboard() {
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        enAttente: 0,
        approuves: 0,
        rejetes: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/notifications/sidebar')

                setStats({
                    enAttente: res.data.drhOrdres || 0,
                    approuves: res.data.drhOrdresApprouves || 0,
                    rejetes: res.data.drhOrdresRejetes || 0,
                })
            } catch (error) {
                console.error('Erreur stats DRH:', error)
            }
        }

        fetchStats()

        const interval = setInterval(fetchStats, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <Layout>
            <div className="space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Dashboard DRH
                    </h1>

                    <p className="text-gray-500 text-sm mt-1">
                        Gestion des ordres de mission
                    </p>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    {/* En attente */}
                    <div
                        onClick={() => navigate('/drh/ordres?statut=en_attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <Clock size={20} className="text-orange-700" />
                            </div>
                        </div>

                        <p className="text-2xl font-bold text-gray-800">
                            {stats.enAttente}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            En attente d'approbation
                        </p>
                    </div>

                    {/* Approuvés */}
                    <div
                        onClick={() => navigate('/drh/ordres?statut=approuve')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-green-100 p-2 rounded-xl">
                                <CheckCircle size={20} className="text-green-700" />
                            </div>
                        </div>

                        <p className="text-2xl font-bold text-gray-800">
                            {stats.approuves}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Approuvés
                        </p>
                    </div>

                    {/* Rejetés */}
                    <div
                        onClick={() => navigate('/drh/ordres?statut=rejete')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-red-100 p-2 rounded-xl">
                                <XCircle size={20} className="text-red-700" />
                            </div>
                        </div>

                        <p className="text-2xl font-bold text-gray-800">
                            {stats.rejetes}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Rejetés
                        </p>
                    </div>
                </div>

                {/* Grande carte */}
                <div
                    onClick={() => navigate('/drh/ordres?statut=en_attente')}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                >
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Ordres en attente
                    </h2>

                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <FileText
                            size={40}
                            className="mb-3 opacity-30"
                        />

                        <p className="text-sm">
                            {stats.enAttente > 0
                                ? `${stats.enAttente} ordre(s) en attente`
                                : 'Aucun ordre en attente'}
                        </p>
                    </div>
                </div>

            </div>
        </Layout>
    )
}