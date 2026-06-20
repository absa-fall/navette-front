import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Bus, CheckCircle, Users, Clock, MapPin, RefreshCw, AlertCircle, XCircle, ArrowRight, ArrowLeft, ArrowLeftRight, Trash2 } from 'lucide-react'

const typeTrajetLabel = {
    aller: { label: 'Aller', icon: ArrowRight },
    retour: { label: 'Retour', icon: ArrowLeft },
    aller_retour: { label: 'Aller-Retour', icon: ArrowLeftRight },
}

export default function ChauffeurReservations() {
    const { user } = useAuth()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')
    const [onglet, setOnglet] = useState('attente')
    const [selected, setSelected] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => { fetchReservations() }, [])
    useEffect(() => { setSelected([]) }, [onglet])

    const fetchReservations = async () => {
        setLoading(true)
        try {
            const response = await api.get('/reservations/chauffeur')
            setReservations(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const showMsg = (msg, type) => {
        setMessage(msg)
        setMessageType(type)
        setTimeout(() => setMessage(''), 4000)
    }

    const confirmer = async (id) => {
        setActionLoading(id + '_confirmer')
        try {
            await api.patch(`/reservations/${id}/confirmer`)
            showMsg('Réservation confirmée !', 'success')
            fetchReservations()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', 'error')
        } finally {
            setActionLoading(null)
        }
    }

    const refuser = async (id) => {
        setActionLoading(id + '_refuser')
        try {
            await api.patch(`/reservations/${id}/refuser`)
            showMsg('Réservation refusée.', 'info')
            fetchReservations()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', 'error')
        } finally {
            setActionLoading(null)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = (liste) => {
        const ids = liste.map(r => r.id)
        const toutSelectionne = ids.every(id => selected.includes(id))
        if (toutSelectionne) setSelected(prev => prev.filter(id => !ids.includes(id)))
        else setSelected(prev => [...new Set([...prev, ...ids])])
    }

   const supprimerSelection = async (liste) => {
    const ids = selected.filter(id => liste.some(r => r.id === id))
    if (ids.length === 0) return
    if (!confirm(`Supprimer ${ids.length} réservation(s) ?`)) return
    setDeleteLoading(true)
    try {
        for (const id of ids) {
            await api.delete(`/reservations/${id}`)
        }
        setSelected([])
        showMsg(`${ids.length} réservation(s) supprimée(s)`, 'success')
        fetchReservations()
    } catch {
        showMsg('Erreur lors de la suppression', 'error')
    } finally {
        setDeleteLoading(false)
    }
}

    const enAttente = reservations.filter(r => r.statut === 'en_attente_confirmation')
    const confirmees = reservations.filter(r => r.statut === 'confirmee')
    const enCours   = reservations.filter(r => r.statut === 'en_cours')
    const listeActive = onglet === 'attente' ? enAttente : onglet === 'confirmees' ? confirmees : enCours

    const selectedDansListe = selected.filter(id => listeActive.some(r => r.id === id))
    const toutSelectionne   = listeActive.length > 0 && listeActive.every(r => selected.includes(r.id))

    const getStatutBadge = (statut) => {
        switch (statut) {
            case 'en_attente_confirmation': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">En attente</span>
            case 'confirmee':               return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Confirmée</span>
            case 'en_cours':               return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">En cours</span>
            default: return null
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Réservations passagers</h1>
                        <p className="text-gray-500 text-sm mt-1">{enAttente.length} en attente de confirmation</p>
                    </div>
                    <button onClick={fetchReservations}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 px-4 py-2 rounded-xl">
                        <RefreshCw size={14} /> Actualiser
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-2 ${
                        messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700'
                        : messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                        {messageType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message}
                    </div>
                )}

                {/* Onglets */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button onClick={() => setOnglet('attente')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'attente' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        En attente ({enAttente.length})
                    </button>
                    <button onClick={() => setOnglet('confirmees')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'confirmees' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Confirmées ({confirmees.length})
                    </button>
                    <button onClick={() => setOnglet('encours')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'encours' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        En cours ({enCours.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : listeActive.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Bus size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucune réservation dans cet onglet</p>
                    </div>
                ) : (
                    <div className="space-y-4">

                        {/* Barre sélection */}
                        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox"
                                    checked={toutSelectionne}
                                    onChange={() => toggleSelectAll(listeActive)}
                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                {selectedDansListe.length > 0
                                    ? `${selectedDansListe.length} sélectionné(s)`
                                    : 'Tout sélectionner'}
                            </label>
                            {selectedDansListe.length > 0 && (
                                <button
                                    onClick={() => supprimerSelection(listeActive)}
                                    disabled={deleteLoading}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                    {deleteLoading
                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 size={14} />}
                                    Supprimer ({selectedDansListe.length})
                                </button>
                            )}
                        </div>

                        {/* Cartes */}
                        {listeActive.map(r => {
                            const typeTrajet = typeTrajetLabel[r.type_trajet] || typeTrajetLabel['aller']
                            const TrajetIcon = typeTrajet.icon
                            return (
                                <div key={r.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition ${
                                    selected.includes(r.id) ? 'border-red-300 bg-red-50' : 'border-gray-100'
                                }`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox"
                                                checked={selected.includes(r.id)}
                                                onChange={() => toggleSelect(r.id)}
                                                className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                            <div>
                                                <p className="font-bold text-gray-800">{r.prenom} {r.nom}</p>
                                                <p className="text-xs text-gray-500">{r.ufr} · {r.categorie} · {r.type_profil}</p>
                                            </div>
                                        </div>
                                        {getStatutBadge(r.statut)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin size={14} className="text-blue-500" />
                                            {r.ville_depart} → {r.ville_arrivee}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock size={14} className="text-blue-500" />
                                            {r.date_reservation ? new Date(r.date_reservation).toLocaleDateString('fr-FR') : '-'} à {r.heure_reservation}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                            <TrajetIcon size={12} />
                                            {typeTrajet.label}
                                        </span>
                                    </div>

                                    {r.statut === 'en_attente_confirmation' && (
                                        <div className="flex gap-3">
                                            <button onClick={() => refuser(r.id)}
                                                disabled={actionLoading === r.id + '_refuser'}
                                                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50">
                                                {actionLoading === r.id + '_refuser'
                                                    ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                    : <XCircle size={16} />}
                                                Refuser
                                            </button>
                                            <button onClick={() => confirmer(r.id)}
                                                disabled={actionLoading === r.id + '_confirmer'}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                {actionLoading === r.id + '_confirmer'
                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <CheckCircle size={16} />}
                                                Confirmer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}