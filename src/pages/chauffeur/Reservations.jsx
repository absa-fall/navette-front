import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Bus, CheckCircle, Users, Clock, MapPin, RefreshCw, AlertCircle, QrCode, User } from 'lucide-react'

export default function ChauffeurReservations() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [qrInput, setQrInput] = useState('')
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')

    useEffect(() => {
        fetchReservations()
    }, [])

    const fetchReservations = async () => {
        try {
            const response = await api.get('/reservations/chauffeur')
            setReservations(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleValiderMontee = async (e) => {
        e.preventDefault()
        if (!qrInput.trim()) return

        try {
            const response = await api.post('/validation/montee', { qr_code: qrInput })
            setMessage(response.data.message)
            setMessageType('success')
            setQrInput('')
            fetchReservations()
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur')
            setMessageType('error')
        }
    }

    const handleValiderDescente = async (e) => {
        e.preventDefault()
        if (!qrInput.trim()) return

        try {
            const response = await api.post('/validation/descente', { qr_code: qrInput })
            setMessage(response.data.message)
            setMessageType('success')
            setQrInput('')
            fetchReservations()
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur')
            setMessageType('error')
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bus size={24} />
                        <span className="font-bold text-lg">UADB Mobilité - Chauffeur</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">{user?.prenom} {user?.nom}</span>
                        <button
                            onClick={() => navigate('/chauffeur/dashboard')}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition"
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des réservations</h1>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
                        messageType === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-700' 
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                        {messageType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Scan QR */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <QrCode size={20} />
                                Scanner QR Code
                            </h2>

                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Code QR du passager
                                    </label>
                                    <input
                                        type="text"
                                        value={qrInput}
                                        onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="EX: ABC123DEF45"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleValiderMontee}
                                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Montée
                                    </button>
                                    <button
                                        onClick={handleValiderDescente}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Descente
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                <p className="text-sm text-blue-800">
                                    <strong>Instructions :</strong><br/>
                                    1. Entrez le QR code du passager<br/>
                                    2. Cliquez sur "Montée" pour valider le départ<br/>
                                    3. Cliquez sur "Descente" à l'arrivée
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Liste des réservations */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Users size={20} />
                                    Liste des réservations
                                </h2>
                                <button
                                    onClick={fetchReservations}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <RefreshCw size={14} />
                                    Actualiser
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : reservations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Bus size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>Aucune réservation pour le moment</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reservations.map((r) => (
                                        <div key={r.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
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

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin size={14} className="text-blue-500" />
                                                    {r.ville_depart} → {r.ville_arrivee}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock size={14} className="text-blue-500" />
                                                    {r.date_reservation} à {r.heure_reservation}
                                                </div>
                                            </div>

                                            {/* Info passager - SANS LE MONTANT */}
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-gray-400" />
                                                    <span className="text-xs text-gray-500">
                                                        {r.categorie} • {r.type_profil}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}