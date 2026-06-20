import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle, Upload, X, AlertCircle } from 'lucide-react'

export default function EnseignantNouveauRapport() {
    const { voyageId } = useParams()
    const navigate = useNavigate()

    const [fichier, setFichier] = useState(null)
    const [contenu, setContenu] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!fichier) {
            setError('Veuillez sélectionner votre rapport au format PDF')
            return
        }
        setLoading(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('voyage_id', voyageId)
            formData.append('contenu', contenu.trim() || 'Rapport de voyage (voir PDF joint)')
            formData.append('fichier_pdf', fichier)

            await api.post('/rapports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setSuccess(true)
            setTimeout(() => navigate('/enseignant/rapports'), 2000)
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
                    <p className="text-gray-500 text-center max-w-sm">
                        Votre rapport a été transmis au Chef de Departement comme justificatif de voyage.
                    </p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Soumettre mon rapport</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Rapport de retour de voyage d'études — sera transmis au Chef de Departement comme justificatif
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    {/* Zone upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rapport PDF <span className="text-red-500">*</span>
                        </label>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer"
                            onClick={() => document.getElementById('input-pdf-rapport').click()}
                        >
                            {fichier ? (
                                <div className="space-y-2">
                                    <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto">
                                        <FileText size={28} className="text-blue-700" />
                                    </div>
                                    <p className="font-semibold text-gray-800">{fichier.name}</p>
                                    <p className="text-xs text-gray-500">{(fichier.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        onClick={e => { e.stopPropagation(); setFichier(null) }}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="bg-gray-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto">
                                        <Upload size={28} className="text-gray-400" />
                                    </div>
                                    <p className="font-medium text-gray-600">Cliquez pour sélectionner votre rapport PDF</p>
                                    <p className="text-xs text-gray-400">Rédigez votre rapport (Word, etc.), exportez-le en PDF, puis téléversez-le ici</p>
                                </div>
                            )}
                        </div>
                        <input
                            id="input-pdf-rapport"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={e => setFichier(e.target.files[0])}
                        />
                    </div>

                    {/* Note optionnelle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Note ou résumé (optionnel)
                        </label>
                        <textarea
                            value={contenu}
                            onChange={e => setContenu(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Un bref résumé du rapport joint (optionnel)..."
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
                        disabled={loading || !fichier}
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