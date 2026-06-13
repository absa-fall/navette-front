import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import {
    Bus, Calendar, Clock, MapPin,
    CheckCircle, AlertCircle, ArrowLeft,
    ArrowRight, ArrowLeftRight
} from 'lucide-react'

export default function Reserver() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        type_trajet: 'aller',
        ville_depart: '',
        ville_arrivee: '',
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
            const res = await api.post('/reservations', {
                nom: user.nom,
                prenom: user.prenom,
                categorie: user.type_profil,
                type_profil: user.statut,
                ufr: user.ufr,
                ...form
            })
            setQrCode(res.data.qr_code)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réservation')
        } finally {
            setLoading(false)
        }
    }

    const villes = ['Bambey', 'Dakar', 'Thiès', 'Ngouniane']

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate('/usager/dashboard')}
                        className="p-2 hover:bg-white/20 rounded-lg transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Bus size={22} />
                        <span className="font-bold text-lg">Réserver une navette</span>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-6">
                {/* Infos passager */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Réservation pour :</span>{' '}
                        {user?.prenom} {user?.nom} · {user?.ufr} · {user?.statut}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {qrCode ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-700 mb-2">
                                Réservation envoyée !
                            </h2>
                            <p className="text-gray-500 text-sm mb-5">
                                En attente de confirmation du chauffeur.
                            </p>
                            <div className="bg-gray-100 rounded-xl p-5 mb-5">
                                <p className="text-xs text-gray-500 mb-1">Code de réservation</p>
                                <p className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
                                    {qrCode}
                                </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left text-sm text-blue-800 mb-5">
                                <strong>Instructions :</strong><br />
                                1. Une fois confirmé par le chauffeur<br />
                                2. Montez dans le bus<br />
                                3. Scannez le QR du bus <strong>OU</strong> montrez votre QR au chauffeur
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate('/usager/dashboard')}
                                    className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                                >
                                    Tableau de bord
                                </button>
                                <button
                                    onClick={() => { setQrCode(null); setForm({ type_trajet: 'aller', ville_depart: '', ville_arrivee: '', date_reservation: '', heure_reservation: '' }) }}
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition"
                                >
                                    Nouvelle réservation
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Type de trajet */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de trajet
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'aller', label: 'Aller', Icon: ArrowRight },
                                        { value: 'retour', label: 'Retour', Icon: ArrowLeft },
                                        { value: 'aller_retour', label: 'Aller-Retour', Icon: ArrowLeftRight },
                                    ].map(({ value, label, Icon }) => (
                                        <button key={value} type="button"
                                            onClick={() => setForm(prev => ({ ...prev, type_trajet: value }))}
                                            className={`p-3 rounded-xl border-2 text-center transition ${
                                                form.type_trajet === value
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300'
                                            }`}>
                                            <Icon size={18} className="mx-auto mb-1 text-blue-600" />
                                            <div className="text-xs font-semibold text-gray-800">{label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Villes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin size={14} className="inline mr-1" /> Départ
                                    </label>
                                    <select name="ville_depart" value={form.ville_depart}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="">Choisir...</option>
                                        {villes.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin size={14} className="inline mr-1" /> Arrivée
                                    </label>
                                    <select name="ville_arrivee" value={form.ville_arrivee}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required>
                                        <option value="">Choisir...</option>
                                        {villes.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date et Heure */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar size={14} className="inline mr-1" /> Date
                                    </label>
                                    <input type="date" name="date_reservation"
                                        value={form.date_reservation}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Clock size={14} className="inline mr-1" /> Heure
                                    </label>
                                    <input type="time" name="heure_reservation"
                                        value={form.heure_reservation}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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