import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Loader2, Save } from 'lucide-react'

// Structure standard d'un rapport de mission/voyage d'études.
// Ces 4 sections sont concaténées en JSON et envoyées dans le champ
// `contenu` existant côté backend — aucune migration nécessaire.
const SECTIONS = [
    {
        key: 'objectifs',
        label: 'Objectifs de la mission',
        placeholder: "Rappelez le but du voyage : conférence, formation, recherche, partenariat...",
        rows: 3,
    },
    {
        key: 'deroulement',
        label: 'Déroulement du voyage',
        placeholder: "Décrivez le programme suivi jour par jour ou par grandes étapes : activités, rencontres, visites...",
        rows: 5,
    },
    {
        key: 'resultats',
        label: 'Résultats et apprentissages',
        placeholder: "Qu'avez-vous obtenu ou appris ? Connaissances acquises, contacts établis, documents rapportés...",
        rows: 5,
    },
    {
        key: 'recommandations',
        label: 'Recommandations',
        placeholder: "Suggestions pour l'université : opportunités à saisir, suites à donner, points de vigilance...",
        rows: 3,
    },
]

// Essaie de relire un `contenu` existant (JSON structuré ou ancien texte libre)
export function parseContenu(contenuBrut) {
    if (!contenuBrut) {
        return { objectifs: '', deroulement: '', resultats: '', recommandations: '' }
    }
    try {
        const parsed = JSON.parse(contenuBrut)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return {
                objectifs: parsed.objectifs || '',
                deroulement: parsed.deroulement || '',
                resultats: parsed.resultats || '',
                recommandations: parsed.recommandations || '',
            }
        }
    } catch {
        // Pas du JSON : c'est un ancien rapport rédigé en texte libre.
        // On le place dans "Déroulement" pour ne rien perdre.
    }
    return { objectifs: '', deroulement: contenuBrut, resultats: '', recommandations: '' }
}

export default function RapportVoyageForm() {
    const { voyageId } = useParams()
    const navigate = useNavigate()

    const [sections, setSections] = useState({
        objectifs: '', deroulement: '', resultats: '', recommandations: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (key, value) => {
        setSections(prev => ({ ...prev, [key]: value }))
    }

    const sectionsRemplies = Object.values(sections).filter(v => v.trim().length > 0).length

    const handleEnregistrer = async () => {
        if (sectionsRemplies === 0) {
            setError("Veuillez remplir au moins une section avant d'enregistrer.")
            return
        }
        setSaving(true)
        setError(null)
        try {
            const res = await api.post('/rapports', {
                voyage_id: voyageId,
                contenu: JSON.stringify(sections),
            })
            navigate(`/rapports/${res.data.rapport.id}`)
        } catch (err) {
            setError(err.response?.data?.message || "Échec de l'enregistrement du brouillon.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 shadow-sm rounded-xl px-8 py-8">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Rédiger le rapport de voyage</h1>
                <p className="text-sm text-gray-500 mb-6">
                    Structurez votre rapport en 4 sections. Vous pourrez le relire et le signer avant transmission.
                </p>

                <div className="space-y-6">
                    {SECTIONS.map(section => (
                        <div key={section.key}>
                            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                                {section.label}
                            </label>
                            <textarea
                                value={sections[section.key]}
                                onChange={(e) => handleChange(section.key, e.target.value)}
                                placeholder={section.placeholder}
                                rows={section.rows}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                                           focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                                           resize-y"
                            />
                        </div>
                    ))}
                </div>

                {error && (
                    <p className="text-red-600 text-sm mt-4">{error}</p>
                )}

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleEnregistrer}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800
                                   disabled:bg-gray-300 disabled:cursor-not-allowed
                                   text-white font-semibold px-6 py-2.5 rounded-xl transition"
                    >
                        {saving
                            ? <><Loader2 className="animate-spin" size={16} /> Enregistrement...</>
                            : <><Save size={16} /> Enregistrer le brouillon</>}
                    </button>
                </div>
            </div>
        </div>
    )
}