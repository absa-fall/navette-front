import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Bus,
    MapPin,
    FileText,
    Users,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell,
    CheckCircle,
    Trash2
} from 'lucide-react'

const menuParRole = {
    admin: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Utilisateurs', icon: Users, path: '/admin/utilisateurs' },
        { label: 'Véhicules', icon: Bus, path: '/admin/vehicules' },
    ],
    ddl: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/ddl/dashboard' },
        { label: 'Mes navettes', icon: Bus, path: '/ddl/navettes' },
    ],
    enseignant: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/enseignant/dashboard' },
        { label: 'Mes voyages', icon: MapPin, path: '/enseignant/voyages' },
        { label: 'Mes rapports', icon: FileText, path: '/enseignant/rapports' },
        { label: 'Validation', icon: CheckCircle, path: '/validation' },
    ],
    drh: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/drh/dashboard' },
        { label: 'Ordres à approuver', icon: FileText, path: '/drh/ordres' },
    ],
    sg_drh: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/sg-drh/dashboard' },
        { label: 'Ordres à signer', icon: FileText, path: '/sg-drh/ordres' },
    ],
    chauffeur: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/chauffeur/dashboard' },
        { label: 'Mes trajets', icon: Bus, path: '/chauffeur/trajets' },
        // Validation supprimée
    ],
    sg_vr: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/sg-vr/dashboard' },
        { label: 'Récapitulatifs', icon: FileText, path: '/sg-vr/recapitulatifs' },
    ],
    vice_recteur: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/vice-recteur/dashboard' },
        { label: 'Voyages à traiter', icon: MapPin, path: '/vice-recteur/voyages' },
        { label: 'Rapports à valider', icon: FileText, path: '/vice-recteur/rapports' },
    ],
}

const roleLabels = {
    admin: 'Administrateur',
    ddl: 'Demandeur',
    enseignant: 'Enseignant PER',
    drh: 'DRH',
    sg_drh: 'SG - DRH',
    chauffeur: 'Chauffeur',
    sg_vr: 'SG - Vice-Recteur',
    vice_recteur: 'Vice-Recteur',
}

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [badges, setBadges] = useState({
        drhOrdres: 0,
        drhOrdresApprouves: 0,
        drhOrdresRejetes: 0,
        sgDrhOrdres: 0,
        sgDrhSignes: 0,
        sgDrhTransmis: 0,
        viceRecteurVoyages: 0,
        viceRecteurRapports: 0,
        trajetsAssignes: 0,
        enAttente: 0,
        trajetsEffectues: 0,
        mesDemandes: 0,
        mesDemandesRejetees: 0,
    })

    const [notifOpen, setNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState([])

    const totalNotifs = notifications.filter(n => !n.lu).length

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await api.get('/notifications')
                setNotifications(res.data)
            } catch (error) {
                console.error('Erreur notifications:', error)
            }
        }

        fetchNotifs()
        const interval = setInterval(fetchNotifs, 10000)
        return () => clearInterval(interval)
    }, [])

    const marquerLu = async (id) => {
        try {
            await api.patch(`/notifications/${id}/lu`)
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, lu: true } : n
            ))
        } catch (error) {
            console.error(error)
        }
    }

    const marquerToutLu = async () => {
        try {
            await api.patch('/notifications/lu-toutes')
            setNotifications(prev => prev.map(notif => ({ ...notif, lu: true })))
        } catch (error) {
            console.error('Erreur marquer toutes lues :', error)
        }
    }

    const supprimerNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const supprimerToutesNotifications = async () => {
        try {
            await api.delete('/notifications/toutes')
            setNotifications([])
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifOpen && !e.target.closest('.notif-dropdown')) {
                setNotifOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [notifOpen])

    const menu = menuParRole[user?.role] || []

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications/sidebar')
                setBadges(prev => ({ ...prev, ...res.data }))
            } catch (error) {
                console.error(error)
            }
        }

        fetchNotifications()
        const interval = setInterval(fetchNotifications, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen flex bg-gray-100">

            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-blue-900 text-white flex flex-col transition-all duration-300 min-h-screen`}>

                {/* Logo */}
                <div className="flex items-center gap-3 p-4 border-b border-blue-800">
                    <div className="bg-white/20 p-2 rounded-xl flex-shrink-0">
                        <Bus size={20} className="text-white" />
                    </div>
                    {sidebarOpen && (
                        <span className="font-bold text-sm">UADB Mobilité</span>
                    )}
                </div>

                {/* Menu */}
                <nav className="flex-1 p-3 space-y-1">
                    {menu.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    isActive
                                        ? 'bg-white text-blue-900 font-semibold'
                                        : 'text-blue-200 hover:bg-blue-800'
                                }`}
                            >
                                <Icon size={18} className="flex-shrink-0" />
                                {sidebarOpen && (
                                    <>
                                        <span className="text-sm flex-1">{item.label}</span>

                                        {item.path === '/drh/ordres' && badges.drhOrdres > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {badges.drhOrdres}
                                            </span>
                                        )}

                                        {item.path === '/sg-drh/ordres' && badges.sgDrhOrdres > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {badges.sgDrhOrdres}
                                            </span>
                                        )}

                                        {item.path === '/vice-recteur/voyages' && badges.viceRecteurVoyages > 0 && (
                                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {badges.viceRecteurVoyages}
                                            </span>
                                        )}

                                        {item.path === '/vice-recteur/rapports' && badges.viceRecteurRapports > 0 && (
                                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {badges.viceRecteurRapports}
                                            </span>
                                        )}

                                        {item.path === '/chauffeur/trajets' && badges.enAttente > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {badges.enAttente}
                                            </span>
                                        )}

                                        {item.path === '/ddl/navettes' &&
                                            (badges.mesDemandes > 0 || badges.mesDemandesRejetees > 0) && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {badges.mesDemandes + badges.mesDemandesRejetees}
                                                </span>
                                            )}

                                        {isActive && (
                                            <ChevronRight size={14} className="ml-auto" />
                                        )}
                                    </>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User info */}
                {sidebarOpen && (
                    <div className="p-4 border-t border-blue-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white/20 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold">
                                {user?.prenom?.[0]}{user?.nom?.[0]}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
                                <p className="text-xs text-blue-300">{roleLabels[user?.role]}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 text-blue-300 hover:text-white text-sm px-2 py-2 rounded-lg hover:bg-blue-800 transition"
                        >
                            <LogOut size={16} />
                            Se déconnecter
                        </button>
                    </div>
                )}
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col">

                {/* Topbar */}
                <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Cloche notification */}
                        <div className="relative notif-dropdown">
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition"
                            >
                                <Bell size={20} />
                                {totalNotifs > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                                        {totalNotifs > 9 ? '9+' : totalNotifs}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">

                                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-semibold text-sm text-gray-800">Notifications</h3>
                                        <div className="flex gap-3">
                                            {totalNotifs > 0 && (
                                                <button onClick={marquerToutLu}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                    Tout lire
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button onClick={supprimerToutesNotifications}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium">
                                                    Effacer tout
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400">
                                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Aucune notification</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id}
                                                    onClick={() => {
                                                        if (!notif.lu) marquerLu(notif.id)
                                                        setNotifOpen(false)
                                                        if (user?.role === 'ddl') navigate('/ddl/navettes')
                                                        if (user?.role === 'chauffeur') navigate('/chauffeur/trajets')
                                                        if (user?.role === 'drh') navigate('/drh/ordres')
                                                        if (user?.role === 'sg_drh') navigate('/sg-drh/ordres')
                                                        if (user?.role === 'vice_recteur') navigate('/vice-recteur/voyages')
                                                    }}
                                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!notif.lu ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${!notif.lu ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                            <Bell size={14} className={!notif.lu ? 'text-blue-600' : 'text-gray-400'} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{notif.titre}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                                                    day: 'numeric', month: 'short',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); supprimerNotification(notif.id) }}
                                                                className="text-red-500 hover:text-red-700 mt-1">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        {!notif.lu && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="bg-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {user?.prenom?.[0]}{user?.nom?.[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {user?.prenom} {user?.nom}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}