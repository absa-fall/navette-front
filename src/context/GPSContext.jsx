import { createContext, useContext, useState, useRef, useEffect } from 'react'
import api from '../api/axios'

const GPSContext = createContext(null)

export function GPSProvider({ children }) {
    const [actif, setActif] = useState(false)
    const [vehiculeId, setVehiculeId] = useState(null)
    const [erreur, setErreur] = useState('')
    const watchIdRef = useRef(null)

    useEffect(() => {
        const sauvegarde = localStorage.getItem('gps_vehicule_id')
        const token = localStorage.getItem('token')
        // On ne relance le suivi automatiquement que si un token valide est présent
        if (sauvegarde && token) {
            demarrer(sauvegarde)
        }
    }, [])

    const envoyerPosition = async (id, latitude, longitude) => {
        try {
            await api.patch(`/vehicules/${id}/position`, { latitude, longitude })
        } catch (err) {
            console.error('Erreur envoi position', err)

            if (err.response?.status === 401) {
                // Token invalide/expiré : on coupe le GPS immédiatement,
                // sans attendre l'intercepteur global (qui ne sait pas stopper watchPosition)
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current)
                    watchIdRef.current = null
                }
                setActif(false)
                setVehiculeId(null)
                localStorage.removeItem('gps_vehicule_id')
                setErreur('Session expirée. Veuillez vous reconnecter.')
            }
        }
    }

    const demarrer = (id) => {
        if (!navigator.geolocation) {
            setErreur("La géolocalisation n'est pas disponible sur cet appareil.")
            return
        }
        setErreur('')
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => envoyerPosition(id, pos.coords.latitude, pos.coords.longitude),
            (err) => setErreur("Impossible d'accéder à votre position : " + err.message),
            { enableHighAccuracy: false, maximumAge: 15000, timeout: 30000 }
        )
        setVehiculeId(id)
        setActif(true)
        localStorage.setItem('gps_vehicule_id', id)
    }

    const arreter = async () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }
        const id = vehiculeId
        setActif(false)
        setVehiculeId(null)
        localStorage.removeItem('gps_vehicule_id')
        if (id) {
            try {
                await api.patch(`/vehicules/${id}/position/stop`)
            } catch (err) {
                console.error('Erreur arrêt suivi', err)
            }
        }
    }

    return (
        <GPSContext.Provider value={{ actif, vehiculeId, erreur, demarrer, arreter }}>
            {children}
        </GPSContext.Provider>
    )
}

export function useGPS() {
    return useContext(GPSContext)
}