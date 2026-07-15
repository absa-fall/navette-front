import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import IncidentsSignales from '../../components/IncidentsSignales'
import { Bus, MapPin, FileText, Clock, XCircle, Bell, CheckCircle, ThumbsUp, ThumbsDown, AlertCircle, Trash2 } from 'lucide-react'

const typeNotifConfig = {
    approbation_chauffeur: { icon: ThumbsUp, color: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
    refus_chauffeur: { icon: ThumbsDown, color: 'bg-red-100 text-red-700', borderColor: 'border-red-200' },
    mission_executee: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
    mission_signee: { icon: FileText, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-200' },
    demande_approuvee_drh: { icon: CheckCircle, color: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
    demande_rejetee_drh: { icon: XCircle, color: 'bg-red-100 text-red-700', borderColor: 'border-red-200' },
}

export default function DDLDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ demandesNavette: 0, voyagesEtudes: 0, enAttente: 0, rejetees: 0 })
    const [notifications, setNotifications] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)
    //  Historique notifications
    const [selectedNotifs, setSelectedNotifs] = useState([])
    const [deleteNotifsLoading, setDeleteNotifsLoading] = useState(false)
    const [ongletNotif, setOngletNotif] = useState('nonlues')

    useEffect(() => {
        fetchStats()
        fetchNotifications()
    }, [])

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
            setNotifications(res.data)
        } catch (error) {
            console.error('Erreur notifications:', error)
        } finally {
            setLoadingNotifs(false)
        }
    }

    const marquerLu = async (id) => {
        try {
            await api.patch(`/notifications/${id}/lu`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
        } catch (error) {
            console.error('Erreur marquer lu:', error)
        }
    }

    const marquerTousLus = () => {
        notifications.filter(n => !n.lu).forEach(n => marquerLu(n.id))
    }

    // Suppression notifications
    const toggleSelectNotif = (id) => {
        setSelectedNotifs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAllNotifs = () => {
        const ids = notifsLues.map(n => n.id)
        if (ids.every(id => selectedNotifs.includes(id))) setSelectedNotifs([])
        else setSelectedNotifs(ids)
    }

    const supprimerNotifsSelection = async () => {
        if (selectedNotifs.length === 0) return
        if (!confirm(`Supprimer ${selectedNotifs.length} notification(s) ?`)) return
        setDeleteNotifsLoading(true)
        try {
            await Promise.all(selectedNotifs.map(id => api.delete(`/notifications/${id}`)))
            setNotifications(prev => prev.filter(n => !selectedNotifs.includes(n.id)))
            setSelectedNotifs([])
        } catch (err) {
            alert('Erreur lors de la suppression.')
        } finally {
            setDeleteNotifsLoading(false)
        }
    }

    const notifsNonLues = notifications.filter(n => !n.lu)
    const notifsLues = notifications.filter(n => n.lu)
    const listeActive = ongletNotif === 'nonlues' ? notifsNonLues : notifsLues
    const toutSelectNotif = notifsLues.length > 0 && notifsLues.every(n => selectedNotifs.includes(n.id))

    return (
        <Layout>
            <div className="space-y-6">
          
<div>
    <h1 className="text-2xl font-bold text-gray-800">Bonjour, {user?.prenom} </h1>
    <p className="text-gray-500 text-sm mt-1">Bienvenue sur votre espace UADB Mobilité</p>
</div>

<IncidentsSignales />

{/* Stats */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-5"></div>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div onClick={() => navigate('/ddl/navettes')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-blue-100 p-2 rounded-xl"><Bus size={20} className="text-blue-700" /></div>
                            <span className="text-xs text-gray-400">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.demandesNavette}</p>
                        <p className="text-sm text-gray-500 mt-1">Demandes navette</p>
                    </div>
                    
                    <div onClick={() => navigate('/ddl/en-attente')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-orange-100 p-2 rounded-xl"><Clock size={20} className="text-orange-700" /></div>
                            <span className="text-xs text-gray-400">En cours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>
                    <div onClick={() => navigate('/ddl/demandes-rejetees')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-red-100 p-2 rounded-xl"><XCircle size={20} className="text-red-700" /></div>
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
                            <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition"><Bus size={22} className="text-blue-700" /></div>
                            <div>
                                <p className="font-semibold text-gray-800">Demander une navette</p>
                                <p className="text-sm text-gray-500">Soumettre un ordre de mission</p>
                            </div>
                        </a>
                       
                    </div>
                </div>

               
            </div>
        </Layout>
    )
}