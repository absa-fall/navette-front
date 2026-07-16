import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProchaineNavette from '../../components/ProchaineNavette'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Bus, QrCode, Calendar, User, Bell, CheckCircle, AlertCircle, X, Clock, MapPin, Trash2, Download, Search } from 'lucide-react'
import QRCode from 'react-qr-code'

export default function UsagerDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [reservations, setReservations] = useState([])
    const [loadingNotifs, setLoadingNotifs] = useState(true)
    const [loadingReservations, setLoadingReservations] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [selected, setSelected] = useState([])
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)
    const [qrOuvert, setQrOuvert] = useState(null)
    const [exportLoading, setExportLoading] = useState(false)
    const [annulerLoading, setAnnulerLoading] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [notifOuvertes, setNotifOuvertes] = useState(false)
    const notifRef = useRef(null)

    const exporterPdf = async () => {
        setExportLoading(true)
        try {
            const res = await api.get('/mes-reservations/export-pdf', { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'mes-reservations.pdf')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            alert('Erreur lors du telechargement du PDF')
        } finally {
            setExportLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        fetchReservations()
        const interval = setInterval(() => {
            fetchNotifications()
            fetchReservations()
        }, 15000)
        return () => clearInterval(interval)
    }, [])

    // ✅ Fermer le menu notifications si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOuvertes(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const annulerReservation = async (id) => {
        if (!confirm('Confirmer l\'annulation ? Le chauffeur sera notifié.')) return
        setAnnulerLoading(id)
        try {
            await api.post(`/reservations/${id}/annuler`)
            setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: 'annulee' } : r))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'annulation')
        } finally {
            setAnnulerLoading(null)
        }
    }

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
            setReservations(Array.isArray(res.data.reservations) ? res.data.reservations : [])
        } catch (err) {
            console.error(err)
            setReservations([])
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
        if (!confirm('Voulez-vous supprimer cette reservation ?')) return
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
        if (!confirm(`Supprimer ${selected.length} reservation(s) ?`)) return
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

    const getStatutBadge = (statut) => {
        switch (statut) {
            case 'terminee': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminee</span>
            case 'en_cours': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En cours</span>
            case 'confirmee': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Confirmee</span>
            case 'refusee': return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Refusee</span>
            default: return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">En attente</span>
        }
    }

    const nonLues = notifications.filter(n => !n.lu).length

    const statutLabel = (statut) => {
        switch (statut) {
            case 'terminee': return 'Terminee'
            case 'en_cours': return 'En cours'
            case 'confirmee': return 'Confirmee'
            case 'refusee': return 'Refusee'
            case 'annulee': return 'Annulee'
            default: return 'En attente'
        }
    }

    const reservationsAffichees = reservations.filter(r =>
        searchQuery === '' ||
        r.ville_depart?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ville_arrivee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        statutLabel(r.statut).toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toutSelectionne = reservationsAffichees.length > 0 && reservationsAffichees.every(r => selected.includes(r.id))

    const toggleSelectAll = () => {
        if (toutSelectionne) setSelected([])
        else setSelected(reservationsAffichees.map(r => r.id))
    }

    return (
        <Layout>
            <div className="space-y-4">

                {/* Carte profil + cloche notifications */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                            {user?.prenom} {user?.nom}

                            {/* ✅ Cloche notifications, à côté du nom */}
                            <span className="relative" ref={notifRef}>
                                <button onClick={() => setNotifOuvertes(prev => !prev)}
                                    className="relative p-1 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                                    <Bell size={16} className="text-gray-500" />
                                    {nonLues > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full">
                                            {nonLues}
                                        </span>
                                    )}
                                </button>

                                {/* Menu déroulant notifications */}
                                {notifOuvertes && (
                                    <div className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-lg z-50 max-h-96 overflow-y-auto">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                <Bell size={15} className="text-blue-700" /> Notifications
                                            </h3>
                                            {nonLues > 0 && (
                                                <button onClick={async () => {
                                                    await api.patch('/notifications/lu-toutes')
                                                    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
                                                }} className="text-xs text-blue-600 hover:underline">
                                                    Tout marquer lu
                                                </button>
                                            )}
                                        </div>

                                        {notifications.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400 text-xs">
                                                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                                Aucune notification
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.map(notif => (
                                                    <div key={notif.id}
                                                        className={`p-3 flex items-start gap-2.5 ${notif.lu ? '' : 'bg-blue-50'}`}>
                                                        <div className="mt-0.5">
                                                            {notif.type === 'reservation_confirmee'
                                                                ? <CheckCircle size={16} className="text-green-600" />
                                                                : <AlertCircle size={16} className="text-red-500" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-semibold ${notif.lu ? 'text-gray-600' : 'text-gray-800'}`}>{notif.titre}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                                            {!notif.lu && (
                                                                <button onClick={() => marquerLue(notif.id)} className="text-xs text-blue-600 hover:underline mt-1">
                                                                    Marquer lu
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button onClick={() => supprimerNotif(notif.id)} className="text-gray-400 hover:text-red-500 transition flex-shrink-0">
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.ufr}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 whitespace-nowrap">
                        {user?.statut}
                    </span>
                </div>

                <ProchaineNavette />
                {/* Actions rapides en tuiles */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/usager/reserver')}
                        className="bg-blue-50 hover:bg-blue-100 rounded-2xl p-4 flex items-center gap-2.5 transition">
                        <Calendar size={22} className="text-blue-700" />
                        <span className="text-sm font-semibold text-blue-700">Reserver</span>
                    </button>
                    <button onClick={() => navigate('/usager/scanner')}
                        className="bg-green-50 hover:bg-green-100 rounded-2xl p-4 flex items-center gap-2.5 transition">
                        <QrCode size={22} className="text-green-700" />
                        <span className="text-sm font-semibold text-green-700">Scanner le bus</span>
                    </button>
                </div>

                {/* QR + Reservations en 2 colonnes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* QR Code */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-2">
                            <QrCode size={16} className="text-blue-700" /> Mon QR code
                        </p>
                        {user?.qr_code && reservations.some(r => ['confirmee', 'en_cours'].includes(r.statut)) ? (
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

                    {/* Mes reservations */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-700" />
                                Mes reservations
                                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {reservationsAffichees.length}
                                </span>
                            </h2>
                            {reservations.length > 0 && (
                                <button onClick={exporterPdf} disabled={exportLoading}
                                    className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-semibold transition disabled:opacity-50">
                                    {exportLoading
                                        ? <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                        : <Download size={13} />}
                                    PDF
                                </button>
                            )}
                        </div>

                        {/* Barre de recherche */}
                        {reservations.length > 0 && (
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher par ville, statut..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {loadingReservations ? (
                            <div className="flex justify-center py-6">
                                <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Aucune reservation</p>
                            </div>
                        ) : reservationsAffichees.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <Search size={28} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Aucun resultat pour cette recherche</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-2 border border-gray-100">
                                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                        <input type="checkbox" checked={toutSelectionne} onChange={toggleSelectAll}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                                        Tout selectionner
                                    </label>
                                    {selected.length > 0 && (
                                        <button onClick={supprimerSelection} disabled={deleteSelectionLoading}
                                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50">
                                            {deleteSelectionLoading
                                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <Trash2 size={11} />}
                                            ({selected.length})
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {reservationsAffichees.map(r => (
                                        <div key={r.id}
                                            className={`border rounded-xl p-3 transition ${selected.includes(r.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                                            <div className="flex items-start justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)}
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-800">
                                                        <MapPin size={12} className="text-blue-500" />
                                                        {r.ville_depart} - {r.ville_arrivee}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {getStatutBadge(r.statut)}
                                                    <button onClick={() => supprimerReservation(r.id)} disabled={deleteLoading === r.id}
                                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                        {deleteLoading === r.id
                                                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                            : <Trash2 size={12} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 ml-5">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {new Date(r.date_reservation).toLocaleDateString('fr-FR')}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {r.heure_reservation}
                                                </div>
                                            </div>

                                            {r.statut === 'confirmee' && (
                                                <div className="mt-2 ml-5">
                                                    <button
                                                        onClick={() => annulerReservation(r.id)}
                                                        disabled={annulerLoading === r.id}
                                                        className="flex items-center gap-1 border border-red-300 text-red-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition text-xs disabled:opacity-50">
                                                        {annulerLoading === r.id
                                                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                            : <X size={12} />}
                                                        Annuler
                                                    </button>
                                                </div>
                                            )}

                                            {r.statut === 'en_attente_confirmation' && (
                                                <div className="mt-2 ml-5">
                                                    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                                                        En attente de confirmation.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}