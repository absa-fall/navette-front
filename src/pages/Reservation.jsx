import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bus, Calendar, Clock, MapPin, User, Building2, QrCode, CreditCard, BadgeCheck } from 'lucide-react'

export default function Reservation() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        categorie: '',
        type_profil: '',
        ufr: '',
        ville_depart: '',
        ville_depart_autre: '',
        ville_arrivee: '',
        ville_arrivee_autre: '',
        date_reservation: '',
        heure_reservation: ''
    })
    const [qrCode, setQrCode] = useState(null)
    const [montant, setMontant] = useState(0)
    const [gratuit, setGratuit] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        
        // Si vacataire sélectionné, montre gratuit
        if (name === 'type_profil' && value === 'vacataire') {
            setGratuit(true)
        } else if (name === 'type_profil') {
            setGratuit(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const payload = {
                ...form,
                ville_depart: form.ville_depart === 'autre' ? form.ville_depart_autre : form.ville_depart,
                ville_arrivee: form.ville_arrivee === 'autre' ? form.ville_arrivee_autre : form.ville_arrivee
            }
            const response = await api.post('/reservations', payload)
            setQrCode(response.data.qr_code)
            setMontant(response.data.montant)
            setGratuit(response.data.gratuit)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réservation')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bus size={24} />
                        <span className="font-bold text-lg">UADB Mobilité</span>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
                    >
                        Se connecter
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Réserver une navette</h1>
                    <p className="text-gray-500 mb-6">Remplissez le formulaire pour réserver votre place</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {qrCode ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode size={40} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-700 mb-2">Réservation confirmée !</h2>
                            
                            <div className="bg-gray-100 rounded-xl p-6 mb-6">
                                <p className="text-sm text-gray-500 mb-2">Votre QR code :</p>
                                <p className="text-3xl font-mono font-bold text-blue-700 tracking-wider">{qrCode}</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                                <p className="text-sm text-blue-800">
                                    <strong>Instructions :</strong><br/>
                                    1. Sauvegardez ce QR code<br/>
                                    2. Présentez-le au chauffeur lors de la montée
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setQrCode(null)
                                    setMontant(0)
                                    setGratuit(false)
                                    setForm({
                                        nom: '',
                                        prenom: '',
                                        categorie: '',
                                        type_profil: '',
                                        ufr: '',
                                        ville_depart: '',
                                        ville_depart_autre: '',
                                        ville_arrivee: '',
                                        ville_arrivee_autre: '',
                                        date_reservation: '',
                                        heure_reservation: ''
                                    })
                                }}
                                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition"
                            >
                                Nouvelle réservation
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Nom et Prénom */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <User size={14} /> Nom
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={form.nom}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="Votre nom"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <User size={14} /> Prénom
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={form.prenom}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="Votre prénom"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Catégorie et Type de profil */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <BadgeCheck size={14} /> Catégorie
                                        </span>
                                    </label>
                                    <select
                                        name="categorie"
                                        value={form.categorie}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">Choisir...</option>
                                        <option value="PER">PER</option>
                                        <option value="PATS">PATS</option>
                                        <option value="ATR">ATR</option>
                                         <option value="Vacataire">Vacataire</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <BadgeCheck size={14} /> Type de profil
                                        </span>
                                    </label>
                                    <select
                                        name="type_profil"
                                        value={form.type_profil}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">Choisir...</option>
                                        <option value="permanent">Permanent</option>
                                        <option value="non_permanent">Non permanent</option>
                                        <option value="contractuel">Contractuel</option>
                                        <option value="vacataire">Vacataire </option>
                                    </select>
                                </div>
                            </div>

                            {/* UFR */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-1">
                                        <Building2 size={14} /> UFR
                                    </span>
                                </label>
                                <select
                                    name="ufr"
                                    value={form.ufr}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                >
                                    <option value="">Sélectionnez votre UFR</option>
                                    <option value="UFR Sciences">UFR SATIC</option>
                                    <option value="UFR Lettres">UFR SDD</option>
                                    <option value="UFR Droit">UFR ECOMIJ</option>
                                    <option value="UFR Médecine">UFR ISFAR</option>
                        
                                </select>
                            </div>

                            {/* Villes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={14} /> Départ
                                        </span>
                                    </label>
                                    <select
                                        name="ville_depart"
                                        value={form.ville_depart}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">Départ</option>
                                        <option value="Bambey">Bambey</option>
                                        <option value="Dakar">Dakar</option>
                                        <option value="Thies">Thies</option>
                                        <option value="Ngouniane">Ngouniane</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                    {form.ville_depart === 'autre' && (
                                        <input
                                            type="text"
                                            name="ville_depart_autre"
                                            value={form.ville_depart_autre}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mt-2"
                                            placeholder="Précisez la ville de départ"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={14} /> Arrivée
                                        </span>
                                    </label>
                                    <select
                                        name="ville_arrivee"
                                        value={form.ville_arrivee}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">Arrivée</option>
                                        <option value="Bambey">Bambey</option>
                                        <option value="Dakar">Dakar</option>
                                        <option value="Thies">Thies</option>
                                        <option value="Ngouniane">Ngouniane</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                    {form.ville_arrivee === 'autre' && (
                                        <input
                                            type="text"
                                            name="ville_arrivee_autre"
                                            value={form.ville_arrivee_autre}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mt-2"
                                            placeholder="Précisez la ville d'arrivée"
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Date et Heure */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> Date
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        name="date_reservation"
                                        value={form.date_reservation}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> Heure
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        name="heure_reservation"
                                        value={form.heure_reservation}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Création...
                                    </>
                                ) : 'Réserver ma place'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}