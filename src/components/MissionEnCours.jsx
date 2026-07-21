import { useEffect, useState } from 'react'
import api from '../api/axios'
import { AlertTriangle, MapPin, Send, X } from 'lucide-react'
import SuiviGPS from './SuiviGPS'
import CarteNavette from './CarteNavette'

export default function MissionEnCours() {
    const [ordre, setOrdre] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modalOuvert, setModalOuvert] = useState(false)
    const [motif, setMotif] = useState('')
    const [envoiLoading, setEnvoiLoading] = useState(false)
    const [message, setMessage] = useState('')

    const fetchMission = () => {
        api.get('/ordres-mission/ma-mission-active')
            .then(res => setOrdre(res.data))
            .catch(() => setOrdre(null))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchMission()
        const interval = setInterval(fetchMission, 15000)
        return () => clearInterval(interval)
    }, [])

    const signaler = async () => {
        if (!motif.trim()) return
        setEnvoiLoading(true)
        try {
            await api.post(`/ordres-mission/${ordre.id}/signaler-incident`, { motif })
            setMessage('Incident signalé. Le véhicule a été marqué en panne. Le DDL et le SG VR ont été notifiés.')
            setModalOuvert(false)
            setMotif('')
            fetchMission()
        } catch (err) {
            setMessage(err.response?.data?.message || 'Erreur lors du signalement')
        } finally {
            setEnvoiLoading(false)
        }
    }

    if (loading || !ordre) return null

    // NOUVEAU : détecte si un incident est en cours de traitement
    const incidentEnCours = ordre.statut === 'incident'

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-xl">
                            <MapPin size={18} className="text-blue-700" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Mission en cours</p>
                            <p className="font-semibold text-gray-800 text-sm">{ordre.destination}</p>
                        </div>
                    </div>
                </div>

                {message && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                        {message}
                    </p>
                )}

                {/* MODIFIÉ : bouton désactivé + texte différent si incident en cours */}
               <button
    onClick={() => setModalOuvert(true)}
    disabled={incidentEnCours}
    className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl transition text-sm ${
        incidentEnCours
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
    }`}
>
    <AlertTriangle size={16} />
    {incidentEnCours ? 'Incident en cours de traitement' : 'Signaler un incident'}
</button>
            </div>

            {/* ✅ NOUVEAU : Suivi GPS + carte du véhicule de la mission active */}
            {ordre.vehicule_id && (
                <div className="mt-4 space-y-4">
                    <SuiviGPS vehiculeId={ordre.vehicule_id} />
                    <CarteNavette vehiculeId={ordre.vehicule_id} />
                </div>
            )}

            {modalOuvert && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Signaler un incident</h3>
                            <button onClick={() => setModalOuvert(false)}>
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>
                        <textarea
                            value={motif}
                            onChange={e => setMotif(e.target.value)}
                            rows={4}
                            placeholder="Décrivez l'incident (panne, accident, retard...)"
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                        <button
                            onClick={signaler}
                            disabled={envoiLoading || !motif.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                            {envoiLoading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Send size={16} />}
                            Envoyer le signalement
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}