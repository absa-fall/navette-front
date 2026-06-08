import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle } from 'lucide-react'

export default function EnseignantResoumettreRapport() {
    const { rapportId } = useParams()
    const navigate = useNavigate()
    const [rapport, setRapport] = useState(null)
    const [contenu, setContenu] = useState('')
    const [fichier, setFichier] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get(`/rapports/${rapportId}`)
            .then(res => {
                setRapport(res.data)
                setContenu(res.data.contenu)
            }).catch(() => {})
    }, [rapportId])

    const handleSubmit = async () => {
        if (!contenu) {
            setError('Veuillez rédiger le contenu')
            return
        }
        setLoading(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('contenu', contenu)
            if (fichier) formData.append('fichier_pdf', fichier)

            await api.patch(`/rapports/${rapportId}/resoumettre`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setSuccess(true)
            setTimeout(() => navigate('/enseignant/rapports'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-green-100 p-5 rounded-full mb-4">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Rapport re-soumis !</h2>
                    <p className="text-gray-500">Votre rapport a été transmis au Vice-Recteur.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Re-soumettre mon rapport</h1>
                    <p className="text-gray-500 text-sm mt-1">Voyage : {rapport?.voyage?.destination}</p>
                </div>

                {rapport?.commentaire_vr && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-red-500 mb-1">MOTIF DU REJET</p>
                        <p className="text-sm text-red-700">{rapport.commentaire_vr}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText size={14} className="inline mr-1" />
                            Contenu du rapport *
                        </label>
                        <textarea
                            value={contenu}
                            onChange={e => setContenu(e.target.value)}
                            rows={8}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nouveau fichier PDF (optionnel)
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={e => setFichier(e.target.files[0])}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/enseignant/rapports')}
                        className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Envoi...' : 'Re-soumettre'}
                    </button>
                </div>
            </div>
        </Layout>
    )
}