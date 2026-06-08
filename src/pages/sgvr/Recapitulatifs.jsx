import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { CreditCard, Plus, CheckCircle } from 'lucide-react'

export default function Recapitulatifs() {
    const [recaps, setRecaps] = useState([])
    const [loading, setLoading] = useState(true)
    const [genererModal, setGenererModal] = useState(false)
    const [form, setForm] = useState({ semaine_debut: '', semaine_fin: '' })
    const [actionLoading, setActionLoading] = useState(false)
    const [detail, setDetail] = useState(null)

    useEffect(() => {
        chargerRecaps()
    }, [])

    const chargerRecaps = () => {
        api.get('/recapitulatifs')
            .then(res => setRecaps(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const generer = async () => {
        if (!form.semaine_debut || !form.semaine_fin) {
            alert('Veuillez remplir les deux dates')
            return
        }
        setActionLoading(true)
        try {
            const res = await api.post('/recapitulatifs/generer', form)
            setDetail(res.data)
            setGenererModal(false)
            chargerRecaps()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(false)
        }
    }

    const valider = async (id) => {
        try {
            await api.patch(`/recapitulatifs/${id}/valider`)
            chargerRecaps()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Récapitulatifs hebdomadaires</h1>
                        <p className="text-gray-500 text-sm mt-1">{recaps.length} récapitulatif(s)</p>
                    </div>
                    <button
                        onClick={() => setGenererModal(true)}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                        <Plus size={18} />
                        Générer
                    </button>
                </div>

                {/* Modal générer */}
                {genererModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Générer un récapitulatif</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Début de semaine</label>
                                    <input
                                        type="date"
                                        value={form.semaine_debut}
                                        onChange={e => setForm({ ...form, semaine_debut: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fin de semaine</label>
                                    <input
                                        type="date"
                                        value={form.semaine_fin}
                                        onChange={e => setForm({ ...form, semaine_fin: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setGenererModal(false)}
                                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={generer}
                                    disabled={actionLoading}
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Générer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Résultat généré */}
                {detail && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                        <p className="font-semibold text-green-800 mb-2">✅ Récapitulatif généré</p>
                        <p className="text-sm text-green-700">Total : <strong>{Number(detail.montant_total).toLocaleString()} FCFA</strong></p>
                        <p className="text-sm text-green-700">{detail.nombre_registres} registre(s) traité(s)</p>
                    </div>
                )}

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recaps.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun récapitulatif</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recaps.map(recap => (
                            <div key={recap.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <CreditCard size={20} className="text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Semaine du {new Date(recap.semaine_debut).toLocaleDateString('fr-FR')} au {new Date(recap.semaine_fin).toLocaleDateString('fr-FR')}
                                            </p>
                                            <p className="text-sm font-bold text-blue-700 mt-0.5">
                                                {Number(recap.montant_total).toLocaleString()} FCFA
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                        recap.statut === 'valide'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {recap.statut === 'valide' ? '✓ Validé' : 'Brouillon'}
                                    </span>
                                </div>

                                {recap.statut === 'brouillon' && (
                                    <button
                                        onClick={() => valider(recap.id)}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                                    >
                                        <CheckCircle size={16} />
                                        Valider le récapitulatif
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}