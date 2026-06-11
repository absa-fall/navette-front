import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Bus, MapPin, FileText, Clock, XCircle, Bell, CheckCircle, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'

const typeNotifConfig = {
    approbation_chauffeur: {
        icon: ThumbsUp,
        color: 'bg-green-100 text-green-700',
        borderColor: 'border-green-200',
    },
    refus_chauffeur: {
        icon: ThumbsDown,
        color: 'bg-red-100 text-red-700',
        borderColor: 'border-red-200',
    },
    mission_executee: {
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-700',
        borderColor: 'border-blue-200',
    },
    mission_signee: {
        icon: FileText,
        color: 'bg-purple-100 text-purple-700',
        borderColor: 'border-purple-200',
    },
    demande_approuvee_drh: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
        borderColor: 'border-green-200',
    },
    demande_rejetee_drh: {
        icon: XCircle,
        color: 'bg-red-100 text-red-700',
        borderColor: 'border-red-200',
    },
}

export default function DDLDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        demandesNavette: 0,
        voyagesEtudes: 0,
        enAttente: 0,
        rejetees: 0,
    })
    const [notifications, setNotifications] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)

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

        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications')
                setNotifications(res.data.slice(0, 10)) // dernières 10
            } catch (error) {
                console.error('Erreur notifications:', error)
            } finally {
                setLoadingNotifs(false)
            }
        }

        fetchStats()
        fetchNotifications()
    }, [])

    const marquerLu = async (id) => {
        try {
            await api.patch(`/notifications/${id}/lu`)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, lu: true } : n)
            )
        } catch (error) {
            console.error('Erreur marquer lu:', error)
        }
    }

    const notifsNonLues = notifications.filter(n => !n.lu).length

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

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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

                {/* ✅ NOUVEAU : Notifications */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                            {notifsNonLues > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                    {notifsNonLues}
                                </span>
                            )}
                        </div>
                        {notifications.some(n => !n.lu) && (
                            <button
                                onClick={() => notifications.filter(n => !n.lu).forEach(n => marquerLu(n.id))}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {loadingNotifs ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <Bell size={36} className="mb-3 opacity-30" />
                            <p className="text-sm">Aucune notification</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(notif => {
                                const config = typeNotifConfig[notif.type] || {
                                    icon: AlertCircle,
                                    color: 'bg-gray-100 text-gray-600',
                                    borderColor: 'border-gray-200',
                                }
                                const Icon = config.icon
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-3 p-4 rounded-xl border transition ${
                                            notif.lu
                                                ? 'bg-gray-50 border-gray-100 opacity-70'
                                                : `bg-white ${config.borderColor} shadow-sm`
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl flex-shrink-0 ${config.color}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${notif.lu ? 'text-gray-500' : 'text-gray-800'}`}>
                                                {notif.titre}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            {/* ✅ Affiche le motif de refus si présent */}
                                            {notif.motif_refus && (
                                                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                    <p className="text-xs text-red-600 font-medium">
                                                        Motif : {notif.motif_refus}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {!notif.lu && (
                                            <button
                                                onClick={() => marquerLu(notif.id)}
                                                className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                                            >
                                                Marquer lu
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}