import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Calendar, Users, Check, AlertCircle, ArrowLeft } from 'lucide-react'

export default function NouveauVoyageEtude() {
    const navigate = useNavigate()
    const [enseignants, setEnseignants] = useState([])
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingEnseignants, setLoadingEnseignants] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [form, setForm] = useState({
        destination: '',
        date_debut: '',
        date_fin: '',
        description: '',
    })

    useEffect(() => {
        // Charger les enseignants permanents
        api.get('/users')
            .then(res => {
                const permanents = res.data.filter(
                    u => u.role === 'enseignant' && u.statut === 'permanent'
                )
                setEnseignants(permanents)
            })
            .catch(() => {})
            .finally(() => setLoadingEnseignants(false))
    }, [])

    const toggleSelect = (id) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (selected.length === 0) {
            setError('Veuillez selectionner au moins un beneficiaire')
            return
        }
        setLoading(true)
        setError('')
        try {
            await api.post('/voyages-etudes', {
                ...form,
                enseignants: selected,
            })
            setSuccess(true)
            setTimeout(() => navigate('/vice-recteur/voyages-etudes'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la publication')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-green-100 p-5 rounded-full mb-4">
                        <Check size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Liste publiee !</h2>
                    <p className="text-gray-500">Les beneficiaires ont ete notifies.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Publier une liste de beneficiaires</h1>
                        <p className="text-gray-500 text-sm mt-1">Voyage d'etudes</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Informations voyage */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <MapPin size={18} className="text-blue-700" />
                            Informations du voyage
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                            <input type="text" value={form.destination}
                                onChange={e => setForm({ ...form, destination: e.target.value })}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Paris, France" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date debut *</label>
                                <input type="date" value={form.date_debut}
                                    onChange={e => setForm({ ...form, date_debut: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
                                <input type="date" value={form.date_fin}
                                    onChange={e => setForm({ ...form, date_fin: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Objectif du voyage..." />
                        </div>
                    </div>

                    {/* Sélection bénéficiaires */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Users size={18} className="text-blue-700" />
                            Selectionner les beneficiaires
                            {selected.length > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {selected.length} selectionne(s)
                                </span>
                            )}
                        </h2>

                        {loadingEnseignants ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : enseignants.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Aucun enseignant permanent trouve
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {enseignants.map(e => (
                                    <div key={e.id}
                                        onClick={() => toggleSelect(e.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                                            selected.includes(e.id)
                                                ? 'bg-blue-50 border border-blue-300'
                                                : 'bg-gray-50 border border-transparent hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                {e.prenom?.[0]}{e.nom?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{e.prenom} {e.nom}</p>
                                                <p className="text-xs text-gray-500">{e.ufr} · {e.type_profil}</p>
                                            </div>
                                        </div>
                                        {selected.includes(e.id) && (
                                            <Check size={16} className="text-blue-600" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="button"
                            onClick={() => navigate('/vice-recteur/voyages-etudes')}
                            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Publication...' : 'Publier la liste'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}