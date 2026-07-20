import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import SignaturePad from '../../components/SignaturePad'
import { FileText, Save, Lock, CheckCircle, ChevronLeft, ChevronRight, AlertCircle, Send, Eye, Trash2, History } from 'lucide-react'

const statutPvConfig = {
    brouillon:         { label: 'Brouillon',           color: 'bg-orange-100 text-orange-700' },
    finalise:          { label: 'Finalise',            color: 'bg-purple-100 text-purple-700' },
    transmis_recteur:  { label: 'Transmis au Recteur',  color: 'bg-blue-100 text-blue-700' },
    signe:             { label: 'Signe par le Recteur', color: 'bg-green-100 text-green-700' },
}

export default function ProcesVerbalAnnuel() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [annee, setAnnee] = useState(new Date().getFullYear())
    const [pv, setPv] = useState(null)
    const [contenu, setContenu] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [finalisation, setFinalisation] = useState(false)
    const [transmission, setTransmission] = useState(false)
    const [message, setMessage] = useState('')
    const [erreur, setErreur] = useState('')
    const [confirmFinaliser, setConfirmFinaliser] = useState(false)
    const [confirmTransmettre, setConfirmTransmettre] = useState(false)

    // ===== Onglets =====
    const [activeTab, setActiveTab] = useState('redaction') // 'redaction' | 'historique'

    // ===== Historique (liste des PV passes) =====
    const [pvsListe, setPvsListe] = useState([])
    const [loadingHistorique, setLoadingHistorique] = useState(true)
    const [selectedPvs, setSelectedPvs] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(false)

    const peutRediger = ['vice_recteur', 'commission'].includes(user?.role)
    const peutFinaliser = user?.role === 'vice_recteur'
    // Vice-Recteur : suppression reelle du PV (impacte tout le monde)
    const peutSupprimerReellement = user?.role === 'vice_recteur'
    // Recteur / Commission : masquage prive, sans impacter les autres
    const peutMasquerPourSoi = ['recteur', 'commission'].includes(user?.role)
    const peutAgirSurPv = peutSupprimerReellement || peutMasquerPourSoi
    const [pvsMasquesPourMoi, setPvsMasquesPourMoi] = useState([])
    const estFinalise = !!pv?.finalise_le
    const estTransmis = !!pv?.transmis_le
    const estSigneParVr = !!pv?.signe_vr_le
    const estSigneParRecteur = pv?.statut === 'signe'
    const editable = peutRediger && !estFinalise

    const chargerPvsHistorique = async () => {
        setLoadingHistorique(true)
        try {
            const res = await api.get('/proces-verbaux')
            setPvsListe(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            // silencieux
        } finally {
            setLoadingHistorique(false)
        }
    }

    useEffect(() => {
        const fetchPv = async () => {
            setLoading(true)
            setErreur('')
            try {
                const res = await api.get(`/proces-verbaux/${annee}`)
                setPv(res.data)
                setContenu(res.data.contenu || '')
            } catch (err) {
                if (err.response?.status === 404) {
                    setPv(null)
                    setContenu('')
                } else {
                    setErreur("Impossible de charger le PV de cette année.")
                }
            } finally {
                setLoading(false)
            }
        }
        fetchPv()
    }, [annee])

    useEffect(() => {
        chargerPvsHistorique()
    }, [])

    useEffect(() => {
        if (!user?.id) return
        const masques = JSON.parse(localStorage.getItem(`pv-liste-masques-${user.id}`) || '[]')
        setPvsMasquesPourMoi(masques)
    }, [user?.id])

    useEffect(() => {
        setSelectedPvs([])
    }, [activeTab])

    const enregistrer = async () => {
        setSaving(true)
        setMessage('')
        setErreur('')
        try {
            const res = await api.put(`/proces-verbaux/${annee}`, { contenu })
            setPv(res.data)
            setMessage('PV enregistré avec succès.')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.")
        } finally {
            setSaving(false)
        }
    }

    const finaliser = async () => {
        setFinalisation(true)
        setErreur('')
        try {
            const res = await api.post(`/proces-verbaux/${annee}/finaliser`)
            setPv(res.data)
            setContenu(res.data.contenu || '')
            setMessage('PV finalisé. Il est maintenant verrouillé.')
            setConfirmFinaliser(false)
            chargerPvsHistorique()
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la finalisation.')
        } finally {
            setFinalisation(false)
        }
    }

    const signerVr = async (signatureDataUrl) => {
        if (!signatureDataUrl) return
        setErreur('')
        try {
            const res = await api.post(`/proces-verbaux/${annee}/signer-vr`, { signature: signatureDataUrl })
            setPv(res.data)
            setMessage('Signature du Vice-Recteur enregistrée.')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la signature.')
        }
    }

    const signerRecteur = async (signatureDataUrl) => {
        if (!signatureDataUrl) return
        setErreur('')
        try {
            const res = await api.post(`/proces-verbaux/${annee}/signer-recteur`, { signature: signatureDataUrl })
            setPv(res.data)
            setMessage('PV signé par le Recteur.')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la signature.')
        }
    }

    const transmettre = async () => {
        setTransmission(true)
        setErreur('')
        try {
            const res = await api.post(`/proces-verbaux/${annee}/transmettre`)
            setPv(res.data)
            setMessage('Le procès-verbal a été transmis avec succès.')
            setConfirmTransmettre(false)
            chargerPvsHistorique()
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la transmission.')
        } finally {
            setTransmission(false)
        }
    }

    const statutLabel = () => {
        if (estSigneParRecteur) return { text: 'Signé par le Recteur', color: 'bg-green-100 text-green-700', icon: CheckCircle }
        if (estTransmis) return { text: 'Transmis au Recteur', color: 'bg-blue-100 text-blue-700', icon: Send }
        if (estFinalise) return { text: 'Finalisé', color: 'bg-purple-100 text-purple-700', icon: Lock }
        if (pv) return { text: 'Brouillon', color: 'bg-orange-100 text-orange-700', icon: FileText }
        return null
    }

    const badge = statutLabel()

    // ===== HISTORIQUE : PV finalises/transmis/signes, sans ceux masques par cet utilisateur =====
    const pvsHistorique = pvsListe
        .filter(p => p.statut && p.statut !== 'brouillon')
        .filter(p => !pvsMasquesPourMoi.includes(p.annee))

    const toggleSelectPv = (anneePv) =>
        setSelectedPvs(prev => prev.includes(anneePv) ? prev.filter(a => a !== anneePv) : [...prev, anneePv])

    const toggleSelectAllPvs = () =>
        setSelectedPvs(selectedPvs.length === pvsHistorique.length ? [] : pvsHistorique.map(p => p.annee))

    // Vice-Recteur : suppression reelle (impacte tout le monde)
    const supprimerReellementPvs = async (annees) => {
        if (annees.length === 0) return
        if (!confirm(`Supprimer definitivement ${annees.length} proces-verbal(aux) ? Cette action est irreversible et le(s) supprime pour tout le monde.`)) return
        setDeleteLoading(true)
        try {
            await Promise.all(annees.map(a => api.delete(`/proces-verbaux/${a}`)))
            setSelectedPvs([])
            chargerPvsHistorique()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression.')
        } finally {
            setDeleteLoading(false)
        }
    }

    // Recteur / Commission : masquage prive, sans impacter les autres utilisateurs
    const masquerPourMoi = (annees) => {
        if (annees.length === 0 || !user?.id) return
        const nouveaux = [...new Set([...pvsMasquesPourMoi, ...annees])]
        setPvsMasquesPourMoi(nouveaux)
        localStorage.setItem(`pv-liste-masques-${user.id}`, JSON.stringify(nouveaux))
        setSelectedPvs([])
    }

    // Point d'entree unique utilise par les boutons : choisit le bon comportement selon le role
    const supprimerOuMasquerPvs = (annees) => {
        if (peutSupprimerReellement) {
            supprimerReellementPvs(annees)
        } else if (peutMasquerPourSoi) {
            masquerPourMoi(annees)
        }
    }

    return (
        <Layout title="Procès-verbal annuel" subtitle="Rédigé conjointement par le Vice-Recteur et la Commission">
            <div className="space-y-5 max-w-4xl">

                {/* Onglets */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button onClick={() => setActiveTab('redaction')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                            activeTab === 'redaction' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}>
                        Rédaction
                    </button>
                    <button onClick={() => setActiveTab('historique')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                            activeTab === 'historique' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}>
                        <History size={15} />
                        Historique
                        {pvsHistorique.length > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5 font-bold">
                                {pvsHistorique.length}
                            </span>
                        )}
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

                {/* ===== ONGLET REDACTION ===== */}
                {activeTab === 'redaction' && (
                    <>
                       {/* En-tête PV de l'année en cours */}
                        <div className="flex items-center gap-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <FileText size={18} className="text-blue-700" />
                            <span className="font-serif text-lg font-semibold text-blue-950">PV {annee}</span>
                            {badge && (
                                <span className={`flex items-center gap-1 ${badge.color} text-xs font-semibold px-2.5 py-1 rounded-full`}>
                                    <badge.icon size={11} /> {badge.text}
                                </span>
                            )}
                        </div>

                        {/* Contenu du PV */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            {loading ? (
                                <p className="text-sm text-slate-400">Chargement...</p>
                            ) : !pv && !peutRediger ? (
                                <p className="text-sm text-slate-400">Aucun PV rédigé pour l'année {annee}.</p>
                            ) : (
                                <>
                                    <textarea
                                        value={contenu}
                                        onChange={e => setContenu(e.target.value)}
                                        disabled={!editable}
                                        rows={16}
                                        placeholder={editable ? "Rédigez ici le procès-verbal de l'année..." : ''}
                                        className={`w-full border border-slate-200 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
                                            !editable ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
                                        }`}
                                    />

                                    {pv?.derniere_modif_par && (
                                        <p className="text-xs text-slate-400 mt-2">
                                            Dernière modification par {pv.derniere_modif_par.prenom} {pv.derniere_modif_par.nom}
                                        </p>
                                    )}

                                    {editable && (
                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                                            <button
                                                onClick={enregistrer}
                                                disabled={saving}
                                                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                                            >
                                                <Save size={16} />
                                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                                            </button>

                                            <button
                                                onClick={() => navigate(`/proces-verbal/${annee}/document`)}
                                                className="flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition"
                                            >
                                                <FileText size={16} /> Voir
                                            </button>

                                            {peutFinaliser && (
                                                confirmFinaliser ? (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-slate-600">Confirmer la finalisation (irréversible) ?</span>
                                                        <button
                                                            onClick={finaliser}
                                                            disabled={finalisation}
                                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
                                                        >
                                                            {finalisation ? 'Finalisation...' : 'Oui, finaliser'}
                                                        </button>
                                                        <button onClick={() => setConfirmFinaliser(false)} className="text-slate-500 hover:text-slate-700 px-2 py-1.5 text-xs">
                                                            Annuler
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmFinaliser(true)}
                                                        className="flex items-center gap-2 border border-green-600 text-green-700 hover:bg-green-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition"
                                                    >
                                                        <Lock size={16} /> Finaliser le PV
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Bloc signatures — visible seulement une fois le PV finalisé */}
                        {estFinalise && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                                <h3 className="font-serif font-semibold text-blue-950 text-base">Signatures</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <SignaturePad
                                        storageKey={`pv-signature-vr-${annee}`}
                                        label="Vice-Recteur"
                                        initialValue={pv?.signature_vr || null}
                                        readOnly={user?.role !== 'vice_recteur' || estSigneParVr}
                                        onSaved={(sig) => { if (user?.role === 'vice_recteur' && !estSigneParVr) signerVr(sig) }}
                                    />

                                    {estTransmis && (
                                        <SignaturePad
                                            storageKey={`pv-signature-recteur-${annee}`}
                                            label="Recteur"
                                            initialValue={pv?.signature_recteur || null}
                                            readOnly={user?.role !== 'recteur' || estSigneParRecteur}
                                            onSaved={(sig) => { if (user?.role === 'recteur' && !estSigneParRecteur) signerRecteur(sig) }}
                                        />
                                    )}
                                </div>

                                {peutFinaliser && estSigneParVr && !estTransmis && (
                                    <div className="pt-4 border-t border-slate-100">
                                        {confirmTransmettre ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-slate-600">Transmettre définitivement ce PV au Recteur ?</span>
                                                <button
                                                    onClick={transmettre}
                                                    disabled={transmission}
                                                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
                                                >
                                                    {transmission ? 'Transmission...' : 'Oui, transmettre'}
                                                </button>
                                                <button onClick={() => setConfirmTransmettre(false)} className="text-slate-500 hover:text-slate-700 px-2 py-1.5 text-xs">
                                                    Annuler
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmTransmettre(true)}
                                                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition"
                                            >
                                                <Send size={16} /> Transmettre au Recteur
                                            </button>
                                        )}
                                    </div>
                                )}

                                {peutFinaliser && !estSigneParVr && (
                                    <p className="text-xs text-slate-400">
                                        La transmission au Recteur sera possible une fois que vous aurez signé.
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ===== ONGLET HISTORIQUE ===== */}
                {activeTab === 'historique' && (
                    loadingHistorique ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : pvsHistorique.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                            <History size={40} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-slate-700 font-semibold mb-2">Aucun historique</h3>
                            <p className="text-slate-400 text-sm">Les PV finalisés apparaîtront ici</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Barre selection */}
                            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox"
                                        checked={selectedPvs.length === pvsHistorique.length && pvsHistorique.length > 0}
                                        onChange={toggleSelectAllPvs}
                                        className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                    <span className="text-sm text-slate-600">
                                        {selectedPvs.length > 0 ? `${selectedPvs.length} selectionne(s)` : 'Tout selectionner'}
                                    </span>
                                </div>
                                {peutAgirSurPv && (
                                    <div className="flex gap-2">
                                        {selectedPvs.length > 0 && (
                                            <button onClick={() => supprimerOuMasquerPvs(selectedPvs)}
                                                disabled={deleteLoading}
                                                className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                                                <Trash2 size={13} /> Supprimer ({selectedPvs.length})
                                            </button>
                                        )}
                                        <button onClick={() => supprimerOuMasquerPvs(pvsHistorique.map(p => p.annee))}
                                            disabled={deleteLoading}
                                            className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                                            <Trash2 size={13} /> Supprimer tout
                                        </button>
                                    </div>
                                )}
                            </div>

                            {pvsHistorique.map(p => {
                                const statut = statutPvConfig[p.statut] || statutPvConfig['brouillon']
                                return (
                                    <div key={p.annee} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                        selectedPvs.includes(p.annee) ? 'border-blue-300' : 'border-slate-100'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox"
                                                    checked={selectedPvs.includes(p.annee)}
                                                    onChange={() => toggleSelectPv(p.annee)}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                                <div className="bg-blue-50 p-2.5 rounded-xl">
                                                    <FileText size={18} className="text-blue-700" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">Procès-verbal {p.annee}</p>
                                                    {p.finalise_par && (
                                                        <p className="text-xs text-slate-400">
                                                            Finalisé par {p.finalise_par.prenom} {p.finalise_par.nom}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statut.color}`}>
                                                    {statut.label}
                                                </span>
                                                <button onClick={() => navigate(`/proces-verbal/${p.annee}/document`)}
                                                    className="flex items-center gap-1.5 border border-blue-700 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                                                    <Eye size={13} /> Voir PV
                                                </button>
                                                {peutAgirSurPv && (
                                                    <button onClick={() => supprimerOuMasquerPvs([p.annee])}
                                                        disabled={deleteLoading}
                                                        className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50">
                                                        <Trash2 size={13} /> Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}
            </div>
        </Layout>
    )
}