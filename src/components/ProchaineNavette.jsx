import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Bus, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react'

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
}

export default function ProchaineNavette() {
    const navigate = useNavigate()
    const [navette, setNavette] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dejaReserve, setDejaReserve] = useState(false)
    const [dejaEmbarque, setDejaEmbarque] = useState(false)

    useEffect(() => {
        const fetchTout = async () => {
            try {
                const [resNavette, resReservations] = await Promise.all([
                    api.get('/navettes/prochaines'),
                    api.get('/mes-reservations')
                ])

                const navetteActuelle = resNavette.data.length > 0 ? resNavette.data[0] : null
                setNavette(navetteActuelle)

                const reservations = Array.isArray(resReservations.data.reservations)
                    ? resReservations.data.reservations
                    : []

                // ✅ Matching fiable : on compare directement l'id de la navette,
                // au lieu de reconstruire le lien via date/heure (qui pouvait
                // ne jamais correspondre si heure_reservation != heure_depart réelle).
                const reservationsNavette = navetteActuelle
                    ? reservations.filter(r => r.navette_id === navetteActuelle.id)
                    : []

                // Réservé : confirmée par le chauffeur mais pas encore scannée à la montée
                const nonEmbarquees = reservationsNavette.filter(r =>
                    ['confirmee', 'en_cours'].includes(r.statut) && !r.validee_montee
                )
                const reserve = nonEmbarquees.length > 0

                // Embarquées : scannées à la montée (statut confirmee/en_cours/terminee
                // selon le flux — scannerBus/scannerPassager passent direct à 'terminee')
                const embarquees = reservationsNavette.filter(r =>
                    ['confirmee', 'en_cours', 'terminee'].includes(r.statut) && r.validee_montee
                )

                // Si la réservation embarquée était un aller-retour, la carte reste
                // inactive jusqu'à la publication d'une nouvelle navette (le passager
                // a déjà réservé les deux sens, rien à faire de plus aujourd'hui).
                // Si c'était un aller (ou un retour) seul, la carte redevient active
                // pour permettre de réserver le sens restant sur cette navette.
                const embarque = embarquees.some(r => r.type_trajet === 'aller_retour')

                setDejaReserve(reserve)
                setDejaEmbarque(!reserve && embarque)
            } catch {
                // on garde les valeurs précédentes en cas d'erreur réseau
            } finally {
                setLoading(false)
            }
        }

        fetchTout()
        const interval = setInterval(fetchTout, 15000)
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
        <div
           onClick={() => !dejaReserve && !dejaEmbarque && navigate(`/usager/reserver?navette_id=${navette.id}`)}
            className={`rounded-2xl shadow-sm p-5 flex items-center justify-between text-white transition ${
                (dejaReserve || dejaEmbarque)
                    ? 'bg-gray-400 cursor-not-allowed opacity-80'
                    : 'bg-blue-700 cursor-pointer hover:bg-blue-800'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                    <Bus size={20} />
                </div>
                <div>
                    <p className="text-xs text-blue-100 font-medium">
                        {dejaEmbarque ? 'En attente de la prochaine navette' : 'Prochaine navette'}
                    </p>
                    <p className="font-semibold text-sm">{label || navette.destination}</p>
                </div>
            </div>

            <div className="text-right">
                {dejaReserve && (
                    <span className="inline-flex items-center gap-1 bg-green-400/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-1.5">
                        <CheckCircle size={11} />
                        Réservé
                    </span>
                )}
                <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                    <Calendar size={12} />
                    {new Date(navette.date_depart).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-blue-100 flex items-center gap-1 justify-end mt-0.5">
                    <Clock size={12} />
                    {navette.heure_depart}
                </p>
                {navette.date_retour && (
                    <p className="text-[11px] text-blue-100/90 flex items-center gap-1 justify-end mt-0.5">
                        <Calendar size={11} />
                        Retour : {new Date(navette.date_retour).toLocaleDateString('fr-FR')}
                        {/* ✅ AJOUT : heure de retour affichée si disponible */}
                        {navette.heure_retour ? ` à ${navette.heure_retour}` : ''}
                    </p>
                )}
            </div>
        </div>
    )
}