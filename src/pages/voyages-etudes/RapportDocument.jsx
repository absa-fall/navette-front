import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../api/axios' // adapte le chemin vers ton instance axios configurée avec le token

export default function RapportDocument() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [pdfUrl, setPdfUrl] = useState(null)
    const [erreur, setErreur] = useState(null)
    const [chargement, setChargement] = useState(true)

    useEffect(() => {
        let objectUrl = null

        const chargerPdf = async () => {
            try {
                const response = await axios.get(`/rapports/${id}/download`, {
                    responseType: 'blob',
                })
                objectUrl = URL.createObjectURL(response.data)
                setPdfUrl(objectUrl)
            } catch (err) {
                if (err.response?.status === 401) {
                    // Token expiré : laisser ton intercepteur axios gérer la redirection
                    setErreur("Session expirée, reconnecte-toi.")
                } else if (err.response?.status === 403) {
                    setErreur("Tu n'as pas accès à ce rapport.")
                } else if (err.response?.status === 404) {
                    setErreur("Rapport introuvable.")
                } else {
                    setErreur("Erreur lors du chargement du PDF.")
                }
            } finally {
                setChargement(false)
            }
        }

        chargerPdf()

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [id])

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    ← Retour
                </button>
                <h1 className="text-xl font-semibold">Rapport de voyage</h1>
                <div />
            </div>

            {chargement && <p className="text-center">Chargement du document...</p>}

            {erreur && (
                <p className="text-center text-red-600 font-medium">{erreur}</p>
            )}

            {pdfUrl && !erreur && (
                <iframe
                    src={pdfUrl}
                    title={`Rapport ${id}`}
                    className="w-full border rounded"
                    style={{ height: '85vh' }}
                />
            )}
        </div>
    )
}