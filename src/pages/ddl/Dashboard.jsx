import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import IncidentsSignales from '../../components/IncidentsSignales'
import {
    Bus, MapPin, FileText, Clock, XCircle, Bell, CheckCircle,
    ThumbsUp, ThumbsDown, AlertCircle, Trash2, Calendar, Hourglass, ChevronRight
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
    approuve_drh: { label: 'Validée', color: 'bg-green-100 text-green-700' },
    transmis_chauffeur: { label: 'Validée', color: 'bg-green-100 text-green-700' },
    execute: { label: 'Validée', color: 'bg-green-100 text-green-700' },
    rejete: { label: 'Rejetée', color: 'bg-red-100 text-red-700' },
}

const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export default function DDLDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ demandesNavette: 0, enAttente: 0, rejetees: 0, validees: 0 })
    const [notifications, setNotifications] = useState([])
    const [ordres, setOrdres] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)

    const [selectedNotifs, setSelectedNotifs] = useState([])
    const [deleteNotifsLoading, setDeleteNotifsLoading] = useState(false)
    const [ongletNotif, setOngletNotif] = useState('nonlues')

    useEffect(() => {
        fetchStats()
        fetchNotifications()
        fetchOrdres()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await api.get('/notifications/sidebar')
            setStats(prev => ({
                ...prev,
                demandesNavette: (res.data.mesDemandes || 0) + (res.data.mesDemandesRejetees || 0),
                enAttente: res.data.mesDemandes || 0,
                rejetees: res.data.mesDemandesRejetees || 0,
            }))
        } catch (error) {
            console.error('Erreur stats:', error)
        }
    }

    const fetchOrdres = async () => {
        try {
            const res = await api.get('/ordres-mission')
            setOrdres(res.data)
            const validees = res.data.filter(o =>
                ['approuve_drh', 'transmis_chauffeur', 'execute'].includes(o.statut)
            ).length
            setStats(prev => ({ ...prev, validees }))
        } catch (error) {
            console.error('Erreur ordres:', error)
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

    // Regroupement des ordres par semaine (6 dernières semaines) pour le graphique
    const dataGraphique = (() => {
        const maintenant = new Date()
        // Trouve le lundi de la semaine courante
        const lundiCourant = new Date(maintenant)
        const jourSemaine = lundiCourant.getDay() // 0 = dimanche, 1 = lundi...
        const decalage = jourSemaine === 0 ? 6 : jourSemaine - 1
        lundiCourant.setDate(lundiCourant.getDate() - decalage)
        lundiCourant.setHours(0, 0, 0, 0)

        const semaines = []
        for (let i = 5; i >= 0; i--) {
            const debut = new Date(lundiCourant)
            debut.setDate(debut.getDate() - i * 7)
            const fin = new Date(debut)
            fin.setDate(fin.getDate() + 6)

            const label = `${debut.getDate()}/${debut.getMonth() + 1}`
            semaines.push({ debut, fin, label, Demandes: 0 })
        }

        ordres.forEach(o => {
            if (!o.date_depart) return
            const d = new Date(o.date_depart)
            const semaine = semaines.find(s => d >= s.debut && d <= s.fin)
            if (semaine) semaine.Demandes += 1
        })

        return semaines
    })()

    const ordresRecents = [...ordres]
        .sort((a, b) => new Date(b.date_depart) - new Date(a.date_depart))
        .slice(0, 5)

    return (
        <Layout title="Dashboard" subtitle="Vue d'ensemble de l'activité">
            <div className="space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Bonjour, {user?.prenom}</h1>
                    <p className="text-gray-500 text-sm mt-1">Bienvenue sur votre espace UADB Mobilité</p>
                </div>

                <IncidentsSignales />

                {/* Cartes statistiques */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    <div onClick={() => navigate('/ddl/navettes')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 p-3 rounded-xl"><Calendar size={20} className="text-blue-700" /></div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.demandesNavette}</p>
                        <p className="text-sm text-gray-500 mt-1">Demandes</p>
                    </div>

                    <div onClick={() => navigate('/ddl/en-attente')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-orange-100 p-3 rounded-xl"><Hourglass size={20} className="text-orange-700" /></div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-100 p-3 rounded-xl"><CheckCircle size={20} className="text-green-700" /></div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.validees}</p>
                        <p className="text-sm text-gray-500 mt-1">Validées</p>
                    </div>

                    <div onClick={() => navigate('/ddl/demandes-rejetees')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-red-100 p-3 rounded-xl"><XCircle size={20} className="text-red-700" /></div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.rejetees}</p>
                        <p className="text-sm text-gray-500 mt-1">Rejetées</p>
                    </div>
                </div>

                {/* Graphique + Dernières activités */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Demandes par semaine</h2>
                        </div>
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Dernières activités</h2>
                        </div>
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
                                            <div className={`p-2 rounded-full ${config.color}`}>
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

                {/* Actions rapides + Demandes récentes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
                        <a href="/ddl/navettes/nouvelle" className="flex items-center gap-4 p-4 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group">
                            <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition"><Bus size={22} className="text-blue-700" /></div>
                            <div>
                                <p className="font-semibold text-gray-800">Demander une navette</p>
                                <p className="text-sm text-gray-500">Soumettre un ordre de mission</p>
                            </div>
                        </a>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Demandes récentes</h2>
                            <button onClick={() => navigate('/ddl/navettes')} className="text-sm text-blue-700 font-medium hover:underline">
                                Voir tout
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                                        <th className="pb-2 font-medium">Destination</th>
                                        <th className="pb-2 font-medium">Chauffeur</th>
                                        <th className="pb-2 font-medium">Date</th>
                                        <th className="pb-2 font-medium">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordresRecents.length === 0 ? (
                                        <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune demande</td></tr>
                                    ) : (
                                        ordresRecents.map(o => {
                                            const badge = statutBadge[o.statut] || { label: o.statut, color: 'bg-gray-100 text-gray-600' }
                                            return (
                                                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                                                    <td className="py-3 text-gray-800">{o.destination}</td>
                                                    <td className="py-3 text-gray-600">{o.chauffeur_prenom} {o.chauffeur_nom}</td>
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

            </div>
        </Layout>
    )
}