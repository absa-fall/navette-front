import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import SignaturePad from '../../components/SignaturePad'
import { Printer, Loader2, FileText, AlertCircle } from 'lucide-react'
import { parseContenu } from '../../utils/rapportVoyage'
import { STORAGE_URL } from '../../api/storageUrl'

const SECTIONS_AFFICHAGE = [
    { key: 'objectifs', label: 'Objectifs de la mission' },
    { key: 'deroulement', label: 'Déroulement du voyage' },
    { key: 'resultats', label: 'Résultats et apprentissages' },
    { key: 'recommandations', label: 'Recommandations' },
]

const LABELS_JUSTIFICATIFS = {
    talons: 'Talons',
    caches_ent_sort: 'Caches Entrées/Sorties',
    invitation: 'Invitation',
}

// ══════════════════════════════════════════════════════════
// Composants externes (définis en dehors de RapportVoyageDocument
// pour ne pas être recréés à chaque render, ce qui remonterait
// SignaturePad et effacerait la signature en cours)
// ══════════════════════════════════════════════════════════

function RecapJustificatifs({ peutSigner, nbJustificatifs, justificatifsFiles, justificatifsAutresFiles }) {
    if (!peutSigner) return null
    return (
        <div className="max-w-3xl mx-auto mb-6 print:hidden">
            <div className={`rounded-xl p-4 border text-sm ${
                nbJustificatifs > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
                <p className="font-semibold mb-2 flex items-center gap-2">
                    <FileText size={15} /> Dossier à transmettre avec ce rapport
                </p>
                {nbJustificatifs === 0 ? (
                    <div className="flex items-start gap-2">
                        <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                        <p>
                            Aucun justificatif attaché. Si vous n'êtes pas passé par "Mes voyages" pour les
                            sélectionner, revenez en arrière pour les ajouter avant de signer — sinon seul
                            le rapport sera envoyé.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {Object.entries(justificatifsFiles).map(([key, f]) => (
                            <li key={key}>• {LABELS_JUSTIFICATIFS[key] || key} — {f.name}</li>
                        ))}
                        {justificatifsAutresFiles.map((f, i) => (
                            <li key={`autre-${i}`}>• Autre pièce — {f.name}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function BlocSignatureEtTransmission({
    rapport, enseignant, peutSigner, peutCorriger, signatureAffichee,
    setSignatureDraft, error, submitting, nbJustificatifs, handleTransmettre, id,
}) {
    return (
        <>
            <p className="text-[11px] text-gray-600 mb-2 print:mb-1">
                Je soussigné(e), certifie l'exactitude des informations contenues dans le présent rapport.
            </p>
            <div className="flex justify-end mb-4 print:mb-2">
                <SignaturePad
                    storageKey={`signature_enseignant_rapport_${rapport.id}`}
                    label={`${enseignant.prenom || ''} ${enseignant.nom || ''}`.trim() || "L'enseignant"}
                    readOnly={!peutSigner}
                    initialValue={signatureAffichee}
                    onSaved={(dataUrl) => setSignatureDraft(dataUrl)}
                />
            </div>

            {error && (
                <p className="print:hidden text-red-600 text-[12px] text-center mb-3">{error}</p>
            )}

            {peutSigner && (
                <div className="print:hidden flex justify-center mb-6">
                    <button
                        onClick={handleTransmettre}
                        disabled={submitting || !signatureAffichee}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800
                                   disabled:bg-gray-300 disabled:cursor-not-allowed
                                   text-white font-semibold px-6 py-2.5 rounded-xl transition"
                    >
                        {submitting
                            ? <><Loader2 className="animate-spin" size={16} /> Transmission...</>
                            : nbJustificatifs > 0
                                ? `Transmettre le rapport et le dossier (${nbJustificatifs} pièce${nbJustificatifs > 1 ? 's' : ''})`
                                : 'Transmettre le rapport'}
                    </button>
                </div>
            )}

            {peutCorriger && (
                <div className="print:hidden flex justify-center mb-6">
                    <button
                        onClick={() => window.location.href = `/rapports/${id}/modifier`}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                    >
                        Corriger et re-soumettre
                    </button>
                </div>
            )}
        </>
    )
}

// ══════════════════════════════════════════════════════════
// Composant principal
// ══════════════════════════════════════════════════════════

export default function RapportVoyageDocument() {
    const { id } = useParams()
    const { user } = useAuth()
    const location = useLocation()
    const [rapport, setRapport] = useState(null)
    const [loading, setLoading] = useState(true)

    const justificatifsFiles = location.state?.justificatifsFiles || {}
    const justificatifsAutresFiles = location.state?.justificatifsAutresFiles || []
    const nbJustificatifs = Object.keys(justificatifsFiles).length + justificatifsAutresFiles.length

    const [signatureDraft, setSignatureDraft] = useState(null)

    const [champsLibre, setChampsLibre] = useState({
        destination_libre: '',
        date_debut_libre: '',
        date_fin_libre: '',
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        setSignatureDraft(null)
        setError(null)
        setLoading(true)

        api.get(`/rapports/${id}`)
            .then(res => {
                setRapport(res.data)
                setChampsLibre({
                    destination_libre: res.data.destination_libre || '',
                    date_debut_libre: res.data.date_debut_libre || '',
                    date_fin_libre: res.data.date_fin_libre || '',
                })
            })
            .catch(() => setError("Impossible de charger le rapport. Vérifiez votre connexion."))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
        )
    }

    if (!rapport) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                {error || 'Rapport introuvable.'}
            </div>
        )
    }

    // Champs réellement renvoyés par RapportVoyageController@show :
    // rapport.contenu, rapport.fichier_pdf, rapport.date_depot, rapport.statut,
    // rapport.commentaire_vr, rapport.enseignant (relation), rapport.voyage (relation)
    const enseignant = rapport.enseignant || {}
    const voyage = rapport.voyage || {}
    const sectionsContenu = parseContenu(rapport.contenu)

    const dateDepot = rapport.date_depot
        ? new Date(rapport.date_depot).toLocaleDateString('fr-FR')
        : '___________'

    const dateDepart = voyage.date_debut
        ? new Date(voyage.date_debut).toLocaleDateString('fr-FR')
        : (rapport.date_debut_libre ? new Date(rapport.date_debut_libre).toLocaleDateString('fr-FR') : '___________')

    const dateRetour = voyage.date_fin
        ? new Date(voyage.date_fin).toLocaleDateString('fr-FR')
        : (rapport.date_fin_libre ? new Date(rapport.date_fin_libre).toLocaleDateString('fr-FR') : '___________')

    const peutSigner = user?.id === rapport.enseignant_id && rapport.statut === 'brouillon'
    const pasDeVoyage = !rapport.voyage_id
    const champsModifiables = peutSigner && pasDeVoyage
    const peutCorriger = user?.id === rapport.enseignant_id && rapport.statut === 'rejete'
    const signatureAffichee = signatureDraft || rapport.signature_enseignant

    const estPdfTeleverse = !rapport.contenu && rapport.fichier_pdf

   
const handleTransmettre = async () => {
    if (!signatureDraft) {
        setError("Veuillez signer avant de transmettre le rapport.")
        return
    }
    const messageConfirmation = nbJustificatifs > 0
        ? `Une fois transmis, vous ne pourrez plus modifier ce rapport (sauf s'il est rejeté). Le rapport et vos ${nbJustificatifs} justificatif(s) seront envoyés ensemble au Vice-Recteur et à la Commission. Confirmez-vous l'envoi ?`
        : "Une fois transmis, vous ne pourrez plus modifier ce rapport (sauf s'il est rejeté). Aucun justificatif n'est attaché — confirmez-vous l'envoi du rapport seul ?"
    const confirme = window.confirm(messageConfirmation)
    if (!confirme) return

    setSubmitting(true)
    setError(null)
    try {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        formData.append('signature', signatureDraft)
        if (pasDeVoyage) {
            if (champsLibre.destination_libre) formData.append('destination_libre', champsLibre.destination_libre)
            if (champsLibre.date_debut_libre) formData.append('date_debut_libre', champsLibre.date_debut_libre)
            if (champsLibre.date_fin_libre) formData.append('date_fin_libre', champsLibre.date_fin_libre)
        }
        Object.entries(justificatifsFiles).forEach(([typeKey, fichier]) => {
            formData.append(`justificatifs[${typeKey}]`, fichier)
        })
        justificatifsAutresFiles.forEach(fichier => {
            formData.append('justificatifs_autres[]', fichier)
        })

        const res = await api.post(`/rapports/${id}/transmettre`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        setRapport(res.data.rapport)   
    } catch (err) {
        setError(err.response?.data?.message || "Échec de la transmission. Réessayez.")
    } finally {
        setSubmitting(false)
    }
}

    
    // ══════════════════════════════════════════════════════════
    // CAS 1 — Rapport téléversé en PDF : simple fichier joint,
    // pas d'aperçu intégré, juste un lien pour l'ouvrir/télécharger.
    // ══════════════════════════════════════════════════════════
    if (estPdfTeleverse) {
        return (
            <div className="min-h-screen bg-gray-100 py-8 px-4">
                <div className="max-w-3xl mx-auto space-y-4">

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <h1 className="font-bold text-gray-800 mb-1">
                            Rapport de {enseignant.prenom} {enseignant.nom}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {voyage.destination || voyage.titre || rapport.destination_libre || 'Voyage d\'études'}
                            {' · '}Déposé le {dateDepot}
                        </p>
                    </div>

                    {rapport.statut === 'rejete' && rapport.commentaire_vr && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                            <p className="font-bold mb-1">Motif du rejet :</p>
                            <p>{rapport.commentaire_vr}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-3">
                            Ce rapport a été transmis sous forme de fichier PDF joint.
                        </p>
                        
                            < a href={`${STORAGE_URL}/storage/${rapport.fichier_pdf}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
                        >
                            <FileText size={16} /> Ouvrir le fichier PDF
                        </a>
                    </div>

                    <RecapJustificatifs
                        peutSigner={peutSigner}
                        nbJustificatifs={nbJustificatifs}
                        justificatifsFiles={justificatifsFiles}
                        justificatifsAutresFiles={justificatifsAutresFiles}
                    />

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <BlocSignatureEtTransmission
                            rapport={rapport}
                            enseignant={enseignant}
                            peutSigner={peutSigner}
                            peutCorriger={peutCorriger}
                            signatureAffichee={signatureAffichee}
                            setSignatureDraft={setSignatureDraft}
                            error={error}
                            submitting={submitting}
                            nbJustificatifs={nbJustificatifs}
                            handleTransmettre={handleTransmettre}
                            id={id}
                        />
                    </div>

                </div>
            </div>
        )
    }
    // ══════════════════════════════════════════════════════════
    // CAS 2 — Rapport rédigé en texte : document officiel complet (gabarit UADB).
    // ══════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 px-4 print:py-0 print:px-0">

            <style>{`
                @media print {
                    @page { size: A4; margin: 6mm; }
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

            <RecapJustificatifs
                peutSigner={peutSigner}
                nbJustificatifs={nbJustificatifs}
                justificatifsFiles={justificatifsFiles}
                justificatifsAutresFiles={justificatifsAutresFiles}
            />

            <div className="doc-print max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full print:px-6 print:py-2 print:leading-snug font-serif text-gray-900">

                <div className="flex justify-between items-start mb-5 print:mb-2">
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
                        <p className="font-bold">N° ______ UAD/VR/SG</p>
                        <br className="print:hidden" />
                        <p>Bambey, le {dateDepot}</p>
                    </div>
                </div>

                <div className="flex justify-center mb-2 print:mb-2">
                    <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                </div>

                <div className="text-center font-bold text-[12px] leading-relaxed mb-1">
                    VICE-RECTORAT<br />
                    <span className="font-normal text-[11px]">Voyages d'études</span>
                </div>

                <hr className="border-gray-800 mb-4 print:mb-2" />

                <div className="text-center font-bold text-[16px] underline tracking-wide mb-6 print:mb-3">
                    RAPPORT DE VOYAGE D'ÉTUDES
                </div>

                <div className="space-y-3 print:space-y-1.5 text-[13px] print:text-[12px] mb-6 print:mb-3">
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Enseignant :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{enseignant.prenom} {enseignant.nom}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">UFR :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{enseignant.ufr || '___________'}</span>
                    </div>
                    <div className="flex items-baseline gap-2 print:hidden-none">
                        <span className="min-w-[200px]">Destination :</span>
                        {champsModifiables ? (
                            <input
                                type="text"
                                value={champsLibre.destination_libre}
                                onChange={e => setChampsLibre(prev => ({ ...prev, destination_libre: e.target.value }))}
                                placeholder="Ex : Dakar"
                                className="flex-1 border-b border-gray-800 font-bold pb-0.5 focus:outline-none bg-transparent print:border-none"
                            />
                        ) : (
                            <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">
                                {voyage.destination || voyage.titre || rapport.destination_libre || '___________'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Date de départ :</span>
                        {champsModifiables ? (
                            <input
                                type="date"
                                value={champsLibre.date_debut_libre}
                                onChange={e => setChampsLibre(prev => ({ ...prev, date_debut_libre: e.target.value }))}
                                className="flex-1 border-b border-gray-800 font-bold pb-0.5 focus:outline-none bg-transparent print:border-none"
                            />
                        ) : (
                            <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{dateDepart}</span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Date de retour :</span>
                        {champsModifiables ? (
                            <input
                                type="date"
                                value={champsLibre.date_fin_libre}
                                onChange={e => setChampsLibre(prev => ({ ...prev, date_fin_libre: e.target.value }))}
                                className="flex-1 border-b border-gray-800 font-bold pb-0.5 focus:outline-none bg-transparent print:border-none"
                            />
                        ) : (
                            <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{dateRetour}</span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[200px]">Date de dépôt du rapport :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{dateDepot}</span>
                    </div>
                </div>

                <div className="mb-6 print:mb-3 text-[13px] print:text-[12px]">
                    <p><span className="font-bold">Objet :</span> Rapport de voyage d'études — {voyage.destination || voyage.titre || rapport.destination_libre || '___________'}</p>
                </div>

                <div className="mb-6 print:mb-2 text-[12.5px] print:text-[11.5px] leading-relaxed">
                    <p>Monsieur le Vice-Recteur,</p>
                </div>

                <div className="mb-6 print:mb-3 text-[12.5px] print:text-[11.5px] leading-relaxed text-justify">
                    <p>
                        J'ai l'honneur de vous soumettre, par la présente, le rapport relatif au voyage d'études
                        effectué du {dateDepart} au {dateRetour} à {voyage.destination || voyage.titre || rapport.destination_libre || '___________'}, conformément
                        à l'autorisation qui m'a été accordée.
                    </p>
                </div>

                <div className="mb-8 print:mb-3">
                    <div className="border-t border-gray-300 mb-5 print:mb-2" />
                    <div className="space-y-5 print:space-y-2">
                        {SECTIONS_AFFICHAGE.map(({ key, label }) => {
                            const texte = sectionsContenu[key]
                            if (!texte) return null
                            return (
                                <div key={key} className="text-[12.5px] print:text-[11px] leading-relaxed border-l-2 border-gray-800 pl-3 print:break-inside-avoid">
                                    <p className="font-bold uppercase text-[11.5px] print:text-[10.5px] tracking-wide mb-1.5 print:mb-1 text-gray-800">
                                        {label}
                                    </p>
                                    <p className="whitespace-pre-line text-justify">{texte}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="mb-2 print:mb-1 text-[12.5px] print:text-[11.5px] leading-relaxed">
                    <p>
                        Je reste à votre disposition pour tout complément d'information utile
                        et vous prie d'agréer, Monsieur le Vice-Recteur, l'expression de ma considération distinguée.
                    </p>
                </div>

                {rapport.statut === 'rejete' && rapport.commentaire_vr && (
                    <div className="mt-6 mb-8 print:mb-5 text-[12px] border border-red-300 bg-red-50 print:bg-white print:border-gray-800 rounded-lg p-3">
                        <p className="font-bold mb-1">Motif du rejet :</p>
                        <p>{rapport.commentaire_vr}</p>
                    </div>
                )}

                <BlocSignatureEtTransmission
                    rapport={rapport}
                    enseignant={enseignant}
                    peutSigner={peutSigner}
                    peutCorriger={peutCorriger}
                    signatureAffichee={signatureAffichee}
                    setSignatureDraft={setSignatureDraft}
                    error={error}
                    submitting={submitting}
                    nbJustificatifs={nbJustificatifs}
                    handleTransmettre={handleTransmettre}
                    id={id}
                />

                <div className="text-center text-[10px] text-gray-600 border-t pt-3 print:pt-2">
                    <p>Tél. : (221) 33 973 30 86. // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.edu.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>
        </div>
    )
}