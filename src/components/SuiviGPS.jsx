import { useGPS } from '../context/GPSContext'
import { Play, Square, AlertCircle } from 'lucide-react'

export default function SuiviGPS({ vehiculeId }) {
    const { actif, vehiculeId: idActif, erreur, demarrer, arreter } = useGPS()
    const estCeVehicule = actif && idActif === vehiculeId

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">Suivi GPS du véhicule</p>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    estCeVehicule ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estCeVehicule ? 'bg-green-600' : 'bg-gray-400'}`} />
                    {estCeVehicule ? 'Position partagée' : 'Suivi arrêté'}
                </span>
            </div>

            {erreur && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2 mb-3">
                    <AlertCircle size={16} /> {erreur}
                </div>
            )}

            {!estCeVehicule ? (
                <button onClick={(e) => { e.stopPropagation(); demarrer(vehiculeId) }}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition">
                    <Play size={16} /> Démarrer le suivi
                </button>
            ) : (
                <button onClick={(e) => { e.stopPropagation(); arreter() }}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm transition">
                    <Square size={16} /> Arrêter le suivi
                </button>
            )}
        </div>
    )
}