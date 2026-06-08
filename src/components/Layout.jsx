import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Bus, MapPin, FileText, Users, LayoutDashboard,
    LogOut, Menu, X, ChevronRight, Bell, CheckCircle
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
        { label: 'Validation', icon: CheckCircle, path: '/validation' },
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

    const menu = menuParRole[user?.role] || []

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
                                {sidebarOpen && <span className="text-sm">{item.label}</span>}
                                {sidebarOpen && isActive && <ChevronRight size={14} className="ml-auto" />}
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
                        <button className="relative text-gray-500 hover:text-gray-700">
                            <Bell size={20} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                                3
                            </span>
                        </button>
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