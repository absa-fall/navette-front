import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Bus, MapPin, Calendar, Clock } from 'lucide-react'

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
}

export default function ProchaineNavette() {
    const [navette, setNavette] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNavette = () => {
            api.get('/navettes/prochaines')
                .then(res => setNavette(res.data.length > 0 ? res.data[0] : null))
                .catch(() => {})
                .finally(() => setLoading(false))
        }
        fetchNavette()
        const interval = setInterval(fetchNavette, 15000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex justify-center">
                <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!navette) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <Bus size={26} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucune navette prévue pour le moment</p>
            </div>
        )
    }

    const label = navette.trajet === 'autres' ? navette.trajet_autre : trajetLabels[navette.trajet]

    return (
        <div className="bg-blue-700 rounded-2xl shadow-sm p-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                    <Bus size={20} />
                </div>
                <div>
                    <p className="text-xs text-blue-100 font-medium">Prochaine navette</p>
                    <p className="font-semibold text-sm">{label || navette.destination}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                    <Calendar size={12} />
                    {new Date(navette.date_depart).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-blue-100 flex items-center gap-1 justify-end mt-0.5">
                    <Clock size={12} />
                    {navette.heure_depart}
                </p>
            </div>
        </div>
    )
}