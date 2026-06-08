import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'

export default function OrdreMissionPrint() {
    const { id } = useParams()
    const [ordre, setOrdre] = useState(null)

    useEffect(() => {
        api.get(`/ordres-mission/${id}`)
            .then(res => setOrdre(res.data))
    }, [id])

    if (!ordre) return <p>Chargement...</p>

    return (
        <div style={{ padding: 40, fontFamily: 'Times New Roman' }}>

            <button onClick={() => window.print()}>
                🖨️ Imprimer
            </button>

            <h2 style={{ textAlign: 'center', marginTop: 20 }}>
                ORDRE DE MISSION
            </h2>

            <hr />

            <p><b>Chauffeur:</b> {ordre.chauffeur_nom} {ordre.chauffeur_prenom}</p>
            <p><b>Nationalité:</b> {ordre.nationalite}</p>
            <p><b>Grade:</b> {ordre.grade_fonction}</p>
            <p><b>Destination:</b> {ordre.destination}</p>
            <p><b>Objet:</b> {ordre.objet_mission}</p>
            <p><b>Transport:</b> {ordre.moyen_transport}</p>
            <p><b>Date départ:</b> {ordre.date_depart}</p>
            <p><b>Date retour:</b> {ordre.date_retour}</p>
            <p><b>Frais:</b> {ordre.frais_transport}</p>
            <p><b>Indemnité:</b> {ordre.indemnite_deplacement}</p>

        </div>
    )
}