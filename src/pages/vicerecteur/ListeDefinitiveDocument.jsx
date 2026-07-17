import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SignaturePad from '../../components/SignaturePad'
import api from '../../api/axios'
import { Printer, Loader2 } from 'lucide-react'

export default function ListeDefinitiveDocument() {
    const { voyageId } = useParams()
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

    const definitifs = (voyage.beneficiaires || []).filter(b => b.dans_liste_definitive)

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 px-4 print:py-0 print:px-0">
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

                <div className="flex justify-between items-start mb-5">
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
                       <p>Bambey, le {voyage.date_liste_definitive ? new Date(voyage.date_liste_definitive).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="flex justify-center mb-3">
                    <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                </div>

                <hr className="border-gray-800 mb-4" />

                <div className="text-center font-bold text-[16px] underline tracking-wide mb-6">
                    LISTE DEFINITIVE DES BENEFICIAIRES — {voyage.destination?.toUpperCase()}
                </div>

                <p className="text-sm text-gray-600 mb-6 text-center">
                    Total : {definitifs.length} bénéficiaire(s)
                </p>

                <table className="w-full border-collapse text-[11px] mb-8">
                    <thead>
                        <tr>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">N°</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Prénom</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Nom</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">UFR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {definitifs.map((b, i) => (
                            <tr key={b.id}>
                                <td className="border border-gray-800 px-3 py-1.5">{i + 1}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.prenom}</td>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold">{b.enseignant?.nom?.toUpperCase()}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.ufr || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-12">
                    <SignaturePad
                        storageKey={`signature_vr_definitive_${voyage.id}`}
                        label="Le Vice-Recteur"
                        readOnly={true}
                        initialValue={voyage.signature_liste_definitive}
                    />
                </div>

                <div className="text-center text-[10px] text-gray-600 mt-12 border-t pt-3">
                    <p>Tél. : (221) 33 973 30 86 // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>
        </div>
    )
}