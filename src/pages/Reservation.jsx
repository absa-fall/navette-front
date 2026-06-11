import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bus, Calendar, Clock, MapPin, User, Building2, QrCode, BadgeCheck, ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react'

export default function Reservation() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        categorie: '',
        type_profil: '',
        ufr: '',
        type_trajet: 'aller',
        ville_depart: '',
        ville_depart_autre: '',
        ville_arrivee: '',
        ville_arrivee_autre: '',
        date_reservation: '',
        heure_reservation: ''
    })
    const [qrCode, setQrCode] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
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
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réservation')
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setQrCode(null)
        setForm({
            nom: '', prenom: '', categorie: '', type_profil: '', ufr: '',
            type_trajet: 'aller',
            ville_depart: '', ville_depart_autre: '',
            ville_arrivee: '', ville_arrivee_autre: '',
            date_reservation: '', heure_reservation: ''
        })
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
                    <button onClick={() => navigate('/login')}
                        className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
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
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode size={40} className="text-yellow-600" />
                            </div>
                            <h2 className="text-xl font-bold text-yellow-700 mb-2">Demande envoyée !</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Votre réservation est en attente de confirmation par le chauffeur.
                                Vous recevrez une notification une fois confirmée.
                            </p>

                            <div className="bg-gray-100 rounded-xl p-6 mb-6">
                                <p className="text-sm text-gray-500 mb-2">Votre code de réservation :</p>
                                <p className="text-3xl font-mono font-bold text-blue-700 tracking-wider">{qrCode}</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                                <p className="text-sm text-blue-800">
                                    <strong>Instructions :</strong><br/>
                                    1. Sauvegardez ce code<br/>
                                    2. Attendez la confirmation du chauffeur<br/>
                                    3. Une fois confirmé, scannez le QR code dans le bus pour valider votre présence
                                </p>
                            </div>

                            <button onClick={reset}
                                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition">
                                Nouvelle réservation
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Nom et Prénom */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User size={14} className="inline mr-1" /> Nom
                                    </label>
                                    <input type="text" name="nom" value={form.nom} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Votre nom" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User size={14} className="inline mr-1" /> Prénom
                                    </label>
                                    <input type="text" name="prenom" value={form.prenom} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Votre prénom" required />
                                </div>
                            </div>

                            {/* Catégorie et Type profil */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <BadgeCheck size={14} className="inline mr-1" /> Catégorie
                                    </label>
                                    <select name="categorie" value={form.categorie} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="">Choisir...</option>
                                        <option value="PER">PER</option>
                                        <option value="PATS">PATS</option>
                                        <option value="ATR">ATR</option>
                                        <option value="Vacataire">Vacataire</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <BadgeCheck size={14} className="inline mr-1" /> Type de profil
                                    </label>
                                    <select name="type_profil" value={form.type_profil} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="">Choisir...</option>
                                        <option value="permanent">Permanent</option>
                                        <option value="non_permanent">Non permanent</option>
                                        <option value="contractuel">Contractuel</option>
                                        <option value="vacataire">Vacataire</option>
                                    </select>
                                </div>
                            </div>

                            {/* UFR */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building2 size={14} className="inline mr-1" /> UFR
                                </label>
                                <select name="ufr" value={form.ufr} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required>
                                    <option value="">Sélectionnez votre UFR</option>
                                    <option value="SATIC">UFR SATIC</option>
                                    <option value="SDD">UFR SDD</option>
                                    <option value="ECOMIJ">UFR ECOMIJ</option>
                                    <option value="ISFAR">UFR ISFAR</option>
                                </select>
                            </div>

                            {/* Type de trajet */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de trajet
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button type="button"
                                        onClick={() => setForm(prev => ({ ...prev, type_trajet: 'aller' }))}
                                        className={`p-3 rounded-xl border-2 text-center transition ${form.type_trajet === 'aller' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <ArrowRight size={18} className="mx-auto mb-1 text-blue-600" />
                                        <div className="text-xs font-semibold text-gray-800">Aller</div>
                                    </button>
                                    <button type="button"
                                        onClick={() => setForm(prev => ({ ...prev, type_trajet: 'retour' }))}
                                        className={`p-3 rounded-xl border-2 text-center transition ${form.type_trajet === 'retour' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <ArrowLeft size={18} className="mx-auto mb-1 text-blue-600" />
                                        <div className="text-xs font-semibold text-gray-800">Retour</div>
                                    </button>
                                    <button type="button"
                                        onClick={() => setForm(prev => ({ ...prev, type_trajet: 'aller_retour' }))}
                                        className={`p-3 rounded-xl border-2 text-center transition ${form.type_trajet === 'aller_retour' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <ArrowLeftRight size={18} className="mx-auto mb-1 text-blue-600" />
                                        <div className="text-xs font-semibold text-gray-800">Aller-Retour</div>
                                    </button>
                                </div>
                            </div>

                            {/* Villes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin size={14} className="inline mr-1" /> Départ
                                    </label>
                                    <select name="ville_depart" value={form.ville_depart} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="">Départ</option>
                                        <option value="Bambey">Bambey</option>
                                        <option value="Dakar">Dakar</option>
                                        <option value="Thies">Thiès</option>
                                        <option value="Ngouniane">Ngouniane</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                    {form.ville_depart === 'autre' && (
                                        <input type="text" name="ville_depart_autre" value={form.ville_depart_autre}
                                            onChange={handleChange} placeholder="Précisez la ville de départ"
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                                            required />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin size={14} className="inline mr-1" /> Arrivée
                                    </label>
                                    <select name="ville_arrivee" value={form.ville_arrivee} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="">Arrivée</option>
                                        <option value="Bambey">Bambey</option>
                                        <option value="Dakar">Dakar</option>
                                        <option value="Thies">Thiès</option>
                                        <option value="Ngouniane">Ngouniane</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                    {form.ville_arrivee === 'autre' && (
                                        <input type="text" name="ville_arrivee_autre" value={form.ville_arrivee_autre}
                                            onChange={handleChange} placeholder="Précisez la ville d'arrivée"
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                                            required />
                                    )}
                                </div>
                            </div>

                            {/* Date et Heure */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar size={14} className="inline mr-1" /> Date
                                    </label>
                                    <input type="date" name="date_reservation" value={form.date_reservation}
                                        onChange={handleChange} min={new Date().toISOString().split('T')[0]}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Clock size={14} className="inline mr-1" /> Heure
                                    </label>
                                    <input type="time" name="heure_reservation" value={form.heure_reservation}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Envoi...
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