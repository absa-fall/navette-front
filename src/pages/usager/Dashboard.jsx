import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProchaineNavette from '../../components/ProchaineNavette'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Bus, QrCode, Calendar, User, Bell, CheckCircle, AlertCircle, X, Clock, MapPin, Trash2, Download, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import QRCode from 'react-qr-code'
import CarteNavette from '../../components/CarteNavette'
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
    const [vehiculeActifId, setVehiculeActifId] = useState(null)
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

    const fetchVehiculeActif = async () => {
        try {
            const res = await api.get('/ma-navette-active')
            setVehiculeActifId(res.data.vehicule_id)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchNotifications()
        fetchReservations()
        fetchVehiculeActif()
        const interval = setInterval(() => {
            fetchNotifications()
            fetchReservations()
            fetchVehiculeActif()
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

    // ✅ Libellé + couleur du type de réservation (aller / retour / aller_retour)
    const typeTrajetBadge = (typeTrajet) => {
        switch (typeTrajet) {
            case 'aller_retour': return { label: 'Aller-Retour', color: 'bg-indigo-100 text-indigo-700' }
            case 'retour':       return { label: 'Retour',       color: 'bg-orange-100 text-orange-700' }
            case 'aller':        return { label: 'Aller',        color: 'bg-blue-100 text-blue-700' }
            default:             return { label: typeTrajet || 'Aller', color: 'bg-gray-100 text-gray-600' }
        }
    }

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

    // Début de semaine (lundi) pour une date donnée
    const getWeekStart = (date) => {
        const d = new Date(date)
        const jour = d.getDay()
        const diff = (jour === 0 ? -6 : 1) - jour
        d.setDate(d.getDate() + diff)
        d.setHours(0, 0, 0, 0)
        return d
    }

    // Données du graphique : réservations sur les 6 dernières semaines
    const dataGraphique = (() => {
        const maintenant = new Date()
        const semaineActuelle = getWeekStart(maintenant)
        const semaines = []
        for (let i = 5; i >= 0; i--) {
            const debut = new Date(semaineActuelle)
            debut.setDate(debut.getDate() - i * 7)
            semaines.push({
                key: debut.getTime(),
                label: debut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                Réservations: 0,
            })
        }
        reservations.forEach(r => {
            if (!r.date_reservation) return
            const debutSemaine = getWeekStart(r.date_reservation).getTime()
            const entree = semaines.find(s => s.key === debutSemaine)
            if (entree) entree.Réservations += 1
        })
        return semaines
    })()

    return (
        <Layout>
            <div className="space-y-4">

                <ProchaineNavette />
                {vehiculeActifId && <CarteNavette vehiculeId={vehiculeActifId} />}
                {/* Cartes stats + actions rapides — toutes sur la même ligne */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Calendar size={20} className="text-blue-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{reservations.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Total réservations</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-yellow-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Clock size={20} className="text-yellow-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">
                            {reservations.filter(r => !['confirmee', 'en_cours', 'terminee', 'refusee', 'annulee'].includes(r.statut)).length}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">En attente</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-purple-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} className="text-purple-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">
                            {reservations.filter(r => ['confirmee', 'en_cours'].includes(r.statut)).length}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Confirmées</p>
                    </div>

                    <div
                        onClick={() => navigate('/usager/reserver')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <Calendar size={20} className="text-blue-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">+</p>
                        <p className="text-sm text-gray-500 mt-1">Réserver</p>
                    </div>

                    <div
                        onClick={() => navigate('/usager/scanner')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-100 w-11 h-11 rounded-full flex items-center justify-center">
                                <QrCode size={20} className="text-green-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Scan</p>
                        <p className="text-sm text-gray-500 mt-1">Scanner le bus</p>
                    </div>
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
    <div className="py-8 text-gray-400 text-sm">
        <p>QR code non disponible</p>
        <p className="text-xs mt-1">Disponible après confirmation du chauffeur</p>
    </div>
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
                                    {reservationsAffichees.map(r => {
                                        const typeTrajet = typeTrajetBadge(r.type_trajet)
                                        return (
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
                                                    {/* ✅ Badge type de reservation (aller / retour / aller-retour) */}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeTrajet.color}`}>
                                                        {typeTrajet.label}
                                                    </span>
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
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Graphique réservations par semaine */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">Réservations par semaine</h2>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataGraphique}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="Réservations" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Layout>
    )
}