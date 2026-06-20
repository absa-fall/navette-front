import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VoyagesATraiter() {
    const navigate = useNavigate()
    
    useEffect(() => {
        navigate('/vice-recteur/voyages-etudes', { replace: true })
    }, [])

    return null
}