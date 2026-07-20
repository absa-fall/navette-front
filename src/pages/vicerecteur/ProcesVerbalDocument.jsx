import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Printer, Loader2, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import SignaturePad from '../../components/SignaturePad'

function formatDate(d) {
    if (!d) return '…………………'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()
}

export default function ProcesVerbalDocument() {
    const { annee } = useParams()
    const { user } = useAuth()
    const [pv, setPv] = useState(null)
    const [loading, setLoading] = useState(true)
    const [transmission, setTransmission] = useState(false)

    const charger = () => {
        api.get(`/proces-verbaux/${annee}`)
            .then(res => setPv(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => { charger() }, [annee])

    const estSigneParVr = !!pv?.signe_vr_le
    const estTransmis = !!pv?.transmis_le
    const estSigneParRecteur = pv?.statut === 'signe'
    const peutSignerVr = user?.role === 'vice_recteur' && !estSigneParVr
    const peutSignerRecteur = user?.role === 'recteur' && estTransmis && !estSigneParRecteur

    const signerVr = async (signatureDataUrl) => {
        if (!signatureDataUrl) return
        try {
            const res = await api.post(`/proces-verbaux/${annee}/signer-vr`, { signature: signatureDataUrl })
            setPv(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la signature.')
        }
    }

    const signerRecteur = async (signatureDataUrl) => {
        if (!signatureDataUrl) return
        try {
            const res = await api.post(`/proces-verbaux/${annee}/signer-recteur`, { signature: signatureDataUrl })
            setPv(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la signature.')
        }
    }

    const transmettre = async () => {
        setTransmission(true)
        try {
            const res = await api.post(`/proces-verbaux/${annee}/transmettre`)
            setPv(res.data)
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission.')
        } finally {
            setTransmission(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
        )
    }

    if (!pv) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Procès-verbal introuvable.
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 px-4 print:py-0 print:px-0">

            <style>{`
                @media print {
                    @page { size: A4; margin: 8mm; }
                    html, body { height: auto !important; }
                }
            `}</style>

            <div className="flex justify-center gap-3 mb-6 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                >
                    <Printer size={16} /> Imprimer / Télécharger
                </button>
            </div>

            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full print:px-8 print:py-4 font-serif text-gray-900 pb-24 print:pb-4">

                {/* En-tête */}
                <div className="text-center text-[12px] leading-relaxed mb-6 print:mb-4">
                    <p className="font-bold">REPUBLIQUE DU SENEGAL</p>
                    <p className="italic">Un Peuple - Un But - Une Foi</p>
                    <p>Ministère de l'Enseignement supérieur,</p>
                    <p>de la Recherche et de l'Innovation</p>
                    <p>******</p>
                    <p className="font-bold">UNIVERSITE ALIOUNE DIOP</p>
                    <div className="flex flex-col items-center mt-3">
                        <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                        <p className="font-bold text-[12px] mt-1">RECTORAT</p>
                    </div>
                </div>

                <hr className="border-gray-800 mb-5 print:mb-3" />

                <div className="text-center font-bold text-[14px] tracking-widest mb-6 print:mb-4">
                    PROCES-VERBAL — ANNEE {pv.annee}
                </div>

                {/* Contenu rédigé */}
                <div className="mb-8 print:mb-5 text-[12px] leading-relaxed whitespace-pre-wrap">
                    {pv.contenu}
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-start mt-10 print:mt-6 gap-8">
                    <div className="text-center text-[12px] flex-1">
                        <p className="font-bold">LE VICE-RECTEUR,</p>
                        <SignaturePad
                            storageKey={`pv-signature-vr-${annee}`}
                            label={pv.finalise_par ? `${pv.finalise_par.prenom} ${pv.finalise_par.nom?.toUpperCase()}` : 'Vice-Recteur'}
                            initialValue={pv.signature_vr}
                            readOnly={!peutSignerVr}
                            onSaved={signerVr}
                        />
                    </div>
                    <div className="text-center text-[12px] flex-1">
                        <p className="font-bold">LE RECTEUR,</p>
                        <SignaturePad
                            storageKey={`pv-signature-recteur-${annee}`}
                            label="Recteur"
                            initialValue={pv.signature_recteur}
                            readOnly={!peutSignerRecteur}
                            onSaved={signerRecteur}
                        />
                    </div>
                </div>

                <div className="text-center text-[10px] text-gray-600 mt-12 print:mt-6 border-t pt-3 print:pt-2">
                    <p>Tél. : (221) 33 973 30 86 // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>

            {/* Bouton transmettre — VR uniquement, une fois signé, tant que non transmis */}
            {user?.role === 'vice_recteur' && estSigneParVr && !estTransmis && (
                <div className="print:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
                    <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-gray-600 hidden sm:block">
                            Signature enregistrée — prêt à transmettre au Recteur.
                        </p>
                        <button
                            onClick={transmettre}
                            disabled={transmission}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                            {transmission ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Transmettre au Recteur
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}