import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import api from '../api/axios'
import { Bus, Clock, AlertCircle } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function CarteNavette({ vehiculeId }) {
    const [position, setPosition] = useState(null)
    const [suiviActif, setSuiviActif] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!vehiculeId) { setLoading(false); return }

        const fetchPosition = async () => {
            try {
                const res = await api.get(`/vehicules/${vehiculeId}/position`)
                setSuiviActif(res.data.suivi_actif)
                if (res.data.suivi_actif) {
                    setPosition([res.data.latitude, res.data.longitude])
                }
            } catch (err) {
                console.error('Erreur position véhicule', err)
            } finally {
                setLoading(false)
            }
        }

        fetchPosition()
        const interval = setInterval(fetchPosition, 8000)
        return () => clearInterval(interval)
    }, [vehiculeId])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex justify-center">
                <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!suiviActif || !position) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <AlertCircle size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Le chauffeur n'a pas encore démarré le suivi GPS.</p>
            </div>
        )
    }

    return (
        
        <div className="relative z-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Bus size={18} className="text-blue-700" />
                <p className="font-semibold text-gray-800 text-sm">Position en direct du bus</p>
            </div>
            <MapContainer center={position} zoom={13} style={{ height: '320px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={position}>
                    <Popup>Position actuelle du bus</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}