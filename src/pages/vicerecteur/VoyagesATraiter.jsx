import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function VoyagesATraiter() {
    const [voyages, setVoyages] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [rejetId, setRejetId] = useState(null)
    const [commentaire, setCommentaire] = useState('')

    useEffect(() => {
        chargerVoyages()
    }, [])

    const chargerVoyages = () => {
        api.get('/voyages')
            .then(res => setVoyages(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const approuver = async (id) => {
        setActionLoading(id)
        try {
            await api.patch(`/voyages/${id}/approuver`)
            chargerVoyages()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const rejeter = async (id) => {
        if (!commentaire) {
            alert('Veuillez saisir un motif de rejet')
            return
        }
        setActionLoading(id)
        try {
            await api.patch(`/voyages/${id}/rejeter`, {
                commentaire_vr: commentaire
            })
            setRejetId(null)
            setCommentaire('')
            chargerVoyages()
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
                    <h1 className="text-2xl font-bold text-gray-800">Voyages d'études à traiter</h1>
                    <p className="text-gray-500 text-sm mt-1">{voyages.length} demande(s) en attente</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : voyages.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucune demande en attente</h3>
                        <p className="text-gray-400 text-sm">Toutes les demandes ont été traitées</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {voyages.map(voyage => (
                            <div key={voyage.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-green-100 p-3 rounded-xl">
                                            <MapPin size={20} className="text-green-700" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{voyage.destination}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                Du {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Enseignant : {voyage.enseignant?.prenom} {voyage.enseignant?.nom}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">
                                        <Clock size={12} />
                                        En attente
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Objet du voyage</p>
                                    <p className="text-sm text-gray-700">{voyage.objet}</p>
                                </div>

                                {rejetId === voyage.id && (
                                    <div className="mb-4">
                                        <textarea
                                            value={commentaire}
                                            onChange={e => setCommentaire(e.target.value)}
                                            rows={2}
                                            className="w-full border border-red-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                                            placeholder="Motif du rejet..."
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {rejetId === voyage.id ? (
                                        <>
                                            <button
                                                onClick={() => { setRejetId(null); setCommentaire('') }}
                                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={() => rejeter(voyage.id)}
                                                disabled={actionLoading === voyage.id}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {actionLoading === voyage.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                                Confirmer rejet
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setRejetId(voyage.id)}
                                                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                                            >
                                                <XCircle size={16} />
                                                Rejeter
                                            </button>
                                            <button
                                                onClick={() => approuver(voyage.id)}
                                                disabled={actionLoading === voyage.id}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                {actionLoading === voyage.id
                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <CheckCircle size={16} />
                                                }
                                                Approuver
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