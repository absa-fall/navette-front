import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SignaturePad from '../../components/SignaturePad'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Printer, Loader2 } from 'lucide-react'

export default function ListePublieeDocument() {
    const { voyageId } = useParams()
    const { user } = useAuth()
    const [voyage, setVoyage] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/voyages-etudes/${voyageId}`)
            .then(res => setVoyage(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [voyageId])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
        )
    }

    if (!voyage) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Liste introuvable.
            </div>
        )
    }

    const beneficiaires = voyage.beneficiaires || []
  const peutSigner = false
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

              <div className="flex justify-between items-start mb-2">
    <div className="text-[11px] leading-relaxed">
        <p className="font-bold">REPUBLIQUE DU SENEGAL</p>
        <p className="italic">Un Peuple-Un But-Une Foi</p>
        <p>Ministère de l'Enseignement supérieur,</p>
        <p>de la Recherche et de l'Innovation</p>
        <br />
        <p className="font-bold">UNIVERSITE ALIOUNE DIOP</p>
        <p className="italic text-[10px]">« L'excellence est ma constance, l'éthique ma vertu »</p>
    </div>
    <div className="text-right text-[12px]">
        <p>Bambey, le {voyage.created_at ? new Date(voyage.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</div>

<div className="flex justify-center mb-6 mt-2 print:mb-4">
    <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
</div>

                <h1 className="text-lg font-bold text-blue-800 mb-1">
                    Liste des bénéficiaires publiée — {voyage.destination}
                </h1>
                <p className="text-sm text-gray-600 mb-6 print:mb-4">
                    Du {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} au {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                    {' '}— Total : {beneficiaires.length} bénéficiaire(s)
                </p>

                <table className="w-full border-collapse text-[12px] mb-10 print:mb-6">
                    <thead>
                        <tr>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">N°</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Prénom</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Nom</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">UFR</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Département</th>
                        </tr>
                    </thead>
                    <tbody>
                        {beneficiaires.map((b, i) => (
                            <tr key={b.id}>
                                <td className="border border-gray-800 px-3 py-1.5">{i + 1}.</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.prenom}</td>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold">{b.enseignant?.nom?.toUpperCase()}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.ufr || '-'}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.departement || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-16 print:mt-8">
                   <SignaturePad
    storageKey="signature_vice_recteur"
    label="Le Vice-Recteur"
    readOnly={!peutSigner}
    initialValue={voyage.signature_liste_preliminaire}
/>
                </div>

                <div className="text-center text-[10px] text-gray-500 mt-12 print:mt-6 border-t pt-3 print:pt-2">
                    UADB Mobilité — Généré le {new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
        </div>
    )
}