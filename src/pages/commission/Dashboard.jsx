import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle, AlertCircle, Eye, MessageSquare, X } from 'lucide-react'

export default function CommissionDashboard() {
    const [dossiers, setDossiers]           = useState([])
    const [loading, setLoading]             = useState(true)
    const [avisOuvert, setAvisOuvert]       = useState(null)
    const [commentaire, setCommentaire]     = useState('')
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage]             = useState('')
    const [error, setError]                 = useState('')

    useEffect(() => { fetchDossiers() }, [])

    const fetchDossiers = async () => {
        try {
            const res = await api.get('/voyages-etudes/dossiers-a-valider')
            setDossiers(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 3000)
    }

    const donnerAvis = async (beneficiaireId, avis) => {
        setActionLoading('avis_' + beneficiaireId + '_' + avis)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/avis`, {
                avis,
                commentaire: commentaire || null,
            })
            showMsg(avis === 'valide' ? 'Dossier valide' : 'Dossier rejete')
            setAvisOuvert(null)
            setCommentaire('')
            fetchDossiers()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    const enAttente  = dossiers.filter(d => !d.avis?.some(a => a.user?.role === 'commission'))
    const traites    = dossiers.filter(d =>  d.avis?.some(a => a.user?.role === 'commission'))

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Commission — Voyages d'etudes</h1>
                    <p className="text-gray-500 text-sm mt-1">Validation des dossiers de justificatifs</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <FileText size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{enAttente.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Dossiers a traiter</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{traites.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Dossiers traites</p>
                    </div>
                </div>

                {/* Messages */}
                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : dossiers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun dossier</h3>
                        <p className="text-gray-400 text-sm">Les dossiers transmis par les Chefs de Departement apparaitront ici</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Dossiers en attente */}
                        {enAttente.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-orange-400 rounded-full inline-block"></span>
                                    A traiter ({enAttente.length})
                                </h2>
                                {enAttente.map(d => {
                                    const isAvisOuvert = avisOuvert === d.id
                                    const avisVR = d.avis?.find(a => a.user?.role === 'vice_recteur')

                                    return (
                                        <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                            {/* Enseignant + voyage */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                                        {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                        <p className="text-xs text-gray-500">{d.enseignant?.ufr}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-700">{d.voyage?.destination}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(d.voyage?.date_debut).toLocaleDateString('fr-FR')} - {new Date(d.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Justificatifs */}
                                            {d.justificatifs?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Justificatifs ({d.justificatifs.length}) :</p>
                                                    {d.justificatifs.map(j => (
                                                        <button
                                                            key={j.id}
                                                            onClick={() => window.open(`http://127.0.0.1:8000/storage/${j.fichier_pdf}`, '_blank')}
                                                            className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                                                        >
                                                            <Eye size={14} /> {j.nom_original || 'Fichier PDF'}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Avis du VR si déjà donné */}
                                            {avisVR && (
                                                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${avisVR.avis === 'valide' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {avisVR.avis === 'valide' ? <CheckCircle size={14} /> : <X size={14} />}
                                                    Avis VR : <span className="font-semibold">{avisVR.avis === 'valide' ? 'Valide' : 'Rejete'}</span>
                                                    {avisVR.commentaire && <span className="text-xs ml-1">— {avisVR.commentaire}</span>}
                                                </div>
                                            )}

                                            {/* Formulaire avis commission */}
                                            <div className="space-y-2">
                                                {isAvisOuvert && (
                                                    <textarea
                                                        value={commentaire}
                                                        onChange={e => setCommentaire(e.target.value)}
                                                        placeholder="Commentaire (optionnel)..."
                                                        rows={2}
                                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                )}
                                                <div className="flex gap-2 flex-wrap">
                                                    {!isAvisOuvert ? (
                                                        <button
                                                            onClick={() => setAvisOuvert(d.id)}
                                                            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                                                        >
                                                            <MessageSquare size={14} /> Donner mon avis
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => donnerAvis(d.id, 'valide')}
                                                                disabled={actionLoading === 'avis_' + d.id + '_valide'}
                                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                                            >
                                                                {actionLoading === 'avis_' + d.id + '_valide'
                                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    : <CheckCircle size={14} />
                                                                }
                                                                Valider le dossier
                                                            </button>
                                                            <button
                                                                onClick={() => donnerAvis(d.id, 'rejete')}
                                                                disabled={actionLoading === 'avis_' + d.id + '_rejete'}
                                                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                                            >
                                                                {actionLoading === 'avis_' + d.id + '_rejete'
                                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    : <X size={14} />
                                                                }
                                                                Rejeter le dossier
                                                            </button>
                                                            <button
                                                                onClick={() => { setAvisOuvert(null); setCommentaire('') }}
                                                                className="text-gray-400 hover:text-gray-600 px-2"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Dossiers traités */}
                        {traites.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                                    Traites ({traites.length})
                                </h2>
                                {traites.map(d => {
                                    const monAvis = d.avis?.find(a => a.user?.role === 'commission')
                                    return (
                                        <div key={d.id} className={`rounded-2xl border p-4 flex items-center justify-between ${
                                            monAvis?.avis === 'valide'
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 font-bold text-xs border border-gray-200">
                                                    {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                    <p className="text-xs text-gray-500">{d.voyage?.destination}</p>
                                                    {monAvis?.commentaire && (
                                                        <p className="text-xs text-gray-500 mt-0.5">"{monAvis.commentaire}"</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                monAvis?.avis === 'valide'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {monAvis?.avis === 'valide' ? 'Valide' : 'Rejete'}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    )
}