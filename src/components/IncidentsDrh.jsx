import { useEffect, useState } from 'react'
import api from '../api/axios'
import { AlertTriangle, Send } from 'lucide-react'

const reponsesRapides = [
    "Veuillez rédiger un nouvel ordre de mission.",
    "Bien reçu, un remplacement est en cours d'organisation.",
    "Merci de patienter, nous traitons la situation.",
]

export default function IncidentsDrh() {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState({})
    const [envoiLoading, setEnvoiLoading] = useState(null)

    const fetchIncidents = () => {
        api.get('/ordres-mission/incidents-en-attente-drh')
            .then(res => setIncidents(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchIncidents()
        const interval = setInterval(fetchIncidents, 15000)
        return () => clearInterval(interval)
    }, [])

    const repondre = async (id, message) => {
        if (!message?.trim()) return
        setEnvoiLoading(id)
        try {
            await api.post(`/ordres-mission/${id}/repondre-incident-ddl`, { message })
            setIncidents(prev => prev.filter(i => i.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'envoi')
        } finally {
            setEnvoiLoading(null)
        }
    }

    if (loading || incidents.length === 0) return null

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle size={16} />
                Incidents en attente de réponse ({incidents.length})
            </h2>
            {incidents.map(i => (
                <div key={i.id} className="bg-white rounded-xl p-4 border border-red-100 space-y-2">
                    <p className="text-sm font-semibold text-gray-800">{i.destination}</p>
                    <p className="text-xs text-gray-500">
                        Chauffeur : {i.chauffeur?.prenom} {i.chauffeur?.nom} — DDL : {i.ddl?.prenom} {i.ddl?.nom}
                    </p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">{i.incident_motif}</p>

                    <div className="flex flex-wrap gap-2">
                        {reponsesRapides.map((r, idx) => (
                            <button key={idx}
                                onClick={() => setMessages(prev => ({ ...prev, [i.id]: r }))}
                                className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1 rounded-lg transition">
                                {r}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={messages[i.id] || ''}
                        onChange={e => setMessages(prev => ({ ...prev, [i.id]: e.target.value }))}
                        rows={2}
                        placeholder="Votre réponse au DDL..."
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />

                    <button
                        onClick={() => repondre(i.id, messages[i.id])}
                        disabled={envoiLoading === i.id || !messages[i.id]?.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-xl transition disabled:opacity-50">
                        {envoiLoading === i.id
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Send size={14} />}
                        Envoyer la réponse au DDL
                    </button>
                </div>
            ))}
        </div>
    )
}