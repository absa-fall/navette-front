import { useEffect, useState } from 'react'
import api from '../api/axios'
import { AlertTriangle, Send } from 'lucide-react'

export default function IncidentsSignales() {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [transmitLoading, setTransmitLoading] = useState(null)

    const fetchIncidents = () => {
        api.get('/ordres-mission/mes-incidents')
            .then(res => setIncidents(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchIncidents()
        const interval = setInterval(fetchIncidents, 15000)
        return () => clearInterval(interval)
    }, [])

    const transmettre = async (id) => {
        setTransmitLoading(id)
        try {
            await api.post(`/ordres-mission/${id}/transmettre-incident-drh`)
            setIncidents(prev => prev.filter(i => i.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmitLoading(null)
        }
    }

    if (loading || incidents.length === 0) return null

    return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle size={16} />
            Incidents signalés ({incidents.length})
        </h2>
        {incidents.map(i => (
            <div key={i.id} className="relative bg-white rounded-xl p-4 pl-5 border border-red-100 overflow-hidden">
                {/* Bande rouge verticale à gauche */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600" />

                <p className="text-sm font-semibold text-gray-800">{i.destination}</p>
                <p className="text-xs text-gray-500 mt-1">
                    Chauffeur : {i.chauffeur?.prenom} {i.chauffeur?.nom}
                </p>
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5">{i.incident_motif}</p>
                <button
                    onClick={() => transmettre(i.id)}
                    disabled={transmitLoading === i.id}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-xl transition disabled:opacity-50"
                >
                        {transmitLoading === i.id
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Send size={14} />}
                        Transmettre au DRH
                    </button>
                </div>
            ))}
        </div>
    )
}