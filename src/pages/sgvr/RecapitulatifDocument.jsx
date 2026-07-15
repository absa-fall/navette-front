import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Printer, Loader2 } from 'lucide-react'

const LABELS_TRAJET = { aller: 'Aller', retour: 'Retour', aller_retour: 'Aller-retour' }

const getTypeTrajetResume = (p) => {
    const types = [...new Set((p.trajets || []).map(t => t.type_trajet))]
    return types.map(t => LABELS_TRAJET[t] || t).join(', ') || '-'
}
const getVillesResume = (p) => {
    const villes = (p.trajets || []).map(t => t.trajet)
    return [...new Set(villes)].join(' | ') || '-'
}

export default function RecapitulatifDocument() {
    const { recapId } = useParams()
    const [recap, setRecap] = useState(null)
    const [detail, setDetail] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/recapitulatifs/${recapId}`)
            .then(res => {
                setRecap(res.data)
                setDetail(res.data.detail_par_personne || [])
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [recapId])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
        )
    }

    if (!recap) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Récapitulatif introuvable.
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 px-4 print:py-0 print:px-0">

            {/* Style impression : format A4 propre */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 8mm; }
                    html, body { height: auto !important; }
                }
            `}</style>

            <div className="flex justify-center mb-6 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                >
                    <Printer size={16} /> Imprimer / Télécharger
                </button>
            </div>

            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full print:px-8 print:py-4 font-serif text-gray-900">

                <div className="text-center text-[11px] leading-relaxed mb-6 print:mb-4">
                    <p className="font-bold">REPUBLIQUE DU SENEGAL</p>
                    <p className="italic">Un Peuple-Un But-Une Foi</p>
                    <p>Ministère de l'Enseignement supérieur,</p>
                    <p>de la Recherche et de l'Innovation</p>
                    <br />
                    <p className="font-bold">UNIVERSITE ALIOUNE DIOP</p>
                    <p className="italic text-[10px]">« L'excellence est ma constance, l'éthique ma vertu »</p>

                    <div className="flex justify-center mt-3">
                        <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                    </div>
                </div>

                <h2 className="text-lg font-bold text-blue-800 mb-1">Récapitulatif Hebdomadaire</h2>
                <p className="text-sm text-gray-600 mb-6 print:mb-4">
                    Semaine du {new Date(recap.semaine_debut).toLocaleDateString('fr-FR')} au {new Date(recap.semaine_fin).toLocaleDateString('fr-FR')}
                </p>

                <table className="w-full border-collapse text-[12px] mb-10 print:mb-6">
                    <thead>
                        <tr>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Nom</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Prénom</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">UFR</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Type</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Type de trajet</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Villes</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-center">Trajets</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detail.map((p, i) => (
                            <tr key={i}>
                                <td className="border border-gray-800 px-3 py-1.5">{p.nom}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{p.prenom}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{p.ufr || '-'}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{p.type_profil || '-'}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{getTypeTrajetResume(p)}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{getVillesResume(p)}</td>
                                <td className="border border-gray-800 px-3 py-1.5 text-center">{p.nombre_trajets}</td>
                                <td className="border border-gray-800 px-3 py-1.5 text-right">{Number(p.montant_total).toLocaleString()} FCFA</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="text-center text-[10px] text-gray-500 mt-12 print:mt-6 border-t pt-3 print:pt-2">
                    UADB Mobilité — Généré le {new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
        </div>
    )
}