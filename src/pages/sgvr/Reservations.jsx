import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Bus, CheckCircle, Users, Clock, MapPin, RefreshCw, AlertCircle, QrCode } from 'lucide-react'

export default function SGVRReservations() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(new Date())

    useEffect(() => {
        fetchReservations()
        // Rafraîchissement auto toutes les 10 secondes
        const interval = setInterval(fetchReservations, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchReservations = async () => {
        try {
            const response = await api.get('/reservations/sgvr')
            setReservations(response.data)
            setLastUpdate(new Date())
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'en_attente': return 'bg-yellow-100 text-yellow-700'
            case 'confirmee': return 'bg-blue-100 text-blue-700'
            case 'en_cours': return 'bg-green-100 text-green-700'
            case 'terminee': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'en_attente': return 'En attente'
            case 'confirmee': return 'Confirmée'
            case 'en_cours': return 'En cours'
            case 'terminee': return 'Terminée'
            default: return statut
        }
    }

    const stats = {
        total: reservations.length,
        enCours: reservations.filter(r => r.statut === 'en_cours').length,
        terminees: reservations.filter(r => r.statut === 'terminee').length,
        enAttente: reservations.filter(r => r.statut === 'en_attente').length
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-purple-700 text-white p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bus size={24} />
                        <span className="font-bold text-lg">UADB Mobilité - SG VR</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">{user?.prenom} {user?.nom}</span>
                        <button
                            onClick={() => navigate('/sg-vr/dashboard')}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition"
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Suivi des validations en temps réel</h1>
                    <button
                        onClick={fetchReservations}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition"
                    >
                        <RefreshCw size={16} />
                        Actualiser
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Dernière mise à jour : {lastUpdate.toLocaleTimeString()}
                </p>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total réservations</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-3xl font-bold text-yellow-600">{stats.enAttente}</p>
                        <p className="text-sm text-gray-500">En attente</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-3xl font-bold text-green-600">{stats.enCours}</p>
                        <p className="text-sm text-gray-500">En cours</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-3xl font-bold text-gray-600">{stats.terminees}</p>
                        <p className="text-sm text-gray-500">Terminées</p>
                    </div>
                </div>

                {/* Liste des réservations */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} />
                        Détail des réservations
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Aucune réservation validée pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reservations.map((r) => (
                                <div key={r.id} className={`border rounded-xl p-4 transition ${
                                    r.statut === 'en_cours' ? 'border-green-300 bg-green-50' : 'border-gray-200'
                                }`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-800">
                                                {r.prenom} {r.nom}
                                            </p>
                                            <p className="text-sm text-gray-500">{r.ufr}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(r.statut)}`}>
                                            {getStatutLabel(r.statut)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin size={14} className="text-purple-500" />
                                            {r.ville_depart} → {r.ville_arrivee}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock size={14} className="text-purple-500" />
                                            {r.date_reservation} à {r.heure_reservation}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <QrCode size={14} className="text-purple-500" />
                                            <span className="font-mono text-xs">{r.qr_code}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {r.validee_montee && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                                    <CheckCircle size={10} /> Montée validée
                                                </span>
                                            )}
                                            {r.validee_descente && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                                    <CheckCircle size={10} /> Descente validée
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {r.statut === 'en_cours' && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                            <p className="text-sm text-green-700 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Navette en cours de trajet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}