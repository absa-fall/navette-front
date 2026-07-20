import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, Save, CheckCircle, AlertCircle, ChevronLeft, PenLine, Upload, X } from 'lucide-react'
import { SECTIONS_RAPPORT, serialiserSections } from '../../utils/rapportVoyage'

export default function RapportLibre() {
    const navigate = useNavigate()

    const [mode, setMode] = useState('texte') // 'texte' | 'fichier'
    const [sections, setSections] = useState({ objectifs: '', deroulement: '', resultats: '', recommandations: '' })
    const [fichier, setFichier] = useState(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [erreur, setErreur] = useState('')

    const auMoinsUneSection = Object.values(sections).some(v => v.trim().length > 0)

    const handleSectionChange = (key, value) => {
        setSections(prev => ({ ...prev, [key]: value }))
    }

    const handleFichierChange = (e) => {
        const f = e.target.files[0]
        if (f) setFichier(f)
    }

    // Enregistre le rapport en brouillon, SANS voyage_id.
    // Le rattachement à un voyage (ou l'envoi direct au VR) se fait ensuite
    // depuis la page "Mes rapports".
    const soumettre = async () => {
        if (mode === 'texte' && !auMoinsUneSection) return
        if (mode === 'fichier' && !fichier) return

        setSaving(true)
        setMessage('')
        setErreur('')
        try {
            let res
            if (mode === 'fichier') {
                const formData = new FormData()
                formData.append('fichier_pdf', fichier)
                res = await api.post('/rapports', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                const contenu = serialiserSections(sections)
                res = await api.post('/rapports', { contenu })
            }

            const rapportCree = res.data.rapport
            setMessage('Brouillon enregistré.')
            setTimeout(() => {
                navigate('/enseignant/rapports')
            }, 800)
        } catch (err) {
            setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Layout title="Rapport libre" subtitle="Rédigez un rapport indépendant, sans le lier à un voyage d'études">
            <div className="space-y-5 max-w-4xl">

                <button
                    onClick={() => navigate('/enseignant/rapports')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
                >
                    <ChevronLeft size={16} /> Retour à mes rapports
                </button>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {erreur && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {erreur}
                    </div>
                )}

                <div className="flex items-center gap-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <FileText size={18} className="text-blue-700" />
                    <span className="font-serif text-lg font-semibold text-blue-950">Nouveau rapport libre</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                    Ce rapport n'est lié à aucun voyage d'études. Une fois enregistré, vous pourrez le retrouver
                    dans "Mes rapports" pour le rattacher à un voyage ou l'envoyer directement au Vice-Recteur.
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex gap-2 mb-5 border-b border-slate-200 pb-4">
                        <button
                            onClick={() => setMode('texte')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                mode === 'texte' ? 'bg-blue-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <PenLine size={15} /> Écrire le rapport
                        </button>
                        <button
                            onClick={() => setMode('fichier')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                mode === 'fichier' ? 'bg-blue-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Upload size={15} /> Téléverser un PDF
                        </button>
                    </div>

                    {mode === 'texte' && (
                        <div className="space-y-5">
                            {SECTIONS_RAPPORT.map(section => (
                                <div key={section.key}>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        {section.label}
                                    </label>
                                    <textarea
                                        value={sections[section.key]}
                                        onChange={e => handleSectionChange(section.key, e.target.value)}
                                        rows={section.rows}
                                        placeholder={section.placeholder}
                                        className="w-full border border-slate-200 rounded-xl p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {mode === 'fichier' && (
                        <div className="space-y-2">
                            <p className="text-sm text-slate-500">
                                Vous avez déjà rédigé votre rapport ailleurs ? Téléversez-le directement en PDF.
                            </p>
                            {fichier ? (
                                <div className="flex items-center justify-between text-sm bg-blue-50 rounded-lg px-3 py-2">
                                    <span className="flex items-center gap-2 text-blue-700 truncate">
                                        <FileText size={14} /> {fichier.name}
                                    </span>
                                    <button onClick={() => setFichier(null)} className="text-gray-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFichierChange}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none"
                                />
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={soumettre}
                            disabled={saving || (mode === 'texte' ? !auMoinsUneSection : !fichier)}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Enregistrement...' : 'Enregistrer le brouillon'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}