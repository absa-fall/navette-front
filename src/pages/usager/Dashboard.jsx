import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bus, QrCode, Calendar, LogOut, User } from 'lucide-react'
import QRCode from 'react-qr-code'

export default function UsagerDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [showQR, setShowQR] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bus size={22} />
                        <span className="font-bold text-lg">UADB Mobilité</span>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition">
                        <LogOut size={14} />
                        Déconnexion
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-6 space-y-6">
                {/* Profil */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={28} className="text-blue-700" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-lg">
                                {user?.prenom} {user?.nom}
                            </p>
                            <p className="text-sm text-gray-500">{user?.ufr}</p>
                            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {user?.statut} · {user?.type_profil}
                            </span>
                        </div>
                    </div>
                </div>

                {/* QR Code personnel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center justify-center gap-2">
                        <QrCode size={20} className="text-blue-700" />
                        Mon QR Code
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Montrez ce code au chauffeur si vous n'avez pas de connexion
                    </p>

                    {user?.qr_code ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                    <QRCode
                                        value={user.qr_code}
                                        size={180}
                                        level="H"
                                    />
                                </div>
                            </div>
                            <p className="font-mono text-sm font-bold text-gray-600 tracking-widest">
                                {user.qr_code}
                            </p>
                        </>
                    ) : (
                        <div className="py-8 text-gray-400 text-sm">
                            QR code non disponible
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/usager/reserver')}
                        className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-5 text-left transition shadow-sm"
                    >
                        <Calendar size={24} className="mb-3" />
                        <p className="font-semibold text-sm">Réserver</p>
                        <p className="text-xs text-blue-200 mt-1">Nouvelle réservation</p>
                    </button>

                    <button
                        onClick={() => navigate('/usager/scanner')}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-5 text-left transition shadow-sm"
                    >
                        <QrCode size={24} className="mb-3" />
                        <p className="font-semibold text-sm">Scanner le bus</p>
                        <p className="text-xs text-green-200 mt-1">Valider ma montée</p>
                    </button>
                </div>
            </div>
        </div>
    )
}