import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle, XCircle, History, Download, Eye } from 'lucide-react'

export default function RapportsAValider() {
    const [searchParams] = useSearchParams()
    const statutFiltre = searchParams.get('statut')

    const [rapports, setRapports] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [rejetId, setRejetId] = useState(null)
    const [commentaire, setCommentaire] = useState('')
    const [onglet, setOnglet] = useState('attente')

    useEffect(() => {
        chargerRapports()
    }, [])

    useEffect(() => {
        if (statutFiltre === 'a_valider') {
            setOnglet('attente')
        } else if (statutFiltre === 'valides') {
            setOnglet('historique')
        }
    }, [statutFiltre])

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

    const voirPDF = (rapport) => {
        if (rapport.fichier_pdf) {
            window.open(`http://127.0.0.1:8000/storage/${rapport.fichier_pdf}`, '_blank')
        }
    }

    const telechargerPDF = (rapport) => {
        if (rapport.fichier_pdf) {
            const link = document.createElement('a')
            link.href = `http://127.0.0.1:8000/storage/${rapport.fichier_pdf}`
            link.download = `rapport_${rapport.voyage?.destination}_${rapport.id}.pdf`
            link.click()
        }
    }

    const rapportsEnAttente = rapports.filter(r => r.statut === 'soumis')
    const rapportsHistorique = rapports.filter(r => r.statut !== 'soumis')

    const rapportsFiltres = () => {
        if (!statutFiltre || statutFiltre === 'a_valider') {
            return rapportsEnAttente
        }
        if (statutFiltre === 'valides') {
            return rapportsHistorique.filter(r => r.statut === 'valide')
        }
        return rapportsHistorique
    }

    const renderRapport = (rapport, avecActions = true) => {
        const statut = rapport.statut === 'valide' 
            ? { label: 'Validé', color: 'bg-green-100 text-green-700' }
            : rapport.statut === 'rejete'
            ? { label: 'Rejeté', color: 'bg-red-100 text-red-700' }
            : { label: 'Soumis', color: 'bg-blue-100 text-blue-700' }

        return (
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
                            {rapport.fichier_pdf && (
                                <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                    <FileText size={12} />
                                    PDF joint
                                </p>
                            )}
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                        {statut.label}
                    </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Contenu du rapport</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{rapport.contenu}</p>
                </div>

                {/* Boutons PDF */}
                {rapport.fichier_pdf && (
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => voirPDF(rapport)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-xl text-sm font-semibold hover:bg-blue-200 transition"
                        >
                            <Eye size={14} />
                            Voir le PDF
                        </button>
                        <button
                            onClick={() => telechargerPDF(rapport)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2 rounded-xl text-sm font-semibold hover:bg-green-200 transition"
                        >
                            <Download size={14} />
                            Télécharger
                        </button>
                    </div>
                )}

                {avecActions && rejetId === rapport.id && (
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

                {avecActions && (
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
                )}
            </div>
        )
    }

    const getTitre = () => {
        if (statutFiltre === 'a_valider') return 'Rapports à valider'
        if (statutFiltre === 'valides') return 'Rapports validés'
        return 'Rapports'
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{getTitre()}</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {onglet === 'attente' 
                            ? `${rapportsEnAttente.length} rapport(s) à valider` 
                            : `${rapportsHistorique.length} rapport(s) traité(s)`
                        }
                    </p>
                </div>

                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setOnglet('attente')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'attente' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        À valider ({rapportsEnAttente.length})
                    </button>
                    <button
                        onClick={() => setOnglet('historique')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${onglet === 'historique' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <History size={15} />
                        Historique ({rapportsHistorique.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : onglet === 'attente' ? (
                    rapportsEnAttente.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun rapport à valider</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rapportsEnAttente.map(rapport => renderRapport(rapport, true))}
                        </div>
                    )
                ) : (
                    rapportsHistorique.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rapportsFiltres().map(rapport => renderRapport(rapport, false))}
                        </div>
                    )
                )}
            </div>
        </Layout>
    )
}