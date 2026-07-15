import Layout from '../../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import MissionEnCours from '../../components/MissionEnCours'
import { Bus, ClipboardList, CheckCircle, Clock, XCircle, QrCode } from 'lucide-react'

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

        const interval = setInterval(fetchStats, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <Layout>
            <div className="space-y-6">

<div>
    <h1 className="text-2xl font-bold text-gray-800">
        Dashboard Chauffeur
    </h1>
    <p className="text-gray-500 text-sm mt-1">
        Gestion de vos trajets
    </p>
</div>

<MissionEnCours />

<div className="grid grid-cols-1 md:grid-cols-3 gap-5"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <div
                        onClick={() => navigate('/chauffeur/trajets?statut=assignes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <Bus size={20} className="text-blue-700" />
                        </div>

                        <p className="text-2xl font-bold text-gray-800">
                            {stats.trajetsAssignes}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Trajets assignés
                        </p>
                    </div>

                    <div
                        onClick={() => navigate('/chauffeur/trajets?statut=en_attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>

                        <p className="text-2xl font-bold text-gray-800">
                            {stats.enAttente}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            En attente
                        </p>
                    </div>

                    <div
                        onClick={() => navigate('/chauffeur/trajets?statut=effectues')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>

                        <p className="text-2xl font-bold text-gray-800">
                            {stats.trajetsEffectues}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Trajets effectués
                        </p>
                    </div>

                    </div>

                {/* Réservations / Mon bus / Scanner — 3 colonnes, boutons unifiés en bleu, plus de "Mes trajets du jour" */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Réservations
                        </h2>

                        <p className="text-gray-500 text-sm mb-4 flex-1">
                            Voir et valider les réservations des passagers
                        </p>

                        <button
                            onClick={() => navigate('/chauffeur/reservations')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        >
                            <ClipboardList size={18} />
                            Voir les réservations
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Mon bus
                        </h2>
                        <p className="text-gray-500 text-sm mb-4 flex-1">
                            Afficher et imprimer le QR code de votre bus
                        </p>
                        <button
                            onClick={() => navigate('/chauffeur/mon-bus')}
                            className="border border-blue-200 hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        >
                            <QrCode size={18} />
                            Voir le QR de mon bus
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Scanner un passager
                        </h2>
                        <p className="text-gray-500 text-sm mb-4 flex-1">
                            Si le passager n'a pas de connexion, scannez son QR code pour valider sa montée
                        </p>
                        <button
                            onClick={() => navigate('/chauffeur/scanner')}
                            className="border border-blue-200 hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        >
                            <QrCode size={18} />
                            Scanner le QR du passager
                        </button>
                    </div>

                </div>

            </div>
        </Layout>
    )
}