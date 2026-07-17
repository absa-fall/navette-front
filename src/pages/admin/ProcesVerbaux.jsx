import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { FileText, Lock, CheckCircle, Clock } from 'lucide-react'

export default function AdminProcesVerbaux() {
    const [pvs, setPvs] = useState([])
    const [loading, setLoading] = useState(true)
    const [erreur, setErreur] = useState('')

    useEffect(() => {
        const fetchPvs = async () => {
            setLoading(true)
            setErreur('')
            try {
                const res = await api.get('/proces-verbaux')
                setPvs(res.data)
            } catch (err) {
                setErreur("Impossible de charger la liste des procès-verbaux.")
            } finally {
                setLoading(false)
            }
        }
        fetchPvs()
    }, [])

    const statutBadge = (statut) => {
        if (statut === 'finalise') {
            return (
                <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full w-fit">
                    <Lock size={11} /> Finalisé
                </span>
            )
        }
        if (statut === 'signe') {
            return (
                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full w-fit">
                    <CheckCircle size={11} /> Signé
                </span>
            )
        }
        return (
            <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full w-fit">
                <Clock size={11} /> Brouillon
            </span>
        )
    }

    return (
        <Layout title="Procès-verbaux" subtitle="Historique des PV annuels (consultation des métadonnées uniquement)">
            <div className="space-y-5 max-w-4xl">

                {erreur && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                        {erreur}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <p className="text-sm text-slate-400 p-6">Chargement...</p>
                    ) : pvs.length === 0 ? (
                        <p className="text-sm text-slate-400 p-6">Aucun procès-verbal enregistré pour le moment.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-slate-500">
                                    <th className="px-5 py-3 font-medium">Année</th>
                                    <th className="px-5 py-3 font-medium">Statut</th>
                                    <th className="px-5 py-3 font-medium">Dernière modification</th>
                                    <th className="px-5 py-3 font-medium">Finalisé par</th>
                                    <th className="px-5 py-3 font-medium">Le</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pvs.map(pv => (
                                    <tr key={pv.id} className="border-b border-slate-50 last:border-0">
                                        <td className="px-5 py-3 flex items-center gap-2 font-semibold text-blue-950">
                                            <FileText size={15} className="text-blue-700" /> {pv.annee}
                                        </td>
                                        <td className="px-5 py-3">{statutBadge(pv.statut)}</td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {pv.derniere_modif_par
                                                ? `${pv.derniere_modif_par.prenom} ${pv.derniere_modif_par.nom}`
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {pv.finalise_par
                                                ? `${pv.finalise_par.prenom} ${pv.finalise_par.nom}`
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">
                                            {pv.finalise_le
                                                ? new Date(pv.finalise_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    )
}