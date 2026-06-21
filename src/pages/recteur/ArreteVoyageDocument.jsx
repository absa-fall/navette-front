import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Printer, Loader2 } from 'lucide-react'


function formatDate(d) {
    if (!d) return '…………………'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()
}

function formatDateCourt(d) {
    if (!d) return '…………………'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMontant(m) {
    if (!m) return '0'
    return Number(m).toLocaleString('fr-FR')
}

export default function ArreteVoyageDocument() {
    const { voyageId } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/voyages-etudes/${voyageId}/arrete`)
            .then(res => setData(res.data))
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

    if (!data) {
        return (
            <div className="flex justify-center items-center min-h-screen text-gray-500">
                Arrêté introuvable.
            </div>
        )
    }

    const beneficiairesDefinitifs = data.voyage?.beneficiaires?.filter(b => b.dans_liste_definitive) || []
    const annee = data.date_arrete ? new Date(data.date_arrete).getFullYear() : new Date().getFullYear()

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">

            {/* Bouton imprimer */}
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
                <div className="flex justify-between items-start mb-6">
                    {/* Gauche */}
                    <div className="text-[12px] leading-relaxed">
                        <p className="font-bold">REPUBLIQUE DU SENEGAL</p>
                        <p className="italic">Un Peuple - Un But - Une Foi</p>
                        <p>Ministère de l'Enseignement supérieur,</p>
                        <p>de la Recherche et de l'Innovation</p>
                        <p className="text-center">******</p>
                        <p className="font-bold">UNIVERSITE ALIOUNE DIOP</p>
                        <p className="italic text-[11px]">« L'excellence est ma constance, l'éthique ma vertu »</p>

                        {/* Logo + RECTORAT */}
                        <div className="flex flex-col items-center mt-3">
                          <img src="/logo-uadb.png" alt="Logo UADB" className="w-16 h-16 object-contain" />
                            <p className="font-bold text-[12px] mt-1">RECTORAT</p>
                            <p className="text-[11px]">DD/ms</p>
                        </div>
                    </div>

                    {/* Droite */}
                    <div className="text-right text-[12px] max-w-xs">
                        <p className="font-bold">N° {data.numero} UAD/R/SG/DRH</p>
                        <br />
                        <p>Bambey, le {formatDate(data.date_arrete)}</p>
                        <br /><br />
                        <p className="font-bold italic text-left leading-relaxed">
                            Arrêté portant attribution de voyage d'études au Personnel d'Enseignement
                            et de Recherche de l'Université Alioune Diop, exercice {annee}
                        </p>
                    </div>
                </div>

                <hr className="border-gray-800 mb-5" />

                {/* LE RECTEUR */}
                <div className="text-center font-bold text-[13px] mb-4">
                    LE RECTEUR, PRESIDENT DU CONSEIL ACADEMIQUE
                </div>

                {/* Visas */}
                <div className="mb-4 text-[12px] leading-loose">
                    {data.visas?.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>

                {/* ARRETE */}
                <div className="text-center font-bold text-[13px] tracking-widest my-5">
                    A R R E T E
                </div>

                {/* Article premier */}
                <div className="mb-4 text-[12px] leading-relaxed">
                    <p>
                        <span className="font-bold">Article premier.</span> - Au titre de l'année {annee}, un voyage d'études est accordé aux
                        enseignants-chercheurs de l'Université Alioune Diop désignés ci-dessous :
                    </p>
                </div>

                {/* Tableau bénéficiaires */}
                <table className="w-full border-collapse text-[11px] mb-4">
                    <thead>
                        <tr>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">N°</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">Prénoms</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">NOM</th>
                            <th className="border border-gray-800 px-3 py-1.5 text-left">UFR/INSTITUT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {beneficiairesDefinitifs.map((b, i) => (
                            <tr key={b.id}>
                                <td className="border border-gray-800 px-3 py-1.5">{i + 1}.</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.prenom}</td>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold">{b.enseignant?.nom?.toUpperCase()}</td>
                                <td className="border border-gray-800 px-3 py-1.5">{b.enseignant?.ufr}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
{/* Article 2 */}
<div className="mb-4 text-[12px] leading-relaxed">
    <p><span className="font-bold">Article 2.-</span> Les intéressés bénéficient chacun :</p>
    <ul className="mt-1 ml-4 space-y-1">
        <li>- d'une autorisation d'absence pour la période du voyage ;</li>
        <li>- de <span className="font-bold">{formatMontant(data.montant_billet)} francs CFA</span>, à titre de contribution pour l'achat d'un billet d'avion (aller-retour) ;</li>
        <li>- d'une indemnité forfaitaire de <span className="font-bold">{formatMontant(data.montant_indemnite)} francs CFA</span>.</li>
    </ul>
    <p className="mt-1">L'assurance voyage est prise en charge par l'Université Alioune Diop.</p>
</div>

{/* Article 3 */}
<div className="mb-4 text-[12px] leading-relaxed">
    <p>
        <span className="font-bold">Article 3.-</span> La dépense est imputable sur le budget du Rectorat de l'Université Alioune Diop,
        respectivement aux comptes <span className="font-bold">61811-voyages d'études</span> et <span className="font-bold">6385-perdiems voyages d'études et voyages assimilés</span>.
    </p>
</div>

{/* Article 4 */}
<div className="mb-8 text-[12px] leading-relaxed">
    <p>
        <span className="font-bold">Article 4.-</span> Le Secrétaire général et l'Agent comptable de l'Université Alioune Diop sont
        chargés, chacun en ce qui le concerne, de l'exécution du présent arrêté.
    </p>
</div>

{/* Ampliations + Signature */}
<div className="flex justify-between items-start mt-6">
    <div className="text-[12px]">
        <p className="font-bold underline">Ampliations :</p>
        <p>- VRIREP/SG/AC ;</p>
        <p>- DRH/DF/UFRs/ISFAR ;</p>
        <p>- Intéressés/Chrono.</p>
    </div>
    <div className="text-center text-[12px]">
        <p className="font-bold">LE RECTEUR,</p>
        <p className="font-bold">PRESIDENT DU CONSEIL ACADEMIQUE</p>
        <br /><br /><br />
        <p>{data.recteur?.prenom} {data.recteur?.nom?.toUpperCase()}</p>
    </div>
</div>
                

                {/* Pied de page */}
                <div className="text-center text-[10px] text-gray-600 mt-12 border-t pt-3">
                    <p>Tél. : (221) 33 973 30 86 // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)</p>
                    <p>Internet : www.uadb.sn // Courriel : rectorat@uadb.edu.sn</p>
                </div>
            </div>
        </div>
    )
}