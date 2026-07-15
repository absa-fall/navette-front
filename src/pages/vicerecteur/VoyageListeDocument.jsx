import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import SignaturePad from '../../components/SignaturePad'
import { Printer, Loader2, Send } from 'lucide-react'

export default function VoyageListeDocument() {
    const { voyageId } = useParams()
    const { user } = useAuth()
    const [voyage, setVoyage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [signature, setSignature] = useState(null)
    const [transmission, setTransmission] = useState(false)

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

    const estBrouillon = voyage.statut_liste === 'brouillon'
    const peutSigner = user?.role === 'vice_recteur' && voyage.vice_recteur_id === user?.id && estBrouillon

    const transmettre = async () => {
        if (!signature) return
        setTransmission(true)
        try {
            await api.patch(`/voyages-etudes/${voyage.id}/transmettre-liste`, {
                signature: signature
            })
            setVoyage(prev => ({ ...prev, statut_liste: 'publiee' }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmission(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">

            {/* Boutons d'action */}
            <div className="flex justify-center gap-3 mb-6 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                >
                    <Printer size={16} /> Imprimer / Télécharger
                </button>

                {peutSigner && (
                    <button
                        onClick={transmettre}
                        disabled={!signature || transmission}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                        {transmission
                            ? <Loader2 size={16} className="animate-spin" />
                            : <Send size={16} />}
                        Transmettre aux Chefs de Département
                    </button>
                )}
            </div>

            {/* Document */}
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full font-serif text-gray-900">

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
                        <p>Bambey, le {new Date(voyage.date_publication).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <hr className="border-gray-800 mb-4" />

                <div className="text-center font-bold text-[16px] underline tracking-wide mb-6">
                    LISTE DES BENEFICIAIRES — {voyage.motif?.toUpperCase()}
                </div>

                {estBrouillon && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 text-xs mb-6 print:hidden">
                        Cette liste n'a pas encore été transmise. Signez ci-dessous puis cliquez sur « Transmettre aux Chefs de Département ».
                    </div>
                )}

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
                        {voyage.beneficiaires?.map((b, i) => (
                            <tr key={b.id}>
                                <td className="border border-gray-800 px-3 py-1.5">{i + 1}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.prenom}</td>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold">{b.enseignant?.nom?.toUpperCase()}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.ufr}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-12">
                    <div className="text-center text-[12px]">
                        <p className="font-bold">LE VICE-RECTEUR</p>
                        <SignaturePad
                            storageKey={`signature_vr_liste_${voyage.id}`}
                            label={voyage.viceRecteur ? `${voyage.viceRecteur.prenom} ${voyage.viceRecteur.nom}` : 'Le Vice-Recteur'}
                            readOnly={!peutSigner}
                            onSaved={setSignature}
                        />
                    </div>
                </div>

                <div className="text-center text-[10px] text-gray-600 mt-12 border-t pt-3">
                    <p>Tél. : (221) 33 973 30 86 // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>
        </div>
    )
}