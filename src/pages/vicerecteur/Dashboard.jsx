import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { MapPin, FileText, CheckCircle, Clock, Plus } from 'lucide-react'

export default function ViceRecteurDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        voyagesEnAttente: 0,
        voyagesDefinitifs: 0,
        rapportsAValider: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const fetchStats = async () => {
        try {
            const [voyagesRes, dossiersRes] = await Promise.all([
                api.get('/voyages-etudes'),
                api.get('/voyages-etudes/dossiers-a-valider'),
            ])

            const voyages = voyagesRes.data
            setStats({
                voyagesEnAttente: voyages.filter(v => v.statut_liste === 'publiee').length,
                voyagesDefinitifs: voyages.filter(v => v.statut_liste === 'definitive').length,
                rapportsAValider: dossiersRes.data.length,
            })
        } catch (error) {
            console.error('Erreur stats Vice-Recteur:', error)
        } finally {
            setLoading(false)
        }
    }
    fetchStats()
}, [])

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Vice-Recteur</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des voyages d'etudes</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyagesEnAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">Listes publiees</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyagesDefinitifs}</p>
                        <p className="text-sm text-gray-500 mt-1">Listes definitives</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes?tab=dossiers')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <FileText size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.rapportsAValider}</p>
                        <p className="text-sm text-gray-500 mt-1">Dossiers a valider</p>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                        className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-6 cursor-pointer transition"
                    >
                        <Plus size={28} className="mb-3" />
                        <p className="font-bold text-lg">Publier une liste</p>
                        <p className="text-blue-200 text-sm mt-1">Selectionner les beneficiaires</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="bg-white hover:shadow-md rounded-2xl p-6 cursor-pointer transition border border-gray-100 shadow-sm"
                    >
                        <MapPin size={28} className="mb-3 text-blue-700" />
                        <p className="font-bold text-lg text-gray-800">Gerer les voyages</p>
                        <p className="text-gray-500 text-sm mt-1">Voir toutes les listes</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}