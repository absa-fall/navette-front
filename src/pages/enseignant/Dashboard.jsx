import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ProchaineNavette from '../../components/ProchaineNavette'
import { useState, useEffect } from 'react'
import { MapPin, FileText, Clock, CheckCircle, AlertTriangle, Bus } from 'lucide-react'
import api from '../../api/axios'

export default function EnseignantDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [stats, setStats] = useState({
        voyages: 0,
        rapports: 0,
        enAttente: 0,
        approuves: 0,
    })
    const [eligibilite, setEligibilite] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/mes-voyages-etudes'),
            api.get('/rapports'),
            api.get('/voyages/eligibilite'),
        ]).then(([voyagesRes, rapportsRes, eligRes]) => {
            const beneficiaires = voyagesRes.data
            setStats({
                voyages: beneficiaires.length,
                rapports: rapportsRes.data.length,
                enAttente: beneficiaires.filter(b => b.statut_justificatif === 'en_attente').length,
                approuves: beneficiaires.filter(b => b.statut_autorisation === 'approuve').length,
            })
            setEligibilite(eligRes.data)
        }).catch(() => {})
        .finally(() => setLoading(false))
    }, [])

    return (
        <Layout>
            <div className="space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Bonjour, {user?.prenom} 
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Espace enseignant — {user?.ufr}
                    </p>
                </div>

                {/* Éligibilité */}
                {!loading && eligibilite && (
                    <div className={`rounded-xl p-4 flex items-center gap-3 ${
                        eligibilite.eligible
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-orange-50 border border-orange-200'
                    }`}>
                        {eligibilite.eligible
                            ? <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                            : <AlertTriangle size={20} className="text-orange-600 flex-shrink-0" />
                        }
                        <p className={`text-sm font-medium ${
                            eligibilite.eligible ? 'text-green-700' : 'text-orange-700'
                        }`}>
                            {eligibilite.message}
                        </p>
                    </div>
                )}
<ProchaineNavette />
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <div
                        onClick={() => navigate('/enseignant/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <MapPin size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyages}</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages total</p>
                    </div>

                    <div
                        onClick={() => navigate('/enseignant/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>

                    <div
                        onClick={() => navigate('/enseignant/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.approuves}</p>
                        <p className="text-sm text-gray-500 mt-1">Approuvés</p>
                    </div>

                  
                </div>

                {/* Actions rapides */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    

                        <div
                            onClick={() => navigate('/enseignant/voyages-etudes')}
                            className="flex items-center gap-4 p-4 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group cursor-pointer"
                        >
                            <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition">
                                <MapPin size={22} className="text-blue-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Mes voyages d'études</p>
                                <p className="text-sm text-gray-500">Voir mes sélections et soumettre justificatifs</p>
                            </div>
                        </div>

<div
    onClick={() => navigate('/enseignant/mes-reservations')}
    className="flex items-center gap-4 p-4 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition group cursor-pointer"
>
    <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-indigo-200 transition">
        <Bus size={22} className="text-indigo-700" />
    </div>
    <div>
        <p className="font-semibold text-gray-800">Mes réservations</p>
        <p className="text-sm text-gray-500">Voir mes QR codes navette</p>
    </div>
</div>

<div
    onClick={() => navigate('/enseignant/scanner')}
    className="flex items-center gap-4 p-4 border-2 border-dashed border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group cursor-pointer"
>
    <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition">
        <Bus size={22} className="text-green-700" />
    </div>
    <div>
        <p className="font-semibold text-gray-800">Scanner le bus</p>
        <p className="text-sm text-gray-500">Scanner le QR code du bus</p>
    </div>
</div>

                    </div>
                </div>
            </div>
        </Layout>
    )
}