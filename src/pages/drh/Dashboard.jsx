import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import IncidentsDrh from '../../components/IncidentsDrh'
import {
    FileText, CheckCircle, XCircle, Clock, Bell, ThumbsUp, ThumbsDown, ChevronRight, Layers
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const typeNotifConfig = {
    approbation_chauffeur: { icon: ThumbsUp, color: 'bg-green-100 text-green-700' },
    refus_chauffeur: { icon: ThumbsDown, color: 'bg-red-100 text-red-700' },
    mission_executee: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
    mission_signee: { icon: FileText, color: 'bg-purple-100 text-purple-700' },
    demande_approuvee_drh: { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    demande_rejetee_drh: { icon: XCircle, color: 'bg-red-100 text-red-700' },
}

const statutBadge = {
    en_attente_drh: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
    approuve_drh: { label: 'Approuvé', color: 'bg-green-100 text-green-700' },
    transmis_chauffeur: { label: 'Approuvé', color: 'bg-green-100 text-green-700' },
    execute: { label: 'Approuvé', color: 'bg-green-100 text-green-700' },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
}

const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export default function DRHDashboard() {
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        enAttente: 0,
        approuves: 0,
        rejetes: 0,
    })
    const [ordres, setOrdres] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)

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

    useEffect(() => {
        const fetchOrdres = async () => {
            try {
                const res = await api.get('/ordres-mission')
                setOrdres(res.data)
            } catch (error) {
                console.error('Erreur ordres DRH:', error)
            }
        }
        fetchOrdres()
    }, [])

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications')
                setNotifications(res.data)
            } catch (error) {
                console.error('Erreur notifications DRH:', error)
            } finally {
                setLoadingNotifs(false)
            }
        }
        fetchNotifications()
    }, [])
    

    const marquerLu = async (id) => {
        try {
            await api.patch(`/notifications/${id}/lu`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
        } catch (error) {
            console.error('Erreur marquer lu:', error)
        }
    }

    const totalDemandes = stats.enAttente + stats.approuves + stats.rejetes

    const dataGraphique = (() => {
        const maintenant = new Date()
        const mois = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
            mois.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: moisLabels[d.getMonth()], Demandes: 0 })
        }
        ordres.forEach(o => {
            if (!o.date_depart) return
            const d = new Date(o.date_depart)
            const key = `${d.getFullYear()}-${d.getMonth()}`
            const entree = mois.find(m => m.key === key)
            if (entree) entree.Demandes += 1
        })
        return mois
    })()

    const ordresRecents = [...ordres]
        .sort((a, b) => new Date(b.date_depart) - new Date(a.date_depart))
        .slice(0, 5)

    return (
        <Layout title="Dashboard" subtitle="Gestion des ordres de mission">
            <div className="space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard DRH</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des ordres de mission</p>
                </div>

                <IncidentsDrh />

                {/* Cartes statistiques — icônes en badge rond */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Layers size={20} className="text-blue-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{totalDemandes}</p>
                        <p className="text-sm text-gray-500 mt-1">Total des ordres</p>
                    </div>

                    <div
                        onClick={() => navigate('/drh/ordres?statut=en_attente')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-orange-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Clock size={20} className="text-orange-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente d'approbation</p>
                    </div>

                    <div
                        onClick={() => navigate('/drh/ordres?statut=approuve')}
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
                        onClick={() => navigate('/drh/ordres?statut=rejete')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-red-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <XCircle size={20} className="text-red-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.rejetes}</p>
                        <p className="text-sm text-gray-500 mt-1">Rejetés</p>
                    </div>
                </div>

                {/* Graphique + Dernières activités */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ordres par mois</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataGraphique}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="Demandes" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Dernières activités</h2>
                        <div className="space-y-1">
                            {loadingNotifs ? (
                                <p className="text-sm text-gray-400">Chargement...</p>
                            ) : notifications.length === 0 ? (
                                <p className="text-sm text-gray-400">Aucune activité récente</p>
                            ) : (
                                notifications.slice(0, 4).map(notif => {
                                    const config = typeNotifConfig[notif.type] || { icon: Bell, color: 'bg-slate-100 text-slate-500' }
                                    const Icon = config.icon
                                    return (
                                        <div key={notif.id}
                                            onClick={() => !notif.lu && marquerLu(notif.id)}
                                            className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition"
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                                <Icon size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{notif.titre}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-300" />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Ordres récents */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Ordres récents</h2>
                        <button onClick={() => navigate('/drh/ordres?statut=en_attente')} className="text-sm text-blue-700 font-medium hover:underline">
                            Voir tout
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                                    <th className="pb-2 font-medium">Destination</th>
                                    <th className="pb-2 font-medium">Chauffeur</th>
                                    <th className="pb-2 font-medium">Demandé par</th>
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordresRecents.length === 0 ? (
                                    <tr><td colSpan={5} className="py-4 text-center text-gray-400">Aucun ordre</td></tr>
                                ) : (
                                    ordresRecents.map(o => {
                                        const badge = statutBadge[o.statut] || { label: o.statut, color: 'bg-gray-100 text-gray-600' }
                                        return (
                                            <tr key={o.id} className="border-b border-gray-50 last:border-0">
                                                <td className="py-3 text-gray-800">{o.destination}</td>
                                                <td className="py-3 text-gray-600">{o.chauffeur_prenom} {o.chauffeur_nom}</td>
                                                <td className="py-3 text-gray-600">{o.ddl?.prenom} {o.ddl?.nom}</td>
                                                <td className="py-3 text-gray-500">{new Date(o.date_depart).toLocaleDateString('fr-FR')}</td>
                                                <td className="py-3">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </Layout>
    )
}