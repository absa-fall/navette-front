import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import QRCode from 'react-qr-code'
import {
    Bus, Calendar, Clock, MapPin,
    CheckCircle, AlertCircle, ArrowLeft,
    ArrowRight, ArrowLeftRight, Download, XCircle, Lock
} from 'lucide-react'

export default function Reserver() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const navetteIdFromUrl = searchParams.get('navette_id')

    const [form, setForm] = useState({
        type_trajet: 'aller',
        ville_depart: '',
        ville_arrivee: '',
        navette_id: navetteIdFromUrl || ''
    })
    const [navettes, setNavettes] = useState([])
    const [navettesLoaded, setNavettesLoaded] = useState(false)
    const [qrCode, setQrCode] = useState(null)
    const [reservation, setReservation] = useState(null)
    const [enAttente, setEnAttente] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingAnnulation, setLoadingAnnulation] = useState(false)
    const [error, setError] = useState('')
    const [notification, setNotification] = useState(null)
    const pollingRef = useRef(null)

    const dashboard = user?.role === 'enseignant' ? '/enseignant/dashboard' : '/usager/dashboard'

    // Mode "navette imposée" : on arrive via la carte "Prochaine navette"
    const modeNavetteImposee = Boolean(navetteIdFromUrl)

    // ✅ Charge les navettes réellement publiées et disponibles
    // (le filtrage des navettes déjà "exécutées" est fait côté backend, dans prochainesNavettes())
    useEffect(() => {
        api.get('/navettes/prochaines')
            .then(res => setNavettes(res.data || []))
            .catch(() => setNavettes([]))
            .finally(() => setNavettesLoaded(true))
    }, [])

    // Une fois les navettes chargées, si on a un navette_id dans l'URL, on le pré-sélectionne
    useEffect(() => {
        if (navetteIdFromUrl) {
            setForm(prev => ({ ...prev, navette_id: navetteIdFromUrl }))
        }
    }, [navetteIdFromUrl, navettes])

    // La navette actuellement sélectionnée (utile pour l'affichage en lecture seule)
    const navetteSelectionnee = navettes.find(n => String(n.id) === String(form.navette_id))

    // Polling : verifie toutes les 10s si le chauffeur a confirme ou refuse
    useEffect(() => {
        if (enAttente && reservation?.id) {
            pollingRef.current = setInterval(async () => {
                try {
                    const res = await api.get(`/reservations/${reservation.id}/statut`)

                    if (res.data.statut === 'confirmee') {
                        setQrCode(res.data.qr_code)
                        setReservation(res.data.reservation)
                        setEnAttente(false)
                        setNotification({
                            type: 'success',
                            message: 'Votre reservation a ete confirmee par le chauffeur !'
                        })
                        clearInterval(pollingRef.current)

                    } else if (res.data.statut === 'refusee') {
                        setEnAttente(false)
                        setReservation(res.data.reservation)
                        setNotification({
                            type: 'error',
                            message: 'Votre reservation a ete refusee par le chauffeur.'
                        })
                        clearInterval(pollingRef.current)
                    }
                } catch (err) {
                    console.error(err)
                }
            }, 10000)
        }
        return () => clearInterval(pollingRef.current)
    }, [enAttente, reservation?.id])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const categorie = user.statut === 'vacataire' ? 'Vacataire' : (user.type_profil || 'PER')

            const res = await api.post('/reservations', {
                nom: user.nom,
                prenom: user.prenom,
                categorie: categorie,
                type_profil: user.statut,
                ufr: user.ufr,
                ...form   // contient navette_id, type_trajet, ville_depart, ville_arrivee
            })
            setReservation(res.data.reservation)
            setEnAttente(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réservation')
        } finally {
            setLoading(false)
        }
    }

    // Annulation par le passager apres reception du QR
    const annulerReservation = async () => {
        if (!window.confirm('Etes-vous sur de vouloir annuler votre reservation ? Le chauffeur sera notifie.')) return

        setLoadingAnnulation(true)
        setError('')
        try {
            await api.post(`/reservations/${reservation.id}/annuler`)
            setNotification({
                type: 'info',
                message: 'Votre reservation a ete annulee. Le chauffeur a ete notifie.'
            })
            setTimeout(() => {
                nouvelleReservation()
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'annulation')
        } finally {
            setLoadingAnnulation(false)
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

    const nouvelleReservation = () => {
        setQrCode(null)
        setReservation(null)
        setEnAttente(false)
        setNotification(null)
        setError('')
        setForm({
            type_trajet: 'aller',
            ville_depart: '',
            ville_arrivee: '',
            navette_id: modeNavetteImposee ? navetteIdFromUrl : ''
        })
    }

    const villes = ['Bambey', 'Dakar', 'Thies', 'Ngouniane']

    return (
    <div className="min-h-screen relative">

        {/* Image de fond fixe */}
        <img
            src="/bus1.png"
            alt=""
            className="fixed inset-0 w-full h-full object-cover -z-10"
        />
        <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-blue-50/55 to-white/65 -z-10" />

        <div className="bg-blue-700/90 backdrop-blur-sm text-white p-4 relative z-10">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(dashboard)}
                        className="p-2 hover:bg-white/20 rounded-lg transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Bus size={22} />
                        <span className="font-bold text-lg">Reserver une navette</span>
                    </div>
                </div>
            </div>

           <div className="max-w-lg mx-auto p-6 relative z-10">
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Reservation pour :</span>{' '}
                        {user?.prenom} {user?.nom} · {user?.ufr} · {user?.statut}
                    </p>
                </div>

                {notification && (
                    <div className={`rounded-xl p-4 mb-4 text-sm flex items-center gap-2 ${
                        notification.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : notification.type === 'error'
                            ? 'bg-red-50 border border-red-200 text-red-700'
                            : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                        {notification.type === 'success' && <CheckCircle size={16} />}
                        {notification.type === 'error' && <AlertCircle size={16} />}
                        {notification.type === 'info' && <AlertCircle size={16} />}
                        {notification.message}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-5 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {reservation?.statut === 'refusee' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-red-700 mb-2">
                                Reservation refusee
                            </h2>
                            <p className="text-gray-500 text-sm mb-3">
                                Le chauffeur a refuse votre reservation.
                            </p>

                            {reservation.motif_refus && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-left">
                                    <p className="text-xs text-red-500 font-semibold uppercase mb-1">Motif du refus</p>
                                    <p className="text-sm text-red-700">{reservation.motif_refus}</p>
                                </div>
                            )}

                            <button onClick={nouvelleReservation}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition">
                                Nouvelle reservation
                            </button>
                        </div>
                    )}

                    {/* En attente de confirmation du chauffeur */}
                    {enAttente && !qrCode && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-yellow-700 mb-1">
                                Reservation envoyee
                            </h2>
                            <p className="text-gray-500 text-sm mb-6">
                                En attente de confirmation du chauffeur. Cette page se met a jour automatiquement.
                            </p>

                            {reservation && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left text-sm mb-6">
                                    <div className="grid grid-cols-2 gap-2 text-blue-800">
                                        <div>
                                            <p className="text-xs text-blue-500">Trajet</p>
                                            <p className="font-semibold">{reservation.ville_depart} vers {reservation.ville_arrivee}</p>
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

                            <div className="flex gap-3">
                                <button onClick={() => navigate(dashboard)}
                                    className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                                    Tableau de bord
                                </button>
                                <button onClick={nouvelleReservation}
                                    className="flex-1 border border-red-200 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-50 transition">
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}

                    {/* QR code affiche UNIQUEMENT apres confirmation du chauffeur */}
                    {qrCode && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-700 mb-1">
                                Reservation confirmee !
                            </h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Le chauffeur a confirme votre place. Voici votre QR code.
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
                                            <p className="font-semibold">{reservation.ville_depart} vers {reservation.ville_arrivee}</p>
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
                                <p>1. Montez dans le bus</p>
                                <p>2. Montrez ce QR code au chauffeur</p>
                            </div>

                            <div className="flex gap-3 mb-3">
                                <button onClick={telechargerQR}
                                    className="flex-1 flex items-center justify-center gap-2 border border-blue-200 text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 transition">
                                    <Download size={16} />
                                    Telecharger
                                </button>
                                <button onClick={() => navigate(dashboard)}
                                    className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                                    Tableau de bord
                                </button>
                            </div>

                            <button onClick={nouvelleReservation}
                                className="w-full mb-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition">
                                Nouvelle reservation
                            </button>

                            <button
                                onClick={annulerReservation}
                                disabled={loadingAnnulation}
                                className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-50 transition disabled:opacity-50">
                                {loadingAnnulation ? (
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                Annuler ma reservation
                            </button>
                        </div>
                    )}

                    {/* Formulaire de reservation */}
                    {!enAttente && !qrCode && reservation?.statut !== 'refusee' && (
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
                                        <MapPin size={14} className="inline mr-1" /> Depart
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
                                        <MapPin size={14} className="inline mr-1" /> Arrivee
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

                            {/* ✅ Navette : soit figée en lecture seule (arrivée via "Prochaine navette"),
                                soit menu déroulant (arrivée via "Reserver une navette") */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Bus size={14} className="inline mr-1" /> Navette
                                </label>

                                {modeNavetteImposee ? (
                                    // --- Mode lecture seule : la navette a déjà été choisie sur le dashboard ---
                                    !navettesLoaded ? (
                                        <p className="text-sm text-gray-400 italic border border-gray-200 rounded-xl px-4 py-3">
                                            Chargement de la navette...
                                        </p>
                                    ) : navetteSelectionnee ? (
                                        <div className="w-full border-2 border-blue-200 bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-blue-900">
                                                    {new Date(navetteSelectionnee.date_depart).toLocaleDateString('fr-FR')} à {navetteSelectionnee.heure_depart}
                                                </p>
                                                <p className="text-xs text-blue-700">
                                                    Destination : {navetteSelectionnee.destination}
                                                </p>
                                            </div>
                                            <Lock size={16} className="text-blue-500 shrink-0" />
                                        </div>
                                    ) : (
                                        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl px-4 py-3">
                                            Cette navette n'est plus disponible (déjà exécutée ou expirée).
                                            <button
                                                type="button"
                                                onClick={() => navigate('/usager/reserver')}
                                                className="block mt-2 font-semibold underline"
                                            >
                                                Choisir une autre navette
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    // --- Mode liste déroulante classique ---
                                    navettes.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic border border-gray-200 rounded-xl px-4 py-3">
                                            Aucune navette disponible pour le moment
                                        </p>
                                    ) : (
                                        <select
                                            name="navette_id"
                                            value={form.navette_id}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Choisir une navette...</option>
                                            {navettes.map(n => (
                                                <option key={n.id} value={n.id}>
                                                    {new Date(n.date_depart).toLocaleDateString('fr-FR')} à {n.heure_depart} — {n.destination}
                                                </option>
                                            ))}
                                        </select>
                                    )
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    (modeNavetteImposee ? !navetteSelectionnee : navettes.length === 0)
                                }
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Envoi...
                                    </>
                                ) : 'Reserver ma place'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}