import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import SignaturePad from '../../components/SignaturePad'
import { Printer, Loader2, Send, XCircle } from 'lucide-react'

export default function AutorisationAbsenceDocument() {
    const { id } = useParams()
    const { user } = useAuth()
    const [autorisation, setAutorisation] = useState(null)
    const [loading, setLoading] = useState(true)

    const [signatureEnseignant, setSignatureEnseignant] = useState(null)
    const [signatureChef, setSignatureChef] = useState(null)
    const [signatureDirecteur, setSignatureDirecteur] = useState(null)
    const [signatureRecteur, setSignatureRecteur] = useState(null)

    const [transmission, setTransmission] = useState(false)
    const [rejetOuvert, setRejetOuvert] = useState(false)
    const [commentaireRejet, setCommentaireRejet] = useState('')

    useEffect(() => {
        api.get(`/autorisations-absence/${id}`)
            .then(res => setAutorisation(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
        )
    }

    if (!autorisation) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Autorisation d'absence introuvable.
            </div>
        )
    }

    const role = user?.role

    const peutSignerChef      = role === 'chef_departement'
    const peutSignerDirecteur = ['directeur_ufr', 'directeur-ufr', 'directeurufr'].includes(role)
    const peutSignerRecteur   = role === 'recteur'

    const enseignantProprietaireId = autorisation.enseignant_id ?? autorisation.enseignant?.id
    const peutSignerEnseignant = role === 'enseignant' && user?.id === enseignantProprietaireId

    const estBrouillon = autorisation.statut === 'brouillon'
    const chefPeutSignerMaintenant       = peutSignerChef      && autorisation.statut === 'soumise'
    const directeurPeutSignerMaintenant  = peutSignerDirecteur && autorisation.statut === 'avis_chef_departement'
    const recteurPeutSignerMaintenant    = peutSignerRecteur   && autorisation.statut === 'avis_directeur_ufr'
    const enseignantPeutSignerMaintenant = peutSignerEnseignant && estBrouillon

    const peutRejeterMaintenant = chefPeutSignerMaintenant || directeurPeutSignerMaintenant

    const transmettre = async () => {
        if (!signatureEnseignant) return
        setTransmission(true)
        try {
            await api.patch(`/autorisations-absence/${autorisation.id}/transmettre-vers-chef`, {
                signature: signatureEnseignant
            })
            setAutorisation(prev => ({ ...prev, statut: 'soumise' }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmission(false)
        }
    }

    const transmettreChef = async () => {
        if (!signatureChef) return
        setTransmission(true)
        try {
            await api.patch(`/autorisations-absence/${autorisation.id}/avis-chef-departement`, {
                avis: 'favorable',
                signature: signatureChef
            })
            setAutorisation(prev => ({ ...prev, statut: 'avis_chef_departement' }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmission(false)
        }
    }

    const transmettreDirecteur = async () => {
        if (!signatureDirecteur) return
        setTransmission(true)
        try {
            await api.patch(`/autorisations-absence/${autorisation.id}/avis-directeur-ufr`, {
                avis: 'favorable',
                signature: signatureDirecteur
            })
            setAutorisation(prev => ({ ...prev, statut: 'avis_directeur_ufr' }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmission(false)
        }
    }

    const transmettreRecteur = async () => {
        if (!signatureRecteur) return
        setTransmission(true)
        try {
            await api.patch(`/autorisations-absence/${autorisation.id}/signer-recteur`, {
                signature: signatureRecteur
            })
            setAutorisation(prev => ({ ...prev, statut: 'transmise' }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmission(false)
        }
    }

    const rejeter = async () => {
        const route = role === 'chef_departement' ? 'avis-chef-departement' : 'avis-directeur-ufr'
        setTransmission(true)
        try {
            await api.patch(`/autorisations-absence/${autorisation.id}/${route}`, {
                avis: 'defavorable',
                commentaire: commentaireRejet
            })
            setAutorisation(prev => ({ ...prev, statut: 'rejetee' }))
            setRejetOuvert(false)
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors du rejet')
        } finally {
            setTransmission(false)
        }
    }

    const periodeDebut = autorisation.periode_debut
        ? new Date(autorisation.periode_debut).toLocaleDateString('fr-FR')
        : '___________'
    const periodeFin = autorisation.periode_fin
        ? new Date(autorisation.periode_fin).toLocaleDateString('fr-FR')
        : '___________'

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 px-4 print:py-0 print:px-0">

            {/* Style impression : format A4 propre */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 8mm; }
                    html, body { height: auto !important; }
                }
            `}</style>

            {/* Boutons d'action */}
            <div className="flex justify-center gap-3 mb-6 print:hidden flex-wrap">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                >
                    <Printer size={16} /> Imprimer / Télécharger
                </button>

                {enseignantPeutSignerMaintenant && (
                    <button
                        onClick={transmettre}
                        disabled={!signatureEnseignant || transmission}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                        {transmission ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Transmettre au Chef de Département
                    </button>
                )}

                {chefPeutSignerMaintenant && (
                    <button
                        onClick={transmettreChef}
                        disabled={!signatureChef || transmission}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                        {transmission ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Signer et transmettre au Directeur UFR
                    </button>
                )}

                {directeurPeutSignerMaintenant && (
                    <button
                        onClick={transmettreDirecteur}
                        disabled={!signatureDirecteur || transmission}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                        {transmission ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Signer et transmettre au Recteur
                    </button>
                )}

                {recteurPeutSignerMaintenant && (
                    <button
                        onClick={transmettreRecteur}
                        disabled={!signatureRecteur || transmission}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                        {transmission ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Signer et transmettre à l'enseignant
                    </button>
                )}

                {peutRejeterMaintenant && (
                    <button
                        onClick={() => setRejetOuvert(true)}
                        className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 font-semibold px-6 py-2.5 rounded-xl transition"
                    >
                        <XCircle size={16} /> Rejeter
                    </button>
                )}
            </div>

            {/* Modale de rejet */}
            {rejetOuvert && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h3 className="font-bold text-gray-800">Motif du rejet</h3>
                        <textarea
                            value={commentaireRejet}
                            onChange={e => setCommentaireRejet(e.target.value)}
                            rows={4}
                            placeholder="Expliquez la raison du rejet..."
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setRejetOuvert(false)}
                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                            <button onClick={rejeter} disabled={transmission}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                Confirmer le rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document */}
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full print:px-8 print:py-4 font-serif text-gray-900">

                {/* En-tête */}
                <div className="flex justify-between items-start mb-5 print:mb-3">
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
                        <p className="font-bold">N° {autorisation.numero || '______'}</p>
                    </div>
                </div>

                {/* Logo centré */}
                <div className="flex justify-center mb-3 print:mb-2">
                    <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                </div>

                <hr className="border-gray-800 mb-4 print:mb-3" />

                <div className="text-center font-bold text-[16px] underline tracking-wide mb-6 print:mb-4">
                    AUTORISATION D'ABSENCE
                </div>

                {/* Champs */}
                <div className="space-y-3 print:space-y-2 text-[13px] mb-8 print:mb-5">
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[220px]">Enseignant :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">
                            {autorisation.enseignant?.prenom} {autorisation.enseignant?.nom}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[220px]">UFR / Département :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">
                            {autorisation.enseignant?.ufr}{autorisation.enseignant?.departement ? ` — ${autorisation.enseignant.departement}` : ''}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[220px]">Motif de la mission :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{autorisation.motif_mission}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[220px]">Lieu du déplacement :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{autorisation.lieu_deplacement}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[220px]">Période :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{periodeDebut} → {periodeFin}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="min-w-[220px]">Organisme prenant en charge :</span>
                        <span className="flex-1 border-b border-gray-800 font-bold pb-0.5">{autorisation.organisme_charge}</span>
                    </div>
                </div>

                {estBrouillon && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 text-xs mb-6 print:hidden">
                        Cette demande n'a pas encore été transmise. Signez ci-dessous puis cliquez sur « Transmettre au Chef de Département ».
                    </div>
                )}
                {chefPeutSignerMaintenant && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 text-xs mb-6 print:hidden">
                        Cette demande attend votre signature. Signez ci-dessous puis transmettez au Directeur UFR.
                    </div>
                )}
                {directeurPeutSignerMaintenant && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 text-xs mb-6 print:hidden">
                        Cette demande attend votre signature. Signez ci-dessous puis transmettez au Recteur.
                    </div>
                )}
                {recteurPeutSignerMaintenant && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 text-xs mb-6 print:hidden">
                        Cette demande attend votre signature finale. Signez ci-dessous puis transmettez à l'enseignant.
                    </div>
                )}

                {/* Circuit de validation / signatures */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 print:gap-y-6 mt-12 print:mt-6 mb-10 print:mb-5">
                    <SignaturePad
                        storageKey={`signature_chef_departement_${autorisation.id}`}
                        label="Le Chef de Département"
                        readOnly={!chefPeutSignerMaintenant}
                        onSaved={setSignatureChef}
                    />
                    <SignaturePad
                        storageKey={`signature_directeur_ufr_${autorisation.id}`}
                        label="Le Directeur UFR"
                        readOnly={!directeurPeutSignerMaintenant}
                        onSaved={setSignatureDirecteur}
                    />
                    <SignaturePad
                        storageKey={`signature_recteur_${autorisation.id}`}
                        label="Le Recteur"
                        readOnly={!recteurPeutSignerMaintenant}
                        onSaved={setSignatureRecteur}
                    />
                    <SignaturePad
                        storageKey={`signature_enseignant_${autorisation.id}`}
                        label={autorisation.enseignant ? `${autorisation.enseignant.prenom} ${autorisation.enseignant.nom}` : "L'enseignant"}
                        readOnly={!enseignantPeutSignerMaintenant}
                        onSaved={setSignatureEnseignant}
                    />
                </div>

                <div className="text-center text-[10px] text-gray-600 border-t pt-3 print:pt-2">
                    <p>Tél. : (221) 33 973 30 86. // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.edu.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>
        </div>
    )
}