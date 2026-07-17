import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { MapPin, FileText, CheckCircle, Clock, Plus, Bell, ChevronRight, Layers } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statutBadge = {
    publiee: { label: 'Publiée', color: 'bg-orange-100 text-orange-700' },
    definitive: { label: 'Définitive', color: 'bg-green-100 text-green-700' },
}

export default function ViceRecteurDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        voyagesEnAttente: 0,
        voyagesDefinitifs: 0,
        rapportsAValider: 0,
    })
    const [voyages, setVoyages] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [voyagesRes, dossiersRes] = await Promise.all([
                    api.get('/voyages-etudes'),
                    api.get('/voyages-etudes/dossiers-a-valider'),
                ])

                const data = voyagesRes.data
                setVoyages(data)
                setStats({
                    voyagesEnAttente: data.filter(v => v.statut_liste === 'publiee').length,
                    voyagesDefinitifs: data.filter(v => v.statut_liste === 'definitive').length,
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

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications')
                setNotifications(res.data)
            } catch (error) {
                console.error('Erreur notifications Vice-Recteur:', error)
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

    const totalVoyages = stats.voyagesEnAttente + stats.voyagesDefinitifs

    // Regroupement des voyages par ANNÉE (5 dernières années, année en cours incluse)
    const dataGraphique = (() => {
        const maintenant = new Date()
        const anneeActuelle = maintenant.getFullYear()
        const annees = []
        for (let i = 4; i >= 0; i--) {
            annees.push({ key: anneeActuelle - i, label: String(anneeActuelle - i), Voyages: 0 })
        }
        voyages.forEach(v => {
            const dateRef = v.created_at || v.date_depart
            if (!dateRef) return
            const d = new Date(dateRef)
            const annee = d.getFullYear()
            const entree = annees.find(a => a.key === annee)
            if (entree) entree.Voyages += 1
        })
        return annees
    })()

    const voyagesRecents = [...voyages]
        .sort((a, b) => new Date(b.created_at || b.date_depart) - new Date(a.created_at || a.date_depart))
        .slice(0, 5)

    return (
        <Layout title="Dashboard" subtitle="Gestion des voyages d'études">
            <div className="space-y-6">
                <div>
                    <h1 className="font-serif text-2xl font-semibold text-blue-950">Dashboard Vice-Recteur</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestion des voyages d'etudes</p>
                </div>


                {/* Cartes statistiques — icônes en badge rond */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <div className="bg-blue-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <Layers size={20} className="text-blue-700" />
                        </div>
                        <p className="font-serif text-2xl font-semibold text-blue-950">{totalVoyages}</p>
                        <p className="text-sm text-slate-500 mt-1">Total des voyages</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-orange-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="font-serif text-2xl font-semibold text-blue-950">{stats.voyagesEnAttente}</p>
                        <p className="text-sm text-slate-500 mt-1">Listes publiées</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-green-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="font-serif text-2xl font-semibold text-blue-950">{stats.voyagesDefinitifs}</p>
                        <p className="text-sm text-slate-500 mt-1">Listes définitives</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes?tab=dossiers')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="bg-purple-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                            <FileText size={20} className="text-purple-700" />
                        </div>
                        <p className="font-serif text-2xl font-semibold text-blue-950">{stats.rapportsAValider}</p>
                        <p className="text-sm text-slate-500 mt-1">Dossiers à valider</p>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes/nouveau')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-6 cursor-pointer transition"
                    >
                        <Plus size={28} className="mb-3" />
                        <p className="font-serif font-semibold text-lg">Publier une liste</p>
                        <p className="text-blue-200 text-sm mt-1">Selectionner les beneficiaires</p>
                    </div>

                    <div
                        onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="bg-white hover:shadow-md rounded-2xl p-6 cursor-pointer transition border border-slate-100 shadow-sm"
                    >
                        <MapPin size={28} className="mb-3 text-blue-700" />
                        <p className="font-serif font-semibold text-lg text-blue-950">Gerer les voyages</p>
                        <p className="text-slate-500 text-sm mt-1">Voir toutes les listes</p>
                    </div>
                </div>
                {/* Graphique + Dernières activités */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-serif text-lg font-semibold text-blue-950 mb-4">Voyages par année</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataGraphique}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="Voyages" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-serif text-lg font-semibold text-blue-950 mb-4">Dernières activités</h2>
                        <div className="space-y-1">
                            {loadingNotifs ? (
                                <p className="text-sm text-slate-400">Chargement...</p>
                            ) : notifications.length === 0 ? (
                                <p className="text-sm text-slate-400">Aucune activité récente</p>
                            ) : (
                                notifications.slice(0, 4).map(notif => (
                                    <div key={notif.id}
                                        onClick={() => !notif.lu && marquerLu(notif.id)}
                                        className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition"
                                    >
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700">
                                            <Bell size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{notif.titre}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Voyages récents */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-lg font-semibold text-blue-950">Voyages récents</h2>
                        <button onClick={() => navigate('/vice-recteur/voyages-etudes')} className="text-sm text-blue-700 font-medium hover:underline">
                            Voir tout
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-100">
                                    <th className="pb-2 font-medium">Destination</th>
                                    <th className="pb-2 font-medium">Bénéficiaires</th>
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {voyagesRecents.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Aucun voyage</td></tr>
                                ) : (
                                    voyagesRecents.map(v => {
                                        const badge = statutBadge[v.statut_liste] || { label: v.statut_liste, color: 'bg-gray-100 text-gray-600' }
                                        return (
                                            <tr key={v.id} className="border-b border-slate-50 last:border-0">
                                                <td className="py-3 text-blue-950">{v.destination}</td>
                                                <td className="py-3 text-slate-600">{v.beneficiaires_count ?? v.beneficiaires?.length ?? '—'}</td>
                                                <td className="py-3 text-slate-500">{v.date_depart ? new Date(v.date_depart).toLocaleDateString('fr-FR') : '—'}</td>
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