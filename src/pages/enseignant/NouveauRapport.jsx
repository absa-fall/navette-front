import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle } from 'lucide-react'

export default function EnseignantNouveauRapport() {
    const { voyageId } = useParams()
    const navigate = useNavigate()
    const [contenu, setContenu] = useState('')
    const [fichier, setFichier] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!contenu) {
            setError('Veuillez rédiger le contenu du rapport')
            return
        }
        setLoading(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('voyage_id', voyageId)
            formData.append('contenu', contenu)
            if (fichier) formData.append('fichier_pdf', fichier)

            await api.post('/rapports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setSuccess(true)
            setTimeout(() => navigate('/enseignant/voyages'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la soumission')
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Rapport soumis !</h2>
                    <p className="text-gray-500">Votre rapport a été transmis au Vice-Recteur.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Soumettre mon rapport</h1>
                    <p className="text-gray-500 text-sm mt-1">Rapport de retour de voyage d'études</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText size={14} className="inline mr-1" />
                            Contenu du rapport <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={contenu}
                            onChange={e => setContenu(e.target.value)}
                            rows={8}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Rédigez votre rapport de retour de voyage..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fichier PDF (optionnel)
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
                        onClick={() => navigate('/enseignant/voyages')}
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
                        {loading ? 'Envoi...' : 'Soumettre le rapport'}
                    </button>
                </div>
            </div>
        </Layout>
    )
}