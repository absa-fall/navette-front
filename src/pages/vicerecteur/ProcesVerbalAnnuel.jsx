import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { FileText, Save, Lock, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

export default function ProcesVerbalAnnuel() {
    const { user } = useAuth()
    const [annee, setAnnee] = useState(new Date().getFullYear())
    const [pv, setPv] = useState(null)
    const [contenu, setContenu] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [finalisation, setFinalisation] = useState(false)
    const [message, setMessage] = useState('')
    const [erreur, setErreur] = useState('')
    const [confirmFinaliser, setConfirmFinaliser] = useState(false)

    const peutRediger = ['vice_recteur', 'commission'].includes(user?.role)
    const peutFinaliser = user?.role === 'vice_recteur'
    const estFinalise = pv?.statut === 'finalise'
    const editable = peutRediger && !estFinalise

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
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la finalisation.')
        } finally {
            setFinalisation(false)
        }
    }

    return (
        <Layout title="Procès-verbal annuel" subtitle="Rédigé conjointement par le Vice-Recteur et la Commission">
            <div className="space-y-5 max-w-4xl">

                {/* Sélecteur d'année */}
                <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <button
                        onClick={() => setAnnee(a => a - 1)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-blue-700" />
                        <span className="font-serif text-lg font-semibold text-blue-950">PV {annee}</span>
                        {estFinalise && (
                            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <Lock size={11} /> Finalisé
                            </span>
                        )}
                        {pv && !estFinalise && (
                            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                Brouillon
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setAnnee(a => a + 1)}
                        disabled={annee >= new Date().getFullYear()}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
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
                            {estFinalise && pv?.finalise_par && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Finalisé par {pv.finalise_par.prenom} {pv.finalise_par.nom} le{' '}
                                    {new Date(pv.finalise_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                                                <button
                                                    onClick={() => setConfirmFinaliser(false)}
                                                    className="text-slate-500 hover:text-slate-700 px-2 py-1.5 text-xs"
                                                >
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
            </div>
        </Layout>
    )
}