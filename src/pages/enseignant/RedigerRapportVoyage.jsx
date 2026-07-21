import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
    FileText, Save, CheckCircle, AlertCircle, ChevronLeft, XCircle, Clock,
    PenLine, Upload, X, Eye, History, Trash2, Lock, ArrowRight,
} from 'lucide-react'
import { SECTIONS_RAPPORT, parseContenu, serialiserSections } from '../../utils/rapportVoyage'
import { STORAGE_URL } from '../../api/storageUrl'

const statutRapportConfig = {
    brouillon: { label: 'Brouillon, non transmis',  color: 'bg-slate-100 text-slate-600', icon: PenLine },
    soumis: { label: 'Soumis, en attente du VR', color: 'bg-blue-100 text-blue-700',   icon: Clock },
    valide: { label: 'Validé par le VR',          color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejete: { label: 'Rejeté par le VR',          color: 'bg-red-100 text-red-700',     icon: XCircle },
}

// Justificatifs soumis par fichier PDF, en complément du rapport rédigé dans l'appli
const TYPES_JUSTIFICATIFS_FICHIER = [
    { key: 'talons',          label: 'Talons' },
    { key: 'caches_ent_sort', label: 'Caches Entrées/Sorties' },
    { key: 'invitation',      label: 'Invitation' },
]

export default function RedigerRapportVoyage() {
    // voyageId : identifiant du voyage d'études (b.voyage.id), pas le beneficiaireId
    const { voyageId } = useParams()
    const [searchParams] = useSearchParams()
    // beneficiaireId est nécessaire pour l'envoi des justificatifs (endpoint distinct du rapport).
    // Transmis depuis "Mes voyages" en query param : ?beneficiaireId=...
    const beneficiaireId = searchParams.get('beneficiaireId')
    const navigate = useNavigate()
const location = useLocation()
    const [ongletActif, setOngletActif] = useState('rediger') // 'rediger' | 'historique'

    // ── Rédaction du rapport ──
    const [rapport, setRapport] = useState(null)
    const [mode, setMode]       = useState('texte') // 'texte' | 'fichier'
    const [sections, setSections] = useState({ objectifs: '', deroulement: '', resultats: '', recommandations: '' })
    const [fichier, setFichier] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving]   = useState(false)
    const [message, setMessage] = useState('')
    const [erreur, setErreur]   = useState('')
const [pdfAffiche, setPdfAffiche] = useState(null)
    const [fichiersJustif, setFichiersJustif] = useState({})
    const [fichiersAutres, setFichiersAutres] = useState([])

    // ── Historique ──
    const [historique, setHistorique]           = useState([])
    const [historiqueLoading, setHistoriqueLoading] = useState(false)
    const [selection, setSelection]              = useState([])
    const [justifOuvert, setJustifOuvert]         = useState(null)
    const [suppressionLoading, setSuppressionLoading] = useState(false)
const [mesVoyages, setMesVoyages] = useState([])
const [rattachPanelOuvert, setRattachPanelOuvert] = useState(null)
const [rattachVoyageId, setRattachVoyageId] = useState('')
const [rattachLoading, setRattachLoading] = useState(false)
    const estRejete = rapport?.statut === 'rejete'
    const estBrouillon = rapport?.statut === 'brouillon'
    const editable = !rapport || estRejete || estBrouillon

    // Le bloc justificatifs est visible dès que le rapport existe (brouillon ou transmis)...
    const peutVoirJustificatifs = rapport && ['brouillon', 'soumis', 'valide', 'rejete'].includes(rapport.statut)
    // ...mais on ne peut MODIFIER/AJOUTER des justificatifs que si le VR/la commission n'a pas encore réagi.
    // Une fois "soumis" (en attente) ou "valide" (déjà traité), c'est verrouillé — sauf en cas de rejet, où
    // l'enseignant doit pouvoir corriger et renvoyer un dossier complet.
    const peutModifierJustificatifs = rapport && ['brouillon', 'rejete'].includes(rapport.statut)

    // Tous les justificatifs obligatoires sont-ils prêts (sélectionnés en mémoire) ?
    const justificatifsPrets = TYPES_JUSTIFICATIFS_FICHIER.every(t => fichiersJustif[t.key])

    useEffect(() => {
        const fetchRapport = async () => {
            setLoading(true)
            setErreur('')
            try {
                const res = await api.get(`/rapports/voyage/${voyageId}`)
                const data = res.data
                const rapportReel = (data && !Array.isArray(data) && data.id) ? data : null
                setRapport(rapportReel)
                setSections(parseContenu(rapportReel?.contenu))
            } catch (err) {
                if (err.response?.status === 404) {
                    setRapport(null)
                } else {
                    setErreur("Impossible de charger le rapport.")
                }
            } finally {
                setLoading(false)
            }
        }
        fetchRapport()
    }, [voyageId, location.key])

 useEffect(() => {
    if (ongletActif === 'historique') {
        fetchHistorique()
        api.get('/mes-voyages-etudes').then(res => setMesVoyages(res.data)).catch(() => {})
    }
}, [ongletActif, voyageId, location.key])
    const fetchHistorique = async () => {
        setHistoriqueLoading(true)
        try {
            const res = await api.get('/rapports')
            setHistorique(res.data)
        } catch (err) {
            setErreur("Impossible de charger l'historique des rapports.")
        } finally {
            setHistoriqueLoading(false)
        }
    }

    const handleSectionChange = (key, value) => {
        setSections(prev => ({ ...prev, [key]: value }))
    }

    const handleFichierChange = (e) => {
        const f = e.target.files[0]
        if (f) setFichier(f)
    }

    const auMoinsUneSection = Object.values(sections).some(v => v.trim().length > 0)

    // Enregistre le rapport (texte ou PDF) en brouillon. Ne navigue plus automatiquement :
    // l'enseignant reste sur la page pour attacher ses justificatifs juste après.
    const soumettre = async () => {
        if (mode === 'texte' && !auMoinsUneSection) return
        if (mode === 'fichier' && !fichier) return

        setSaving(true)
        setMessage('')
        setErreur('')
        try {
            let res
            const url = estRejete ? `/rapports/${rapport.id}/resoumettre` : '/rapports'

            if (mode === 'fichier') {
                const formData = new FormData()
                if (!estRejete) formData.append('voyage_id', voyageId)
                formData.append('fichier_pdf', fichier)
                res = estRejete
                    ? await api.patch(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                    : await api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            } else {
                const contenu = serialiserSections(sections)
                const payload = estRejete ? { contenu } : { voyage_id: voyageId, contenu }
                res = estRejete ? await api.patch(url, payload) : await api.post(url, payload)
            }

            const rapportMisAJour = res.data.rapport
            setRapport(rapportMisAJour)
            setFichier(null)
            setMessage(
                estRejete
                    ? 'Rapport corrigé. Vérifiez vos justificatifs ci-dessous, puis continuez vers la signature.'
                    : 'Brouillon enregistré. Ajoutez vos justificatifs ci-dessous, puis continuez vers la signature.'
            )
        } catch (err) {
            setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.")
        } finally {
            setSaving(false)
        }
    }

    // ── Justificatifs : sélection en mémoire seulement (pas d'envoi ici) ──
    const handleFichierJustifChange = (typeKey, e) => {
        const f = e.target.files[0]
        if (!f) return
        setFichiersJustif(prev => ({ ...prev, [typeKey]: f }))
    }

    const retirerFichierJustif = (typeKey) => {
        setFichiersJustif(prev => {
            const copie = { ...prev }
            delete copie[typeKey]
            return copie
        })
    }

    const handleFichiersAutresChange = (e) => {
        const nouveaux = Array.from(e.target.files)
        if (nouveaux.length === 0) return
        setFichiersAutres(prev => [...prev, ...nouveaux])
        e.target.value = ''
    }

    const retirerFichierAutre = (index) => {
        setFichiersAutres(prev => prev.filter((_, i) => i !== index))
    }

    // Direction la page de signature. Les fichiers en mémoire (justificatifs) voyagent
    // avec la navigation (state du router) — ils seront envoyés avec la signature,
    // en une seule requête, au moment de "Transmettre le rapport".
    const allerSigner = () => {
        if (!beneficiaireId) {
            setErreur("Identifiant du voyage manquant : revenez depuis la page \"Mes voyages\" pour continuer.")
            return
        }
        const suite = `?beneficiaireId=${beneficiaireId}&voyageId=${voyageId}`
        navigate(`/rapports/${rapport.id}/document${suite}`, {
            state: {
                justificatifsFiles: fichiersJustif,
                justificatifsAutresFiles: fichiersAutres,
            },
        })
    }

    // ── Historique ──
    const toggleSelection = (id) => {
        setSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectionAll = () => {
        if (selection.length === historique.length) setSelection([])
        else setSelection(historique.map(r => r.id))
    }
const supprimerSelection = async () => {
    if (selection.length === 0) return
    if (!confirm(`Supprimer définitivement ${selection.length} rapport(s) de votre historique ?`)) return
    setSuppressionLoading(true)
    try {
        await api.delete('/rapports/supprimer-selection', { data: { ids: selection } })
            setHistorique(prev => prev.filter(r => !selection.includes(r.id)))
            setSelection([])
        } catch (err) {
            setErreur("Erreur lors de la suppression.")
        } finally {
            setSuppressionLoading(false)
        }
    }
const rattacherVoyage = async (rapportId) => {
    if (!rattachVoyageId) return
    setRattachLoading(true)
    try {
        await api.patch(`/rapports/${rapportId}/rattacher-voyage`, { voyage_id: rattachVoyageId })
        setRattachPanelOuvert(null)
        setRattachVoyageId('')
        fetchHistorique()
        setMessage('Rapport rattaché au voyage avec succès.')
        setTimeout(() => setMessage(''), 4000)
    } catch (err) {
        setErreur(err.response?.data?.message || 'Erreur lors du rattachement.')
    } finally {
        setRattachLoading(false)
    }
}
    const badge = rapport ? statutRapportConfig[rapport.statut] : null

    return (
        <Layout title="Rapport de voyage" subtitle="Rédigez votre rapport, ajoutez vos justificatifs, et suivez votre historique">
            <div className="space-y-5 max-w-4xl">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
                >
                    <ChevronLeft size={16} /> Retour à mes voyages
                </button>

                {/* Onglets */}
                <div className="flex gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-fit">
                    <button
                        onClick={() => setOngletActif('rediger')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            ongletActif === 'rediger' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <FileText size={15} /> Mon rapport
                    </button>
                    <button
                        onClick={() => setOngletActif('historique')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            ongletActif === 'historique' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <History size={15} /> Historique
                    </button>
                </div>

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

                {ongletActif === 'rediger' ? (
                    <>
                        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileText size={18} className="text-blue-700" />
                                <span className="font-serif text-lg font-semibold text-blue-950">Rapport de voyage</span>
                                {badge && (
                                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                                        <badge.icon size={11} /> {badge.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {estBrouillon && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                                Ce brouillon n'a pas encore été transmis. Ajoutez vos justificatifs ci-dessous,
                                puis rendez-vous sur le document officiel pour signer et envoyer le dossier complet.
                            </div>
                        )}

                        {rapport?.statut === 'rejete' && rapport?.commentaire_vr && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                                <p className="font-semibold mb-1">Motif du rejet :</p>
                                <p>{rapport.commentaire_vr}</p>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            {loading ? (
                                <p className="text-sm text-slate-400">Chargement...</p>
                            ) : (
                                <>
                                    {editable && (
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
                                    )}

                                    {(!editable || mode === 'texte') && (
                                        <div className="space-y-5">
                                            {SECTIONS_RAPPORT.map(section => (
                                                <div key={section.key}>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        {section.label}
                                                    </label>
                                                    <textarea
                                                        value={sections[section.key]}
                                                        onChange={e => handleSectionChange(section.key, e.target.value)}
                                                        disabled={!editable}
                                                        rows={section.rows}
                                                        placeholder={editable ? section.placeholder : ''}
                                                        className={`w-full border border-slate-200 rounded-xl p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
                                                            !editable ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
                                                        }`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {editable && mode === 'fichier' && (
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

                                    {editable && (
                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                                            <button
                                                onClick={soumettre}
                                                disabled={saving || (mode === 'texte' ? !auMoinsUneSection : !fichier)}
                                                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                                            >
                                                <Save size={16} />
                                                {saving
                                                    ? 'Enregistrement...'
                                                    : estRejete
                                                        ? 'Enregistrer la correction'
                                                        : 'Enregistrer le brouillon'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Justificatifs — visibles dès que le rapport existe, modifiables seulement tant que le VR/la commission n'a pas réagi */}
                        {peutVoirJustificatifs && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                                <div>
                                    <h3 className="font-serif text-lg font-semibold text-blue-950">Justificatifs du dossier</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Ajoutez vos justificatifs ici, puis passez à l'étape suivante pour signer et
                                        envoyer le rapport et le dossier complet en une seule fois.
                                    </p>
                                </div>

                                {!peutModifierJustificatifs ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                                        <Lock size={18} className="text-slate-400 flex-shrink-0" />
                                        <p className="text-sm text-slate-500">
                                            {rapport.statut === 'valide'
                                                ? "Votre dossier a déjà été validé, il n'est plus possible d'ajouter de justificatifs."
                                                : "Votre rapport est en attente de traitement par le Vice-Recteur. Vous ne pouvez plus ajouter ou modifier de justificatifs pour le moment."}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            {TYPES_JUSTIFICATIFS_FICHIER.map(t => (
                                                <div key={t.key}>
                                                    <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                                                        {t.label} <span className="text-red-500">*</span>
                                                    </label>
                                                    {fichiersJustif[t.key] ? (
                                                        <div className="flex items-center justify-between text-sm bg-blue-50 rounded-lg px-3 py-2">
                                                            <span className="flex items-center gap-2 text-blue-700 truncate">
                                                                <FileText size={14} /> {fichiersJustif[t.key].name}
                                                            </span>
                                                            <button onClick={() => retirerFichierJustif(t.key)} className="text-gray-400 hover:text-red-500">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            onChange={(e) => handleFichierJustifChange(t.key, e)}
                                                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none"
                                                        />
                                                    )}
                                                </div>
                                            ))}

                                            <div>
                                                <label className="text-xs font-medium text-gray-500 flex flex-col gap-1 mb-1">
                                                    <span>Autres pièces justificatives <span className="text-gray-400">(optionnel)</span></span>
                                                    <span className="text-gray-400 font-normal normal-case">
                                                        Frais supplémentaires ou déplacements non couverts par votre indemnité.
                                                    </span>
                                                </label>
                                                <div className="space-y-2">
                                                    {fichiersAutres.map((f, i) => (
                                                        <div key={i} className="flex items-center justify-between text-sm bg-blue-50 rounded-lg px-3 py-2">
                                                            <span className="flex items-center gap-2 text-blue-700 truncate">
                                                                <FileText size={14} /> {f.name}
                                                            </span>
                                                            <button onClick={() => retirerFichierAutre(i)} className="text-gray-400 hover:text-red-500">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        multiple
                                                        onChange={handleFichiersAutresChange}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {!justificatifsPrets && (
                                            <p className="text-xs text-amber-600">
                                                Sélectionnez les 3 justificatifs obligatoires (Talons, Caches Entrées/Sorties, Invitation) pour continuer.
                                            </p>
                                        )}

                                        <button
                                            onClick={allerSigner}
                                            disabled={!justificatifsPrets}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Continuer vers la signature <ArrowRight size={16} />
                                        </button>
                                    </>
                                )}

                                {/* Si le dossier est déjà transmis (verrouillé), on garde un accès direct au document */}
                                {!peutModifierJustificatifs && rapport?.id && (
                                    <button
                                        onClick={() => navigate(`/rapports/${rapport.id}/document`)}
                                        className="flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition"
                                    >
                                        <Eye size={16} /> Voir le document officiel
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    // ── Onglet Historique ──
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selection.length === historique.length && historique.length > 0}
                                    onChange={toggleSelectionAll}
                                    className="w-4 h-4 accent-blue-700 cursor-pointer"
                                />
                                {selection.length > 0 ? `${selection.length} sélectionné(s)` : 'Tout sélectionner'}
                            </label>
                            {selection.length > 0 && (
                                <button
                                    onClick={supprimerSelection}
                                    disabled={suppressionLoading}
                                    className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                                >
                                    {suppressionLoading
                                        ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 size={13} />}
                                    Supprimer ({selection.length})
                                </button>
                            )}
                        </div>

                        {historiqueLoading ? (
                            <p className="text-sm text-slate-400 p-6">Chargement de l'historique...</p>
                        ) : historique.length === 0 ? (
                            <p className="text-sm text-slate-400 p-6">Aucun rapport dans votre historique.</p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {historique.map(r => {
                                    const badgeH = statutRapportConfig[r.statut] || statutRapportConfig.brouillon
                                    const isOuvert = justifOuvert === r.id
                                    return (
                                        <div key={r.id} className="px-5 py-3 hover:bg-slate-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selection.includes(r.id)}
                                                    onChange={() => toggleSelection(r.id)}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {r.voyage?.destination || r.voyage?.titre || 'Voyage'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {r.date_depot
    ? new Date(r.date_depot).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Non déposé'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {r.justificatifs?.length > 0 && (
                                                    <button
                                                        onClick={() => setJustifOuvert(isOuvert ? null : r.id)}
                                                        className="flex items-center gap-1.5 text-xs border border-slate-300 text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition"
                                                    >
                                                        <Eye size={13} /> Voir justificatifs
                                                    </button>
                                                )}
                                                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeH.color}`}>
                                                    <badgeH.icon size={11} /> {badgeH.label}
                                                </span>
                                                <button
                                                    onClick={() => navigate(`/rapports/${r.id}/document`)}
                                                    className="text-blue-700 hover:underline text-xs font-semibold"
                                                >
                                                    Voir
                                                </button>
                                            </div>
                                            {!r.voyage_id && (
    <div className="mt-3 pt-3 border-t border-slate-100 pl-7">
        {rattachPanelOuvert !== r.id ? (
            <button
                onClick={() => { setRattachPanelOuvert(r.id); setRattachVoyageId('') }}
                className="text-xs font-semibold text-purple-700 hover:underline"
            >
                Rattacher à un voyage
            </button>
        ) : (
            <div className="flex items-center gap-2 flex-wrap">
                <select
                    value={rattachVoyageId}
                    onChange={e => setRattachVoyageId(e.target.value)}
                    className="border border-purple-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                >
                    <option value="">Sélectionnez un voyage...</option>
                    {mesVoyages.map(b => (
                        <option key={b.id} value={b.voyage?.id}>
                            {b.voyage?.destination} — {new Date(b.voyage?.date_debut).toLocaleDateString('fr-FR')}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => rattacherVoyage(r.id)}
                    disabled={rattachLoading || !rattachVoyageId}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                    Rattacher
                </button>
                <button onClick={() => setRattachPanelOuvert(null)} className="text-xs text-gray-400 hover:text-gray-600">
                    Annuler
                </button>
            </div>
        )}
    </div>
)}
                                        </div>

                                        {isOuvert && r.justificatifs?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 pl-7">
                                                {r.justificatifs.map(j => (
                                                    <button
                                                        key={j.id}
                                                      onClick={() => {
    if (j.nom_original?.startsWith('Rapport_de_voyage_')) {
        navigate(`/rapports/${r.id}/document`)
    } else {
        setPdfAffiche(`${STORAGE_URL}/storage/${j.fichier_pdf}`)
    }
}}
                                                        className="flex items-center gap-2 text-sm text-slate-700 hover:underline"
                                                    >
                                                        <FileText size={14} /> {j.nom_original || 'Fichier PDF'}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
                {pdfAffiche && (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Aperçu du justificatif</h3>
                <button onClick={() => setPdfAffiche(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X size={18} />
                </button>
            </div>
            <iframe
                src={pdfAffiche}
                className="flex-1 w-full rounded-b-2xl"
                title="Justificatif PDF"
            />
        </div>
    </div>
)}
            </div>
        </Layout>
    )
}