import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Bus, MapPin, FileText, Users, LayoutDashboard, LogOut,
    Menu, X, ChevronRight, ChevronDown, Bell, Trash2, CheckCheck, BarChart2, Camera, 
    CheckCircle, Clock, XCircle, PenLine, Calendar, Truck, Lock, Settings, User, Plane,
} from 'lucide-react'
const menuParRole = {
    admin: [
    { label: 'Dashboard',       icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Utilisateurs',    icon: Users,           path: '/admin/utilisateurs' },
    { label: 'Procès-verbaux',  icon: FileText,        path: '/admin/proces-verbaux' },
    { label: 'Paramètres',      icon: Settings,        path: '/parametres' },
],
    ddl: [
        { label: 'Dashboard',          icon: LayoutDashboard, path: '/ddl/dashboard' },
        { label: 'Mes navettes',       icon: '/im.png',       path: '/ddl/navettes' },
        { label: 'En attente',         icon: Clock,           path: '/ddl/en-attente' },
        { label: 'Demandes rejetées',  icon: XCircle,         path: '/ddl/demandes-rejetees' },
        { label: 'Véhicules',          icon: Truck,           path: '/ddl/vehicules' },
        { label: 'Chauffeurs',         icon: Users,           path: '/ddl/chauffeurs' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
    enseignant: [
    { label: 'Dashboard',        icon: LayoutDashboard, path: '/enseignant/dashboard' },
    { label: 'Mes voyages',      icon: '/avion-voyage.png', path: '/enseignant/voyages-etudes' },
    { label: 'Mon rapport',      icon: PenLine,          path: '/enseignant/rapports' },
    { label: 'Réserver navette', icon: '/im.png',           path: '/enseignant/reserver' },
    { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
],
    drh: [
        { label: 'Dashboard',      icon: LayoutDashboard, path: '/drh/dashboard' },
        { label: 'En attente',     icon: Clock,           path: '/drh/ordres?statut=en_attente' },
        { label: 'Approuvés',      icon: CheckCircle,     path: '/drh/ordres?statut=approuve' },
        { label: 'Rejetés',        icon: XCircle,         path: '/drh/ordres?statut=rejete' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
    sg_drh: [
        { label: 'Dashboard',       icon: LayoutDashboard, path: '/sg-drh/dashboard' },
        { label: 'Ordres à signer', icon: FileText,        path: '/sg-drh/ordres' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
    chauffeur: [
        { label: 'Dashboard',   icon: LayoutDashboard, path: '/chauffeur/dashboard' },
        { label: 'Mes trajets', icon: '/im.png',       path: '/chauffeur/trajets' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
    sg_vr: [
        { label: 'Dashboard',      icon: LayoutDashboard, path: '/sg-vr/dashboard?tab=accueil' },
        { label: 'Récapitulatifs', icon: FileText,        path: '/sg-vr/recapitulatifs' },
        { label: 'Graphiques',     icon: BarChart2,       path: '/sg-vr/dashboard?tab=graphiques' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
 vice_recteur: [
    { label: 'Dashboard',        icon: LayoutDashboard, path: '/vice-recteur/dashboard' },
    { label: "Voyages d'etudes", icon: '/avion-voyage.png', path: '/vice-recteur/voyages-etudes' },
    { label: 'Vue Commission',   icon: Users,           path: '/commission/dashboard' },
    { label: 'Procès-verbal',    icon: FileText,        path: '/vice-recteur/proces-verbal' },
    { label: 'Paramètres',       icon: Settings,        path: '/parametres' },
],
    chef_departement: [
        { label: 'Dashboard',               icon: LayoutDashboard, path: '/chef-departement/dashboard' },
        { label: 'Nouvelles listes',        icon: Bell,            path: '/chef-departement/dashboard?tab=listes' },
        { label: "Demandes d'autorisation", icon: CheckCircle,     path: '/chef-departement/dashboard?tab=autorisations' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
    directeur_ufr: [
        { label: 'Dashboard',           icon: LayoutDashboard, path: '/directeur-ufr/dashboard' },
        { label: 'En attente',          icon: FileText,        path: '/directeur-ufr/dashboard?tab=attente' },
        { label: 'Transmis au Recteur', icon: CheckCircle,     path: '/directeur-ufr/dashboard?tab=transmis' },
         { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
    ],
    recteur: [
    { label: 'Dashboard',               icon: LayoutDashboard, path: '/recteur/dashboard' },
    { label: 'Arretes à signer',        icon: FileText,        path: '/recteur/dashboard?tab=arretes' },
    { label: 'Autorisations de sortie', icon: CheckCircle,     path: '/recteur/dashboard?tab=autorisations' },
    { label: 'Procès-verbal',           icon: FileText,        path: '/recteur/proces-verbal' },
    { label: 'Paramètres',              icon: Settings,        path: '/parametres' },
],
    commission: [
    { label: 'Dashboard',      icon: LayoutDashboard, path: '/commission/dashboard' },
    { label: 'Procès-verbal',  icon: FileText,        path: '/commission/proces-verbal' },
    { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
],
    usager: [
    { label: 'Dashboard',        icon: LayoutDashboard, path: '/usager/dashboard' },
    { label: 'Réserver',         icon: '/im.png',       path: '/usager/reserver' },
    { label: 'Scanner le bus',   icon: Camera,          path: '/usager/scanner' },
    { label: 'Mes réservations', icon: Calendar,        path: '/usager/dashboard?tab=reservations' },
     { label: 'Paramètres',     icon: Settings,        path: '/parametres' },
{ label: 'Notifications',    icon: Bell,             path: '/usager/dashboard?tab=notifications' },
],
}

const rolesVoyage = ['vice_recteur', 'enseignant', 'commission']
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
export const getRoleLabel = (user) => {
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
        case 'sg_vr':            return 'SG - Vice Recteur'
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
    sg_vr:            '/sg-vr/dashboard',
    vice_recteur:     '/vice-recteur/voyages-etudes',
    chef_departement: '/chef-departement/dashboard',
    directeur_ufr:    '/directeur-ufr/dashboard',
    recteur:          '/recteur/dashboard',
    commission:       '/commission/dashboard',
    enseignant:       '/enseignant/voyages-etudes',
    usager:           '/usager/dashboard',
}
function AvatarImg({ avatar, prenom, nom, size = 'md', className = '' }) {
    const sizes = { sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-16 h-16' }
    const iconSizes = { sm: 14, md: 16, lg: 28 }
    if (avatar) {
        return <img src={avatar} alt="avatar" className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`} />
    }
    return (
        <div className={`${sizes[size]} rounded-full flex items-center justify-center flex-shrink-0 bg-white/20 text-white ${className}`}>
            <User size={iconSizes[size]} />
        </div>
    )
}

export default function Layout({ children, title, subtitle }) {
    const { user, logout } = useAuth()
    const navigate   = useNavigate()
    const location   = useLocation()
    const fileInputRef = useRef(null)

    const isMobile = () => window.innerWidth < 768
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile())
    const [avatar, setAvatar]           = useState(null)
    const [profileOpen, setProfileOpen] = useState(false)
    const [uploading, setUploading]     = useState(false)
    const [uploadMsg, setUploadMsg]     = useState('')
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
const [passwordLoading, setPasswordLoading] = useState(false)
const [passwordMsg, setPasswordMsg] = useState('')
const [passwordError, setPasswordError] = useState('')
    const [badges, setBadges]           = useState({
        drhOrdres: 0, sgDrhOrdres: 0,
        viceRecteurVoyages: 0, viceRecteurRapports: 0,
        enAttente: 0, mesDemandes: 0, mesDemandesRejetees: 0,
    })
    const [notifOpen, setNotifOpen]         = useState(false)
    const [notifications, setNotifications] = useState([])
const [selectedNotif, setSelectedNotif] = useState(null)
    const totalNotifs = notifications.filter(n => !n.lu).length
    const totalLues   = notifications.filter(n => n.lu).length

    const rolesSansImage = ['admin', 'chef_departement', 'recteur', 'directeur_ufr']
    const isVoyageRole = rolesVoyage.includes(user?.role)
   const isVoyageIcone = [...rolesVoyage, 'chef_departement', 'recteur', 'directeur_ufr'].includes(user?.role)
    const sidebarBgImage = rolesSansImage.includes(user?.role) ? null : (isVoyageRole ? '/avion-voyage.png' : '/im.png')
    
    const sidebarBgPosition = isVoyageRole ? 'center 15%' : 'bottom'

    useEffect(() => {
        if (isMobile()) setSidebarOpen(false)
    }, [location.pathname])

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
const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMsg('')
    setPasswordError('')
    try {
        const res = await api.put('/profile/password', passwordForm)
        setPasswordMsg(res.data.message || 'Mot de passe modifié avec succès')
        setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
        setTimeout(() => {
            setPasswordModalOpen(false)
            setPasswordMsg('')
        }, 1500)
    } catch (err) {
        setPasswordError(err.response?.data?.message || 'Erreur lors du changement de mot de passe')
    } finally {
        setPasswordLoading(false)
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
    setSelectedNotif(notif)   
}

const allerVersPage = () => {
    const dest = notifNavigation[user?.role]
    setSelectedNotif(null)
    if (dest) navigate(dest)
}

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const menu = menuParRole[user?.role] || []
    const mobile = isMobile()

    return (
        <div className="min-h-screen flex bg-slate-100">

            {sidebarOpen && mobile && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                bg-blue-950 text-white flex flex-col relative overflow-hidden
                transition-all duration-300 ease-in-out min-h-screen z-40 shadow-2xl shadow-blue-950/20
                ${mobile
                    ? `fixed top-0 left-0 h-full w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : `relative ${sidebarOpen ? 'w-64' : 'w-[72px]'}`
                }
            `}>
                {/* Fond image — visible seulement si un rôle a une image associée
                    (bus ou avion). L'admin n'a pas d'image de fond.
                    Utilise une vraie balise <img> (et non un background-image CSS)
                    pour éviter qu'elle disparaisse silencieusement lors des re-renders
                    déclenchés par le polling (notifications/badges toutes les 5-10s). */}
                {sidebarBgImage && (
                    <img
                        key={sidebarBgImage}
                        src={sidebarBgImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        style={{ objectPosition: sidebarBgPosition }}
                        onError={(e) => {
                            console.error('Image de fond sidebar introuvable:', sidebarBgImage)
                        }}
                    />
                )}

                {/* Dégradé par-dessus pour garder le texte lisible */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-blue-950/90 to-blue-950/80 z-0" />

                {/* Barre entête de la sidebar */}
               <div className={`relative z-10 flex items-center gap-3 h-[72px] bg-gradient-to-br from-blue-900 to-blue-950 border-b border-white/10 ${sidebarOpen ? 'px-5' : 'px-4 justify-center'}`}>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-xl flex-shrink-0 shadow-lg shadow-blue-900/40 animate-pulse-glow">
                        {isVoyageIcone ? (
                            <Plane size={20} className="text-white animate-fly" />
                        ) : (
                            <Bus size={20} className="text-white animate-drive" />
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col leading-tight">
                            <span className="font-serif font-bold text-[15px] tracking-tight text-white">UADB Mobilité</span>
                            <span className="text-[11px] text-blue-300/80 font-medium">Université Alioune Diop de Bambey</span>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
                </div>

                <nav className="relative z-10 flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {menu.map((item) => {
                        const isImageIcon = typeof item.icon === 'string'
                        const Icon = !isImageIcon ? item.icon : null
                        const isActive = (location.pathname + location.search) === item.path
                        return (
                            <Link key={item.path} to={item.path}
                                className={`group relative flex items-center gap-3 py-3 transition-all duration-200 ${
                                    isActive
                                        ? 'bg-blue-800 text-white font-semibold rounded-l-xl ml-3 pl-3 pr-3'
                                        : 'text-blue-200/80 hover:bg-white/10 hover:text-white rounded-xl mx-3 px-3'
                                } ${!sidebarOpen ? 'justify-center' : ''}`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-blue-400" />
                                )}

                               {isImageIcon ? (
                                    <img
                                        src={item.icon}
                                        alt=""
                                        className={`w-[18px] h-[18px] flex-shrink-0 object-contain transition-transform duration-200 ${
                                            isActive ? '' : 'group-hover:scale-110 opacity-80 group-hover:opacity-100'
                                        } ${item.icon === '/avion-voyage.png' ? 'animate-fly' : ''}`}
                                    />
                                ) : (
                                    <Icon size={18} className={`flex-shrink-0 transition-transform duration-200 ${
                                        isActive ? 'text-white' : 'group-hover:scale-110'
                                    }`} />
                                )}

                                {sidebarOpen && (
                                    <>
                                        <span className="text-sm flex-1">{item.label}</span>
                                        {item.path === '/drh/ordres' && badges.drhOrdres > 0 && (
                                            <span className="bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm shadow-red-900/30">{badges.drhOrdres}</span>
                                        )}
                                        {item.path === '/sg-drh/ordres' && badges.sgDrhOrdres > 0 && (
                                            <span className="bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm shadow-red-900/30">{badges.sgDrhOrdres}</span>
                                        )}
                                        {item.path === '/vice-recteur/voyages' && badges.viceRecteurVoyages > 0 && (
                                            <span className="bg-orange-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm shadow-orange-900/30">{badges.viceRecteurVoyages}</span>
                                        )}
                                        {item.path === '/vice-recteur/rapports' && badges.viceRecteurRapports > 0 && (
                                            <span className="bg-emerald-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm shadow-emerald-900/30">{badges.viceRecteurRapports}</span>
                                        )}
                                        {item.path === '/chauffeur/trajets' && badges.enAttente > 0 && (
                                            <span className="bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm shadow-red-900/30">{badges.enAttente}</span>
                                        )}
                                        {item.path === '/ddl/navettes' && (badges.mesDemandes + badges.mesDemandesRejetees) > 0 && (
                                            <span className="bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm shadow-red-900/30">{badges.mesDemandes + badges.mesDemandesRejetees}</span>
                                        )}
                                        {isActive && <ChevronRight size={14} className="ml-auto" />}
                                    </>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {sidebarOpen && notifications.length > 0 && (
                    <div className="relative z-10 px-3 pb-2 space-y-1">
                        {totalLues > 0 && (
                            <button onClick={supprimerLues}
                                className="w-full flex items-center gap-2 text-blue-200/70 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200">
                                <Trash2 size={13} /> Supprimer lues ({totalLues})
                            </button>
                        )}
                        <button onClick={supprimerToutes}
                            className="w-full flex items-center gap-2 text-blue-200/70 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200">
                            <Trash2 size={13} /> Supprimer tout ({notifications.length})
                        </button>
                    </div>
                )}

                {sidebarOpen && (
                    <div className="relative z-10 p-3 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-2 p-2 rounded-xl hover:bg-white/5 transition-colors duration-200">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <AvatarImg avatar={avatar} prenom={user?.prenom} nom={user?.nom} size="md" className="ring-2 ring-white/20" />
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                    <Camera size={12} className="text-white" />
                                </div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
                                <p className="text-xs text-blue-200/70 truncate">{getRoleLabel(user)}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-2 text-blue-200/70 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200">
                            <LogOut size={16} /> Se déconnecter
                        </button>
                    </div>
                )}
            </aside>

            <div className="flex-1 flex flex-col min-w-0">

                {/* Barre entête principale (header) */}
                <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-slate-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200">
                            {sidebarOpen && !mobile ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="hidden md:block h-6 w-px bg-slate-200" />
                       <div className="hidden md:flex flex-col leading-tight">
                            {title ? (
                                <>
                                    <span className="text-lg font-bold text-slate-800">{title}</span>
                                    {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
                                </>
                            ) : (
                                <>
                                    <span className="text-sm font-semibold text-blue-800">{getRoleLabel(user)}</span>
                                    <span className="text-xs text-purple-900">Bienvenue, {user?.prenom}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block relative flex-1 max-w-md mx-6">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3"></div>

                    <div className="flex items-center gap-1.5 md:gap-3">

                        <div className="relative notif-dropdown">
                            <button onClick={() => setNotifOpen(!notifOpen)}
                                className="relative text-slate-500 hover:text-blue-700 p-2.5 rounded-full hover:bg-blue-50 transition-colors duration-200">
                                <Bell size={20} />
                                {totalNotifs > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold ring-2 ring-white animate-pulse">
                                        {totalNotifs > 9 ? '9+' : totalNotifs}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
                                        <h3 className="font-semibold text-sm text-slate-800">
                                            Notifications {totalNotifs > 0 && <span className="text-red-500">({totalNotifs})</span>}
                                        </h3>
                                        <div className="flex gap-2">
                                            {totalNotifs > 0 && (
                                                <button onClick={marquerToutLu}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                                    <CheckCheck size={12} /> Tout lire
                                                </button>
                                            )}
                                            {totalLues > 0 && (
                                                <button onClick={supprimerLues}
                                                    className="text-xs text-orange-600 hover:text-orange-800 font-medium transition-colors">
                                                    Effacer lues
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button onClick={supprimerToutes}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors">
                                                    Tout effacer
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-slate-400">
                                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Aucune notification</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id}
                                                    onClick={() => handleNotifClick(notif)}
                                                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors duration-150 ${!notif.lu ? 'bg-blue-50/60 border-l-4 border-l-blue-500' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${!notif.lu ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                                            <Bell size={14} className={!notif.lu ? 'text-blue-600' : 'text-slate-400'} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 truncate">{notif.titre}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                            <p className="text-xs text-slate-400 mt-1">
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
                                                                className="text-slate-300 hover:text-red-500 transition-colors duration-150">
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

                        <div className="relative profile-dropdown">
                           <button onClick={() => setProfileOpen(!profileOpen)}
    className="flex items-center gap-1.5 hover:bg-blue-50 pl-1.5 pr-2 py-1.5 rounded-full transition-colors duration-200">
    {avatar ? (
        <img src={avatar} alt="avatar"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100" />
    ) : (
        <div className="bg-blue-600 w-9 h-9 rounded-full flex items-center justify-center text-white ring-2 ring-blue-100">
            <User size={16} />
        </div>
    )}
    <ChevronDown size={16} className="text-slate-400" />
</button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-5 flex flex-col items-center gap-3">
                                        <div className="relative group">
                                            {avatar ? (
                                                <img src={avatar} alt="avatar"
                                                    className="w-16 h-16 rounded-full object-cover border-4 border-white/30 shadow-lg" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white border-4 border-white/30 shadow-lg">
                                                    <User size={28} />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700 transition-colors duration-150">
        <Camera size={16} className="text-blue-600" />
        {uploading ? 'Envoi en cours...' : 'Changer la photo de profil'}
    </button>


    {avatar && (
        <button
            onClick={supprimerAvatar}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-500 transition-colors duration-150">
            <Trash2 size={16} className="text-red-400" />
            Supprimer la photo
        </button>
    )}
<button
    onClick={() => { setProfileOpen(false); setPasswordModalOpen(true) }}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700 transition-colors duration-150">
    <Lock size={16} className="text-blue-600" />
    Changer le mot de passe
</button>
    {uploadMsg && (
        <p className={`text-xs px-3 py-1.5 rounded-lg ${uploadMsg.includes('Erreur') ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
            {uploadMsg}
        </p>
    )}

    <div className="border-t border-slate-100 my-1" />

    <button onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-600 transition-colors duration-150">
        <LogOut size={16} />
        Se déconnecter
    </button>
</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </div>
{passwordModalOpen && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Changer le mot de passe</h2>
                <button onClick={() => { setPasswordModalOpen(false); setPasswordError(''); setPasswordMsg('') }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {passwordMsg && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                        {passwordMsg}
                    </div>
                )}
                {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                        {passwordError}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe actuel</label>
                    <input type="password" required
                        value={passwordForm.current_password}
                        onChange={e => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
                    <input type="password" required minLength={6}
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le nouveau mot de passe</label>
                    <input type="password" required minLength={6}
                        value={passwordForm.new_password_confirmation}
                        onChange={e => setPasswordForm(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setPasswordModalOpen(false)}
                        className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                        Annuler
                    </button>
                    <button type="submit" disabled={passwordLoading}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                        {passwordLoading
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : 'Modifier'}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
{selectedNotif && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">{selectedNotif.titre}</h2>
                <button onClick={() => setSelectedNotif(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedNotif.message}
                </p>
                <p className="text-xs text-gray-400">
                    {new Date(selectedNotif.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </p>

                <div className="flex gap-3 pt-2">
                    <button onClick={() => setSelectedNotif(null)}
                        className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                        Fermer
                    </button>
                    {notifNavigation[user?.role] && (
                        <button onClick={allerVersPage}
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                            Voir la page
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
)}
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