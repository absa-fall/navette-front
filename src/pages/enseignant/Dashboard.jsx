import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ProchaineNavette from '../../components/ProchaineNavette'
import { useState, useEffect } from 'react'
import { MapPin, FileText, Clock, CheckCircle, AlertTriangle, Bus, ChevronRight, Bell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'

const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

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
    const [voyages, setVoyages] = useState([])
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/mes-voyages-etudes'),
            api.get('/rapports'),
            api.get('/voyages/eligibilite'),
            api.get('/enseignant/mes-reservations').catch(() => ({ data: [] })),
        ]).then(([voyagesRes, rapportsRes, eligRes, reservationsRes]) => {
            const beneficiaires = voyagesRes.data
            setVoyages(beneficiaires)
            setReservations(reservationsRes.data || [])
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

    // Construit les données du graphique sur les 6 derniers mois
    // ⚠️ Adapte "date_reservation" si le champ de date de tes réservations porte un autre nom
    // (ex: date_depart, created_at, date_navette...)
    const dataGraphique = (() => {
        const maintenant = new Date()
        const mois = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
            mois.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: moisLabels[d.getMonth()], Réservations: 0 })
        }
        reservations.forEach(r => {
            const dateChamp = r.date_reservation || r.date_depart || r.date_navette || r.created_at
            if (!dateChamp) return
            const d = new Date(dateChamp)
            const key = `${d.getFullYear()}-${d.getMonth()}`
            const entree = mois.find(m => m.key === key)
            if (entree) entree.Réservations += 1
        })
        return mois
    })()

    const voyagesRecents = [...voyages]
        .sort((a, b) => new Date(b.date_debut || b.created_at) - new Date(a.date_debut || a.created_at))
        .slice(0, 5)

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

                {/* Cartes du haut = stats + actions rapides fusionnées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">

                    <div
                        onClick={() => navigate('/enseignant/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <MapPin size={20} className="text-blue-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.voyages}</p>
                        <p className="text-sm text-gray-500 mt-1">Mes voyages d'études</p>
                    </div>

                    <div
                        onClick={() => navigate('/enseignant/voyages-etudes?statut=en_attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-orange-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Clock size={20} className="text-orange-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>

                    <div
                        onClick={() => navigate('/enseignant/voyages-etudes?statut=approuve')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} className="text-green-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.approuves}</p>
                        <p className="text-sm text-gray-500 mt-1">Approuvés</p>
                    </div>

                    <div
                        onClick={() => navigate('/enseignant/mes-reservations')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-indigo-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Bus size={20} className="text-indigo-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.rapports}</p>
                        <p className="text-sm text-gray-500 mt-1">Mes réservations</p>
                    </div>

                    <div
                        onClick={() => navigate('/enseignant/scanner')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-purple-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <FileText size={20} className="text-purple-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Scan</p>
                        <p className="text-sm text-gray-500 mt-1">Scanner le bus</p>
                    </div>
                </div>

                {/* Graphique + Voyages récents — prend le reste de la place */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Réservations par mois</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataGraphique}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="Réservations" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Voyages récents</h2>
                            <button onClick={() => navigate('/enseignant/voyages-etudes')} className="text-sm text-blue-700 font-medium hover:underline">
                                Voir tout
                            </button>
                        </div>
                        <div className="space-y-1">
                            {loading ? (
                                <p className="text-sm text-gray-400">Chargement...</p>
                            ) : voyagesRecents.length === 0 ? (
                                <p className="text-sm text-gray-400">Aucun voyage récent</p>
                            ) : (
                                voyagesRecents.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => navigate('/enseignant/voyages-etudes')}
                                        className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition"
                                    >
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-700">
                                            <Bell size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{v.destination || v.titre || 'Voyage'}</p>
                                            <p className="text-xs text-gray-400">
                                                {v.date_debut ? new Date(v.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}