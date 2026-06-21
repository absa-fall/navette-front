import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Printer, Loader2 } from 'lucide-react'
import { nomCompletUFR } from '../../constants/ufr'


function formatDate(d) {
    if (!d) return '…………………'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function AutorisationAbsenceDocument() {
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/autorisations-absence/${id}`)
            .then(res => setData(res.data))
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

    if (!data) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Document introuvable.
            </div>
        )
    }

    const avisBadge = (avis) => {
        if (!avis) return <span className="text-gray-400 italic text-sm">En attente</span>
        return avis === 'favorable'
            ? <span className="text-green-700 font-semibold text-sm">FAVORABLE</span>
            : <span className="text-red-600 font-semibold text-sm">DÉFAVORABLE</span>
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">

            {/* Bouton imprimer - masqué à l'impression */}
            <div className="flex justify-center mb-6 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                >
                    <Printer size={16} /> Imprimer / Télécharger
                </button>
            </div>

            {/* Document */}
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-12 py-10 print:shadow-none print:border-none print:rounded-none print:max-w-full font-serif text-gray-900">
                {/* En-tête */}
                <div className="text-center mb-8 space-y-0.5">
                    <p className="font-bold tracking-wide">RÉPUBLIQUE DU SÉNÉGAL</p>
                    <p className="text-sm">Un Peuple - Un But - Une Foi</p>
                    <p className="text-sm">Ministère de l'Enseignement supérieur,</p>
                    <p className="text-sm">de la Recherche et de l'Innovation</p>
                    <p className="text-sm">******</p>
                    <p className="font-bold mt-2">UNIVERSITÉ ALIOUNE DIOP</p>
                    <p className="text-sm italic">« L'excellence est ma constance, l'éthique ma vertu »</p>

                    <div className="flex justify-center my-3">
                        <img
                            src="/logo-uadb.png"
                            alt="Logo UADB"
                            className="w-20 h-20 object-contain"
                        />
                    </div>

                    <p className="font-bold text-sm mt-2 leading-snug px-6">
                        {nomCompletUFR(data.ufr_departement)}
                    </p>
                </div>

                {/* Titre */}
                <div className="text-center mb-8">
                    <h1 className="text-xl font-bold">DEMANDE D'AUTORISATION D'ABSENCE N°</h1>
                    <p className="font-bold">{data.numero}</p>
                    <p className="font-bold">----------------</p>
                </div>

                {/* Corps */}
                <div className="space-y-4 text-[15px] leading-relaxed">
                    <p><span className="font-bold">DEMANDE D'AUTORISATION PRÉSENTÉE LE</span> : {formatDate(data.date_presentation)}</p>
                    <p><span className="font-bold">PAR</span> : {data.nom_demandeur}</p>
                    <p><span className="font-bold">FONCTION</span> : {data.fonction}</p>
                    <p><span className="font-bold">UFR/DÉPARTEMENT</span> : {data.ufr_departement}</p>
                    <p><span className="font-bold">MOTIF DE LA MISSION</span> : {data.motif_mission}</p>
                    <p><span className="font-bold">LIEU DU DÉPLACEMENT</span> : {data.lieu_deplacement}</p>
                    <p><span className="font-bold">PÉRIODE DU DÉPLACEMENT</span> : du {formatDate(data.periode_debut)} au {formatDate(data.periode_fin)}</p>
                    <p><span className="font-bold">ORGANISME PRENANT EN CHARGE LES FRAIS DE TRANSPORT ET DE SÉJOUR</span> :</p>
                    <p className="pl-4">{data.organisme_charge}</p>

                    <div className="text-right mt-10 pr-4">
                        <p className="font-bold underline">Signature</p>
                        <p className="text-sm mt-8">{data.signature_enseignant ? data.nom_demandeur : ''}</p>
                    </div>
                </div>

                {/* Séparateur AVIS */}
                <div className="text-center font-bold my-10 border-t border-b border-gray-800 py-2 text-sm">
                    AVIS DU
                </div>

                {/* Deux colonnes : Chef Dépt / Directeur UFR */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                        <p className="font-bold underline mb-3">CHEF DE DÉPARTEMENT</p>
                       
                        {data.commentaire_chef_departement && (
                            <p className="text-sm italic text-gray-600">"{data.commentaire_chef_departement}"</p>
                        )}
                        <p className="text-sm mt-6">
                            {data.chef_departement?.prenom} {data.chef_departement?.nom}
                        </p>
                        <p className="text-xs text-gray-500">
                            {data.date_avis_chef_departement ? formatDate(data.date_avis_chef_departement) : ''}
                        </p>
                    </div>
                    <div>
                        <p className="font-bold underline mb-3">DIRECTEUR DE L'UFR {data.ufr_departement?.replace('UFR ', '') || 'UFR'}</p>
                       
                        {data.commentaire_directeur_ufr && (
                            <p className="text-sm italic text-gray-600">"{data.commentaire_directeur_ufr}"</p>
                        )}
                        <p className="text-sm mt-6">
                            {data.directeur_ufr?.prenom} {data.directeur_ufr?.nom}
                        </p>
                        <p className="text-xs text-gray-500">
                            {data.date_avis_directeur_ufr ? formatDate(data.date_avis_directeur_ufr) : ''}
                        </p>
                    </div>
                </div>

                {/* Signature Recteur */}
                <div className="text-right pr-4 mb-6">
                    <p className="font-bold underline">LE RECTEUR</p>
                    <p className="text-sm mt-8">
                        {data.recteur
                            ? `${data.recteur.prenom} ${data.recteur.nom}`
                            : <span className="text-gray-400 italic font-normal">En attente de signature</span>
                        }
                    </p>
                    <p className="text-xs text-gray-500">
                        {data.date_signature_recteur ? formatDate(data.date_signature_recteur) : ''}
                    </p>
                </div>

                {/* Pied de page */}
                <div className="text-center text-xs text-gray-500 mt-12 border-t pt-3">
                    <p>(221) 33 973 30 86 // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.sn // Courriel : {data.email_ufr || 'contact@uadb.edu.sn'}</p>
                </div>
            </div>
        </div>
    )
}