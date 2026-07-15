import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import SignaturePad from '../../components/SignaturePad'
import { Printer, Loader2, Send, CheckCircle } from 'lucide-react'

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
    autres: 'Autres',
}

export default function OrdreMissionDocument() {
    const { ordreId } = useParams()
    const { user } = useAuth()
    const [ordre, setOrdre] = useState(null)
    const [loading, setLoading] = useState(true)

    // Étape 1 : brouillon de signature (dessinée mais pas encore transmise)
    const [signatureDraft, setSignatureDraft] = useState(null)
    // Étape 2 : transmission au chauffeur
    const [transmissionLoading, setTransmissionLoading] = useState(false)
    const [transmissionErreur, setTransmissionErreur] = useState('')
    const [transmissionOk, setTransmissionOk] = useState(false)

    useEffect(() => {
        setSignatureDraft(null)
    setTransmissionOk(false)
    setTransmissionErreur('')
    setLoading(true)

    api.get(`/ordres-mission/${ordreId}`)
        .then(res => setOrdre(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
}, [ordreId])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
        )
    }

    if (!ordre) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Ordre de mission introuvable.
            </div>
        )
    }

    const dateDepart = new Date(ordre.date_depart).toLocaleDateString('fr-FR')
    const dateRetour = ordre.date_retour
        ? new Date(ordre.date_retour).toLocaleDateString('fr-FR')
        : '___________'

    const peutSigner = user?.role === 'sg_drh'

    // L'ordre est déjà officiellement signé et transmis côté serveur
    const dejaTransmis = ['transmis_chauffeur', 'execute'].includes(ordre.statut) || transmissionOk

    
    const signatureAffichee = dejaTransmis
    ? signatureDraft
    : (peutSigner ? signatureDraft : null)

    const transmettreAuChauffeur = async () => {
        setTransmissionLoading(true)
        setTransmissionErreur('')
        try {
            await api.patch(`/ordres-mission/${ordre.id}/signer`, {
                chauffeur_id: ordre.chauffeur_id,
                signature: signatureDraft,
            })
            setTransmissionOk(true)
        } catch (err) {
            setTransmissionErreur(err.response?.data?.message || 'Erreur lors de la transmission.')
        } finally {
            setTransmissionLoading(false)
        }
    }

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

            <div className="doc-print max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full print:px-8 print:py-4 font-serif text-gray-900">

                <div className="flex justify-between items-start mb-5 print:mb-3">
                    <div className="text-[11px] leading-relaxed">
                        <p className="font-bold">REPUBLIQUE DU SENEGAL</p>
                        <p className="italic">Un Peuple-Un But-Une Foi</p>
                        <p>Ministère de l'Enseignement supérieur,</p>
                        <p>de la Recherche et de l'Innovation</p>
                        <br className="print:hidden" />
                        <p className="font-bold">UNIVERSITE ALIOUNE DIOP</p>
                        <p className="italic text-[10px]">« L'excellence est ma constance, l'éthique ma vertu »</p>
                    </div>
                    <div className="text-right text-[12px]">
                        <p className="font-bold">N° ______ UAD/R/SG/DRH</p>
                        <br className="print:hidden" />
                        <p>Bambey, le {dateDepart}</p>
                    </div>
                </div>

                <div className="flex justify-center mb-2 print:mb-2">
                    <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                </div>

                <div className="text-center font-bold text-[12px] leading-relaxed mb-1">
                    RECTORAT<br />SECRETARIAT GENERAL<br />
                    <span className="font-normal text-[11px]">DDrm</span>
                </div>
                <p className="text-right text-[12px] mb-3 print:mb-2">Le Secrétaire général</p>

                <hr className="border-gray-800 mb-4 print:mb-3" />

                <div className="text-center font-bold text-[16px] underline tracking-wide mb-6 print:mb-4">
                    ORDRE DE MISSION
                </div>

                <div className="space-y-3 print:space-y-2 text-[13px] mb-6 print:mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Monsieur :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.chauffeur_prenom} {ordre.chauffeur_nom}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">De nationalité :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.nationalite || 'Sénégalais(e)'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Grade et fonction :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.grade_fonction || 'Chauffeur'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Se rend à :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.destination || trajetLabels[ordre.trajet] || ''}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Objet de la mission :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.objet_mission || "conduit la navette de l'UAD"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Moyen de transport :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.moyen_transport || ordre.vehicule?.immatriculation || '___________'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Date de départ :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{dateDepart}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Date de retour :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{dateRetour}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Frais de transport :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.frais_transport || 'Appui en carburant'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Indemnité de déplacement :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{ordre.indemnite_deplacement || 'Néant'}</span>
                    </div>
                </div>

                <p className="text-[12px] leading-relaxed mb-8 print:mb-5">
                    Les autorités civiles et militaires des localités traversées sont priées de faciliter à{' '}
                    <span className="font-bold">Monsieur {ordre.chauffeur_prenom} {ordre.chauffeur_nom}</span> l'accomplissement de son voyage.
                </p>

               <div className="flex justify-end mb-8 print:mb-5">
    <SignaturePad
        storageKey={`signature_sg_drh_${ordre.id}`}
        label={ordre.sgDrh ? `${ordre.sgDrh.prenom} ${ordre.sgDrh.nom}` : 'Le Secrétaire Général'}
        readOnly={!peutSigner || dejaTransmis}
        initialValue={signatureAffichee}
        onSaved={(dataUrl) => setSignatureDraft(dataUrl)}
    />
</div>


                

                <div className="text-[11px] mb-8 print:mb-4">
                    <p className="font-bold">Ampliations :</p>
                    <p>- CM/DDL/DRH.</p>
                    <p>- Intéressé/Chrono.</p>
                </div>

                <div className="text-center text-[10px] text-gray-600 border-t pt-3 print:pt-2">
                    <p>Tél. : (221) 33 973 30 86. // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.edu.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>
        </div>
    )
}