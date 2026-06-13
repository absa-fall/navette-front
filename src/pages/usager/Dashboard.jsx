import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Bus, QrCode, Calendar, LogOut, User, Bell, CheckCircle, AlertCircle, X, Clock, MapPin, Trash2 } from 'lucide-react'
import QRCode from 'react-qr-code'

export default function UsagerDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [reservations, setReservations] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)
    const [loadingReservations, setLoadingReservations] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [selected, setSelected] = useState([])
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)

    useEffect(() => {
        fetchNotifications()
        fetchReservations()
        const interval = setInterval(() => {
            fetchNotifications()
            fetchReservations()
        }, 15000)
        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications')
            setNotifications(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingNotifs(false)
        }
    }

    const fetchReservations = async () => {
        try {
            const res = await api.get('/mes-reservations')
            setReservations(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingReservations(false)
        }
    }

    const marquerLue = async (id) => {
        try {
            await api.patch(`/notifications/${id}/lu`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
        } catch (err) {
            console.error(err)
        }
    }

    const supprimerNotif = async (id) => {
        try {
            await api.delete(`/notifications/${id}`)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const supprimerReservation = async (id) => {
        if (!confirm('Voulez-vous supprimer cette réservation ?')) return
        setDeleteLoading(id)
        try {
            await api.delete(`/mes-reservations/${id}`)
            setReservations(prev => prev.filter(r => r.id !== id))
            setSelected(prev => prev.filter(i => i !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression')
        } finally {
            setDeleteLoading(null)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const supprimerSelection = async () => {
        if (selected.length === 0) return
        if (!confirm(`Supprimer ${selected.length} réservation(s) ?`)) return
        setDeleteSelectionLoading(true)
        try {
            await Promise.all(selected.map(id => api.delete(`/mes-reservations/${id}`)))
            setReservations(prev => prev.filter(r => !selected.includes(r.id)))
            setSelected([])
        } catch (err) {
            alert('Erreur lors de la suppression')
        } finally {
            setDeleteSelectionLoading(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const nonLues = notifications.filter(n => !n.lu).length
    const toutSelectionne = reservations.length > 0 && reservations.every(r => selected.includes(r.id))

    const toggleSelectAll = () => {
        if (toutSelectionne) setSelected([])
        else setSelected(reservations.map(r => r.id))
    }

    const getStatutBadge = (statut) => {
        switch (statut) {
            case 'terminee': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminée</span>
            case 'en_cours': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En cours</span>
            case 'confirmee': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Confirmée</span>
            case 'refusee': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Refusée</span>
            default: return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">En attente</span>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bus size={22} />
                        <span className="font-bold text-lg">UADB Mobilité</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell size={20} />
                            {nonLues > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {nonLues}
                                </span>
                            )}
                        </div>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition">
                            <LogOut size={14} />
                            Déconnexion
                        </button>
                    </div>
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
                            <p className="font-bold text-gray-800 text-lg">{user?.prenom} {user?.nom}</p>
                            <p className="text-sm text-gray-500">{user?.ufr}</p>
                            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {user?.statut} · {user?.type_profil}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {notifications.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Bell size={18} className="text-blue-700" />
                                Notifications
                                {nonLues > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{nonLues}</span>
                                )}
                            </h2>
                            {nonLues > 0 && (
                                <button onClick={async () => {
                                    await api.patch('/notifications/lu-toutes')
                                    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
                                }} className="text-xs text-blue-600 hover:underline">
                                    Tout marquer lu
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {notifications.map(notif => (
                                <div key={notif.id}
                                    className={`rounded-xl p-4 flex items-start gap-3 transition ${notif.lu ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}>
                                    <div className="mt-0.5">
                                        {notif.type === 'reservation_confirmee'
                                            ? <CheckCircle size={18} className="text-green-600" />
                                            : <AlertCircle size={18} className="text-red-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${notif.lu ? 'text-gray-600' : 'text-gray-800'}`}>{notif.titre}</p>
                                        <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {!notif.lu && (
                                            <button onClick={() => marquerLue(notif.id)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                                                Marquer lu
                                            </button>
                                        )}
                                        <button onClick={() => supprimerNotif(notif.id)} className="text-gray-400 hover:text-red-500 transition">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* QR Code personnel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center justify-center gap-2">
                        <QrCode size={20} className="text-blue-700" />
                        Mon QR Code
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">Montrez ce code au chauffeur si vous n'avez pas de connexion</p>
                    {user?.qr_code ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                    <QRCode value={user.qr_code} size={180} level="H" />
                                </div>
                            </div>
                            <p className="font-mono text-sm font-bold text-gray-600 tracking-widest">{user.qr_code}</p>
                        </>
                    ) : (
                        <div className="py-8 text-gray-400 text-sm">QR code non disponible</div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => navigate('/usager/reserver')}
                        className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-5 text-left transition shadow-sm">
                        <Calendar size={24} className="mb-3" />
                        <p className="font-semibold text-sm">Réserver</p>
                        <p className="text-xs text-blue-200 mt-1">Nouvelle réservation</p>
                    </button>
                    <button onClick={() => navigate('/usager/scanner')}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-5 text-left transition shadow-sm">
                        <QrCode size={24} className="mb-3" />
                        <p className="font-semibold text-sm">Scanner le bus</p>
                        <p className="text-xs text-green-200 mt-1">Valider ma montée</p>
                    </button>
                </div>

                {/* Mes réservations */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-700" />
                            Mes réservations
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {reservations.length}
                            </span>
                        </h2>
                    </div>

                    {loadingReservations ? (
                        <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Aucune réservation pour le moment</p>
                        </div>
                    ) : (
                        <>
                            {/* Barre selection */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-gray-100">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={toutSelectionne} onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                    Tout sélectionner
                                </label>
                                {selected.length > 0 && (
                                    <button onClick={supprimerSelection} disabled={deleteSelectionLoading}
                                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50">
                                        {deleteSelectionLoading
                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <Trash2 size={12} />}
                                        Supprimer ({selected.length})
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {reservations.map(r => (
                                    <div key={r.id}
                                        className={`border rounded-xl p-4 transition ${selected.includes(r.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {/* Checkbox */}
                                                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                                                    <MapPin size={14} className="text-blue-500" />
                                                    {r.ville_depart} → {r.ville_arrivee}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatutBadge(r.statut)}
                                                {/* Bouton supprimer individuel */}
                                                <button onClick={() => supprimerReservation(r.id)} disabled={deleteLoading === r.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                    {deleteLoading === r.id
                                                        ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                        : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 ml-6">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(r.date_reservation).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {r.heure_reservation}
                                            </div>
                                            {r.montant_retenue > 0 && (
                                                <span className="text-blue-600 font-semibold">
                                                    {Number(r.montant_retenue).toLocaleString()} FCFA
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}