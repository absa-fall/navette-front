import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle, XCircle } from 'lucide-react'

export default function RapportsAValider() {
    const [rapports, setRapports] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [rejetId, setRejetId] = useState(null)
    const [commentaire, setCommentaire] = useState('')

    useEffect(() => {
        chargerRapports()
    }, [])

    const chargerRapports = () => {
        api.get('/rapports')
            .then(res => setRapports(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const valider = async (id) => {
        setActionLoading(id)
        try {
            await api.patch(`/rapports/${id}/valider`)
            chargerRapports()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const rejeter = async (id) => {
        if (!commentaire) {
            alert('Veuillez saisir un motif')
            return
        }
        setActionLoading(id)
        try {
            await api.patch(`/rapports/${id}/rejeter`, {
                commentaire_vr: commentaire
            })
            setRejetId(null)
            setCommentaire('')
            chargerRapports()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Rapports à valider</h1>
                    <p className="text-gray-500 text-sm mt-1">{rapports.length} rapport(s) soumis</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : rapports.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun rapport à valider</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rapports.map(rapport => (
                            <div key={rapport.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <FileText size={20} className="text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Rapport — {rapport.voyage?.destination}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {rapport.enseignant?.prenom} {rapport.enseignant?.nom}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Déposé le {new Date(rapport.date_depot).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                                        Soumis
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Contenu du rapport</p>
                                    <p className="text-sm text-gray-700 line-clamp-3">{rapport.contenu}</p>
                                </div>

                                {rejetId === rapport.id && (
                                    <div className="mb-4">
                                        <textarea
                                            value={commentaire}
                                            onChange={e => setCommentaire(e.target.value)}
                                            rows={2}
                                            className="w-full border border-red-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                                            placeholder="Motif du rejet ou compléments demandés..."
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {rejetId === rapport.id ? (
                                        <>
                                            <button
                                                onClick={() => { setRejetId(null); setCommentaire('') }}
                                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={() => rejeter(rapport.id)}
                                                disabled={actionLoading === rapport.id}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {actionLoading === rapport.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                                Confirmer rejet
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setRejetId(rapport.id)}
                                                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                                            >
                                                <XCircle size={16} />
                                                Rejeter
                                            </button>
                                            <button
                                                onClick={() => valider(rapport.id)}
                                                disabled={actionLoading === rapport.id}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                {actionLoading === rapport.id
                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <CheckCircle size={16} />
                                                }
                                                Valider
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}