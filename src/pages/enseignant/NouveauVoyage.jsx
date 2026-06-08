import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Calendar, FileText, CheckCircle } from 'lucide-react'

export default function EnseignantNouveauVoyage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        destination: '',
        date_debut: '',
        date_fin: '',
        objet: '',
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!form.destination || !form.date_debut || !form.date_fin || !form.objet) {
            setError('Veuillez remplir tous les champs')
            return
        }
        setLoading(true)
        setError('')
        try {
            await api.post('/voyages', form)
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Demande soumise !</h2>
                    <p className="text-gray-500">Votre demande a été transmise au Vice-Recteur.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Nouveau voyage d'études</h1>
                    <p className="text-gray-500 text-sm mt-1">La demande sera soumise au Vice-Recteur</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={14} className="inline mr-1" />
                            Destination <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.destination}
                            onChange={e => setForm({ ...form, destination: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Ex: Paris, France"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={14} className="inline mr-1" />
                                Date début <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.date_debut}
                                onChange={e => setForm({ ...form, date_debut: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={14} className="inline mr-1" />
                                Date fin <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.date_fin}
                                onChange={e => setForm({ ...form, date_fin: e.target.value })}
                                min={form.date_debut || new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText size={14} className="inline mr-1" />
                            Objet du voyage <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.objet}
                            onChange={e => setForm({ ...form, objet: e.target.value })}
                            rows={4}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            placeholder="Décrivez l'objet et les objectifs de ce voyage..."
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
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Envoi...' : 'Soumettre au Vice-Recteur'}
                    </button>
                </div>
            </div>
        </Layout>
    )
}