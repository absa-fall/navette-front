import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import QRCode from 'react-qr-code'
import {
    Bus, Calendar, Clock, MapPin,
    CheckCircle, AlertCircle, ArrowLeft,
    ArrowRight, ArrowLeftRight, Download
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
    const [reservation, setReservation] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const dashboard = user?.role === 'enseignant' ? '/enseignant/dashboard' : '/usager/dashboard'

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
            setReservation(res.data.reservation)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réservation')
        } finally {
            setLoading(false)
        }
    }

    const telechargerQR = () => {
        const svg = document.getElementById('qr-reserver')
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 256, 256)
            ctx.drawImage(img, 0, 0, 256, 256)
            const a = document.createElement('a')
            a.href = canvas.toDataURL('image/png')
            a.download = `qr-navette-${qrCode}.png`
            a.click()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    const villes = ['Bambey', 'Dakar', 'Thiès', 'Ngouniane']

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(dashboard)}
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
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-700 mb-1">
                                Réservation envoyée !
                            </h2>
                            <p className="text-gray-500 text-sm mb-6">
                                En attente de confirmation du chauffeur.
                            </p>

                            <div className="flex justify-center mb-3">
                                <div className="p-5 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                    <QRCode
                                        id="qr-reserver"
                                        value={qrCode}
                                        size={200}
                                        level="H"
                                        fgColor="#1e3a8a"
                                    />
                                </div>
                            </div>

                            <p className="font-mono text-base font-bold text-blue-700 tracking-widest mb-5">
                                {qrCode}
                            </p>

                            {reservation && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left text-sm mb-4">
                                    <div className="grid grid-cols-2 gap-2 text-blue-800">
                                        <div>
                                            <p className="text-xs text-blue-500">Trajet</p>
                                            <p className="font-semibold">{reservation.ville_depart} → {reservation.ville_arrivee}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-500">Date</p>
                                            <p className="font-semibold">{new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-500">Heure</p>
                                            <p className="font-semibold">{reservation.heure_reservation}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-500">Montant</p>
                                            <p className="font-semibold">{Number(reservation.montant_retenue).toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left text-sm text-yellow-800 mb-5">
                                <p className="font-semibold mb-1">Instructions :</p>
                                <p>1. Une fois confirmé par le chauffeur</p>
                                <p>2. Montez dans le bus</p>
                                <p>3. Montrez ce QR code au chauffeur</p>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={telechargerQR}
                                    className="flex-1 flex items-center justify-center gap-2 border border-blue-200 text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 transition">
                                    <Download size={16} />
                                    Télécharger
                                </button>
                                <button onClick={() => navigate(dashboard)}
                                    className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                                    Tableau de bord
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setQrCode(null)
                                    setReservation(null)
                                    setForm({ type_trajet: 'aller', ville_depart: '', ville_arrivee: '', date_reservation: '', heure_reservation: '' })
                                }}
                                className="w-full mt-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition"
                            >
                                Nouvelle réservation
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
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