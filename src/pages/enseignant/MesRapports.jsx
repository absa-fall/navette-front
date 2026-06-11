import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, CheckCircle, XCircle, Clock, RefreshCw, Download, Eye } from 'lucide-react'

const statutConfig = {
    soumis: { label: 'Soumis', color: 'bg-blue-100 text-blue-700', icon: Clock },
    valide: { label: 'Validé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function EnseignantMesRapports() {
    const navigate = useNavigate()
    const [rapports, setRapports] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        api.get('/rapports')
            .then(res => setRapports(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

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

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mes rapports de voyage</h1>
                    <p className="text-gray-500 text-sm mt-1">{rapports.length} rapport(s)</p>
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
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun rapport</h3>
                        <p className="text-gray-400 text-sm">Vos rapports apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rapports.map(rapport => {
                            const statut = statutConfig[rapport.statut] || statutConfig['soumis']
                            const Icon = statut.icon
                            return (
                                <div key={rapport.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => setSelected(selected === rapport.id ? null : rapport.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-blue-100 p-3 rounded-xl">
                                                    <FileText size={20} className="text-blue-700" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        Rapport — {rapport.voyage?.destination}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5">
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
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                                                <Icon size={12} />
                                                {statut.label}
                                            </span>
                                        </div>
                                    </div>

                                    {selected === rapport.id && (
                                        <div className="border-t border-gray-100 p-5 space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-xs font-semibold text-gray-500 mb-2">CONTENU</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{rapport.contenu}</p>
                                            </div>

                                            {/* Boutons PDF */}
                                            {rapport.fichier_pdf && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => voirPDF(rapport)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-200 transition"
                                                    >
                                                        <Eye size={16} />
                                                        Voir le PDF
                                                    </button>
                                                    <button
                                                        onClick={() => telechargerPDF(rapport)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-200 transition"
                                                    >
                                                        <Download size={16} />
                                                        Télécharger
                                                    </button>
                                                </div>
                                            )}

                                            {rapport.statut === 'rejete' && rapport.commentaire_vr && (
                                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                    <p className="text-xs font-semibold text-red-500 mb-2">COMMENTAIRE DU VICE-RECTEUR</p>
                                                    <p className="text-sm text-red-700">{rapport.commentaire_vr}</p>
                                                </div>
                                            )}

                                            {rapport.statut === 'rejete' && (
                                                <button
                                                    onClick={() => navigate(`/enseignant/rapports/resoumettre/${rapport.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                                                >
                                                    <RefreshCw size={16} />
                                                    Re-soumettre le rapport
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}