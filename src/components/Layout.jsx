import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Bus, MapPin, FileText, Users, LayoutDashboard, LogOut,
    Menu, X, ChevronRight, Bell, Trash2, CheckCheck, BarChart2, Camera, 
    CheckCircle, Clock, XCircle, Calendar,
} from 'lucide-react'
const menuParRole = {
    admin: [
        { label: 'Dashboard',     icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Utilisateurs',  icon: Users,           path: '/admin/utilisateurs' },
        { label: 'Véhicules',     icon: Bus,             path: '/admin/vehicules' },
    ],
    ddl: [
        { label: 'Dashboard',          icon: LayoutDashboard, path: '/ddl/dashboard' },
        { label: 'Mes navettes',       icon: Bus,             path: '/ddl/navettes' },
        { label: 'En attente',         icon: Clock,           path: '/ddl/en-attente' },
        { label: 'Demandes rejetées',  icon: XCircle,         path: '/ddl/demandes-rejetees' },
    ],
    enseignant: [
        { label: 'Dashboard',        icon: LayoutDashboard, path: '/enseignant/dashboard' },
        { label: 'Mes voyages',      icon: MapPin,          path: '/enseignant/voyages-etudes' },
        { label: 'Réserver navette', icon: Bus,             path: '/enseignant/reserver' },
    ],
    drh: [
        { label: 'Dashboard',      icon: LayoutDashboard, path: '/drh/dashboard' },
        { label: 'En attente',     icon: Clock,           path: '/drh/ordres?statut=en_attente' },
        { label: 'Approuvés',      icon: CheckCircle,     path: '/drh/ordres?statut=approuve' },
        { label: 'Rejetés',        icon: XCircle,         path: '/drh/ordres?statut=rejete' },
    ],
    sg_drh: [
        { label: 'Dashboard',       icon: LayoutDashboard, path: '/sg-drh/dashboard' },
        { label: 'Ordres à signer', icon: FileText,        path: '/sg-drh/ordres' },
    ],
    chauffeur: [
        { label: 'Dashboard',   icon: LayoutDashboard, path: '/chauffeur/dashboard' },
        { label: 'Mes trajets', icon: Bus,             path: '/chauffeur/trajets' },
    ],
    sg_vr: [
        { label: 'Dashboard',      icon: LayoutDashboard, path: '/sg-vr/dashboard?tab=accueil' },
        { label: 'Récapitulatifs', icon: FileText,        path: '/sg-vr/recapitulatifs' },
        { label: 'Graphiques',     icon: BarChart2,       path: '/sg-vr/dashboard?tab=graphiques' },
    ],
   vice_recteur: [
    { label: 'Dashboard',        icon: LayoutDashboard, path: '/vice-recteur/dashboard' },
    { label: "Voyages d'etudes", icon: MapPin,          path: '/vice-recteur/voyages-etudes' },
],
    chef_departement: [
        { label: 'Dashboard',               icon: LayoutDashboard, path: '/chef-departement/dashboard' },
        { label: 'Nouvelles listes',        icon: Bell,            path: '/chef-departement/dashboard?tab=listes' },
        { label: 'Justificatifs reçus',     icon: FileText,        path: '/chef-departement/dashboard?tab=justificatifs' },
        { label: "Demandes d'autorisation", icon: CheckCircle,     path: '/chef-departement/dashboard?tab=autorisations' },
    ],
    directeur_ufr: [
        { label: 'Dashboard',           icon: LayoutDashboard, path: '/directeur-ufr/dashboard' },
        { label: 'En attente',          icon: FileText,        path: '/directeur-ufr/dashboard?tab=attente' },
        { label: 'Transmis au Recteur', icon: CheckCircle,     path: '/directeur-ufr/dashboard?tab=transmis' },
    ],
    recteur: [
        { label: 'Dashboard',               icon: LayoutDashboard, path: '/recteur/dashboard' },
        { label: 'Arretes à signer',        icon: FileText,        path: '/recteur/dashboard?tab=arretes' },
        { label: 'Autorisations de sortie', icon: CheckCircle,     path: '/recteur/dashboard?tab=autorisations' },
    ],
    commission: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/commission/dashboard' },
    ],
    usager: [
    { label: 'Dashboard',        icon: LayoutDashboard, path: '/usager/dashboard' },
    { label: 'Réserver',         icon: Bus,             path: '/usager/reserver' },
    { label: 'Scanner le bus',   icon: Camera,          path: '/usager/scanner' },
    { label: 'Mes réservations', icon: Calendar,        path: '/usager/dashboard?tab=reservations' },
{ label: 'Notifications',    icon: Bell,             path: '/usager/dashboard?tab=notifications' },
],
}

const roleLabels = {
    admin:            'Administrateur',
    ddl:              'DDL',
    enseignant:       'Enseignant',
    drh:              'DRH',
    sg_drh:           'SG - DRH',
    chauffeur:        'Chauffeur',
    sg_vr:            'SG - Vice-Recteur',
    vice_recteur:     'Vice-Recteur',
    chef_departement: 'Chef de Département',
    directeur_ufr:    'Directeur UFR',
    recteur:          'Recteur',
    commission:       'Commission',
    usager:           'Usager',
}
const getRoleLabel = (user) => {
    if (!user) return ''

    switch (user.role) {
        case 'enseignant':
            if (user.statut === 'permanent')     return 'Enseignant Permanent'
            if (user.statut === 'non_permanent') return 'Enseignant Non Permanent'
            if (user.statut === 'contractuel')   return 'Enseignant Contractuel'
            return 'Enseignant'

        case 'usager':
            if (user.type_profil === 'PATS')      return 'Personnel PATS'
            if (user.type_profil === 'ATR')        return 'Agent Temporaire (ATR)'
            if (user.type_profil === 'Vacataire')  return 'Vacataire'
            if (user.statut === 'permanent')       return 'Personnel Permanent'
            if (user.statut === 'non_permanent')   return 'Personnel Non Permanent'
            if (user.statut === 'contractuel')     return 'Personnel Contractuel'
            if (user.statut === 'vacataire')       return 'Vacataire'
            return 'Usager'

        case 'chauffeur':        return 'Chauffeur'
        case 'drh':              return 'Directeur RH'
        case 'sg_drh':           return 'SG - DRH'
        case 'sg_vr':            return 'SG - Vice Rectorat'
        case 'ddl':              return 'DDL'
        case 'vice_recteur':     return 'Vice-Recteur'
        case 'recteur':          return 'Recteur'
        case 'chef_departement': return 'Chef de Département'
        case 'directeur_ufr':    return 'Directeur UFR'
        case 'commission':       return 'Commission'
        case 'admin':            return 'Administrateur'
        default:                 return user.role || ''
    }
}

const notifNavigation = {
    ddl:              '/ddl/navettes',
    chauffeur:        '/chauffeur/trajets',
    drh:              '/drh/ordres',
    sg_drh:           '/sg-drh/ordres',
    vice_recteur:     '/vice-recteur/voyages-etudes',
    chef_departement: '/chef-departement/dashboard',
    directeur_ufr:    '/directeur-ufr/dashboard',
    recteur:          '/recteur/dashboard',
    commission:       '/commission/dashboard',
    enseignant:       '/enseignant/voyages-etudes',
    usager:           '/usager/dashboard',
}

function AvatarImg({ avatar, prenom, nom, size = 'md', className = '' }) {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-16 h-16 text-xl' }
    const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`
    if (avatar) {
        return <img src={avatar} alt="avatar" className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`} />
    }
    return (
        <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-white/20 text-white ${className}`}>
            {initials}
        </div>
    )
}

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const navigate   = useNavigate()
    const location   = useLocation()
    const fileInputRef = useRef(null)

    // Sur mobile, sidebar fermée par défaut
    const isMobile = () => window.innerWidth < 768
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile())
    const [avatar, setAvatar]           = useState(null)
    const [profileOpen, setProfileOpen] = useState(false)
    const [uploading, setUploading]     = useState(false)
    const [uploadMsg, setUploadMsg]     = useState('')
    const [badges, setBadges]           = useState({
        drhOrdres: 0, sgDrhOrdres: 0,
        viceRecteurVoyages: 0, viceRecteurRapports: 0,
        enAttente: 0, mesDemandes: 0, mesDemandesRejetees: 0,
    })
    const [notifOpen, setNotifOpen]         = useState(false)
    const [notifications, setNotifications] = useState([])

    const totalNotifs = notifications.filter(n => !n.lu).length
    const totalLues   = notifications.filter(n => n.lu).length

    // Fermer sidebar sur mobile quand on change de page
    useEffect(() => {
        if (isMobile()) setSidebarOpen(false)
    }, [location.pathname])

    // Gérer le resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setSidebarOpen(true)
            else setSidebarOpen(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await api.get('/profile/me')
                if (res.data.avatar) setAvatar(res.data.avatar)
            } catch {}
        }
        fetchMe()
    }, [])

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await api.get('/notifications')
                setNotifications(res.data)
            } catch {}
        }
        fetchNotifs()
        const interval = setInterval(fetchNotifs, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchSidebar = async () => {
            try {
                const res = await api.get('/notifications/sidebar')
                setBadges(prev => ({ ...prev, ...res.data }))
            } catch {}
        }
        fetchSidebar()
        const interval = setInterval(fetchSidebar, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifOpen && !e.target.closest('.notif-dropdown')) setNotifOpen(false)
            if (profileOpen && !e.target.closest('.profile-dropdown')) setProfileOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [notifOpen, profileOpen])

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        setUploadMsg('')
        try {
            const formData = new FormData()
            formData.append('avatar', file)
            const res = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setAvatar(res.data.avatar)
            setUploadMsg('Photo mise à jour !')
        } catch {
            setUploadMsg("Erreur lors de l'upload.")
        } finally {
            setUploading(false)
        }
    }
    const supprimerAvatar = async () => {
    if (!window.confirm('Supprimer votre photo de profil ?')) return
    try {
        await api.delete('/profile/avatar')
        setAvatar(null)
        setUploadMsg('Photo supprimée avec succès')
        setTimeout(() => setUploadMsg(''), 3000)
    } catch {
        setUploadMsg('Erreur lors de la suppression')
        setTimeout(() => setUploadMsg(''), 3000)
    }
}



    const marquerLu = async (id) => {
        try {
            await api.patch(`/notifications/${id}/lu`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
        } catch {}
    }

    const marquerToutLu = async () => {
        try {
            await api.patch('/notifications/lu-toutes')
            setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
        } catch {}
    }

    const supprimerNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch {}
    }

    const supprimerLues = async () => {
        const lues = notifications.filter(n => n.lu)
        for (const n of lues) {
            try { await api.delete(`/notifications/${n.id}`) } catch {}
        }
        setNotifications(prev => prev.filter(n => !n.lu))
    }

    const supprimerToutes = async () => {
        try {
            await api.delete('/notifications/toutes')
            setNotifications([])
        } catch {}
    }

    const handleNotifClick = (notif) => {
        if (!notif.lu) marquerLu(notif.id)
        setNotifOpen(false)
        const dest = notifNavigation[user?.role]
        if (dest) navigate(dest)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const menu = menuParRole[user?.role] || []
    const mobile = isMobile()

    return (
        <div className="min-h-screen flex bg-gray-100 relative">

            {/* Overlay mobile — fond sombre derrière la sidebar */}
            {sidebarOpen && mobile && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                bg-blue-900 text-white flex flex-col transition-all duration-300 min-h-screen z-40
                ${mobile
                    ? `fixed top-0 left-0 h-full w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : `relative ${sidebarOpen ? 'w-64' : 'w-16'}`
                }
            `}>

                {/* Logo */}
                <div className="flex items-center gap-3 p-4 border-b border-blue-800">
                    <div className="bg-white/20 p-2 rounded-xl flex-shrink-0">
                        <Bus size={20} className="text-white" />
                    </div>
                    {sidebarOpen && <span className="font-bold text-sm">UADB Mobilité</span>}
                </div>

                {/* Menu */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {menu.map((item) => {
                        const Icon = item.icon
                        const isActive = (location.pathname + location.search) === item.path
                        return (
                            <Link key={item.path} to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    isActive ? 'bg-white text-blue-900 font-semibold' : 'text-blue-200 hover:bg-blue-800'
                                }`}
                            >
                                <Icon size={18} className="flex-shrink-0" />
                                {sidebarOpen && (
                                    <>
                                        <span className="text-sm flex-1">{item.label}</span>
                                        {item.path === '/drh/ordres' && badges.drhOrdres > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{badges.drhOrdres}</span>
                                        )}
                                        {item.path === '/sg-drh/ordres' && badges.sgDrhOrdres > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{badges.sgDrhOrdres}</span>
                                        )}
                                        {item.path === '/vice-recteur/voyages' && badges.viceRecteurVoyages > 0 && (
                                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{badges.viceRecteurVoyages}</span>
                                        )}
                                        {item.path === '/vice-recteur/rapports' && badges.viceRecteurRapports > 0 && (
                                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{badges.viceRecteurRapports}</span>
                                        )}
                                        {item.path === '/chauffeur/trajets' && badges.enAttente > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{badges.enAttente}</span>
                                        )}
                                        {item.path === '/ddl/navettes' && (badges.mesDemandes + badges.mesDemandesRejetees) > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{badges.mesDemandes + badges.mesDemandesRejetees}</span>
                                        )}
                                        {isActive && <ChevronRight size={14} className="ml-auto" />}
                                    </>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Suppression notifs bas sidebar */}
                {sidebarOpen && notifications.length > 0 && (
                    <div className="px-3 pb-2 space-y-1">
                        {totalLues > 0 && (
                            <button onClick={supprimerLues}
                                className="w-full flex items-center gap-2 text-blue-300 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-blue-800 transition">
                                <Trash2 size={13} /> Supprimer lues ({totalLues})
                            </button>
                        )}
                        <button onClick={supprimerToutes}
                            className="w-full flex items-center gap-2 text-blue-300 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-blue-800 transition">
                            <Trash2 size={13} /> Supprimer tout ({notifications.length})
                        </button>
                    </div>
                )}

                {/* User info sidebar */}
                {sidebarOpen && (
                    <div className="p-4 border-t border-blue-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <AvatarImg avatar={avatar} prenom={user?.prenom} nom={user?.nom} size="md" />
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <Camera size={12} className="text-white" />
                                </div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
                                <p className="text-xs text-blue-300">{getRoleLabel(user)}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-2 text-blue-300 hover:text-white text-sm px-2 py-2 rounded-lg hover:bg-blue-800 transition">
                            <LogOut size={16} /> Se déconnecter
                        </button>
                    </div>
                )}
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Topbar */}
                <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
                        {sidebarOpen && !mobile ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-2 md:gap-4">

                        {/* Cloche notifications */}
                        <div className="relative notif-dropdown">
                            <button onClick={() => setNotifOpen(!notifOpen)}
                                className="relative text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition">
                                <Bell size={20} />
                                {totalNotifs > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                                        {totalNotifs > 9 ? '9+' : totalNotifs}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                                        <h3 className="font-semibold text-sm text-gray-800">
                                            Notifications {totalNotifs > 0 && <span className="text-red-500">({totalNotifs})</span>}
                                        </h3>
                                        <div className="flex gap-2">
                                            {totalNotifs > 0 && (
                                                <button onClick={marquerToutLu}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                    <CheckCheck size={12} /> Tout lire
                                                </button>
                                            )}
                                            {totalLues > 0 && (
                                                <button onClick={supprimerLues}
                                                    className="text-xs text-orange-600 hover:text-orange-800 font-medium">
                                                    Effacer lues
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button onClick={supprimerToutes}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium">
                                                    Tout effacer
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400">
                                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Aucune notification</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id}
                                                    onClick={() => handleNotifClick(notif)}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${!notif.lu ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
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
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                            {!notif.lu && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                                            <button
                                                                onClick={e => { e.stopPropagation(); supprimerNotification(notif.id) }}
                                                                className="text-gray-300 hover:text-red-500 transition">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Avatar topbar */}
                        <div className="relative profile-dropdown">
                            <button onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded-lg transition">
                                {avatar ? (
                                    <img src={avatar} alt="avatar"
                                        className="w-8 h-8 rounded-full object-cover border-2 border-blue-200" />
                                ) : (
                                    <div className="bg-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {user?.prenom?.[0]}{user?.nom?.[0]}
                                    </div>
                                )}
                                {/* Nom caché sur très petit écran */}
                                <span className="hidden sm:block text-sm font-medium text-gray-700">
                                    {user?.prenom} {user?.nom}
                                </span>
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                    <div className="bg-blue-900 p-5 flex flex-col items-center gap-3">
                                        <div className="relative group">
                                            {avatar ? (
                                                <img src={avatar} alt="avatar"
                                                    className="w-16 h-16 rounded-full object-cover border-4 border-white/30" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/30">
                                                    {user?.prenom?.[0]}{user?.nom?.[0]}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                <Camera size={16} className="text-white" />
                                            </button>
                                        </div>
                                        <div className="text-center">
    <p className="text-white font-semibold">{user?.prenom} {user?.nom}</p>
    <p className="text-blue-200 text-xs mt-0.5">{getRoleLabel(user)}</p>
    {user?.ufr && (
        <p className="text-blue-300 text-xs mt-0.5">{user.ufr}</p>
    )}
    {user?.matricule && (
        <p className="text-blue-300 text-xs mt-0.5">Mat. {user.matricule}</p>
    )}
    {user?.email && (
        <p className="text-blue-300 text-xs mt-0.5">{user.email}</p>
    )}
</div>
                                    </div>

                                   <div className="p-3 space-y-1">
    <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition">
        <Camera size={16} className="text-blue-600" />
        {uploading ? 'Envoi en cours...' : 'Changer la photo de profil'}
    </button>


    {avatar && (
        <button
            onClick={supprimerAvatar}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-500 transition">
            <Trash2 size={16} className="text-red-400" />
            Supprimer la photo
        </button>
    )}

    {uploadMsg && (
        <p className={`text-xs px-3 py-1 rounded ${uploadMsg.includes('Erreur') ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
            {uploadMsg}
        </p>
    )}

    <div className="border-t border-gray-100 my-1" />

    <button onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-600 transition">
        <LogOut size={16} />
        Se déconnecter
    </button>
</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </div>

            {/* Input file caché */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
            />
        </div>
    )
}




