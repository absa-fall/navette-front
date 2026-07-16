import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
    ClipboardList,
    Calendar,
    CheckCircle,
    AlertCircle,
    Loader,
    FileSpreadsheet,
    FileText,
    Trash2,
    Search
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LABELS_TRAJET = { aller: 'Aller', retour: 'Retour', aller_retour: 'Aller-retour' }

const getTypeTrajetResume = (p) => {
    const types = [...new Set((p.trajets || []).map(t => t.type_trajet))]
    return types.map(t => LABELS_TRAJET[t] || t).join(', ') || '-'
}
const getVillesResume = (p) => {
    const villes = (p.trajets || []).map(t => t.trajet)
    return [...new Set(villes)].join(' | ') || '-'
}
export default function Recapitulatifs() {
const navigate = useNavigate() 
    const [recaps, setRecaps] = useState([])
    
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [debut, setDebut] = useState('')
    const [fin, setFin] = useState('')
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)
    const [selected, setSelected] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    const [detailOuvert, setDetailOuvert] = useState(null)
const [detailData, setDetailData]     = useState({})
const [detailLoading, setDetailLoading] = useState(null)
    const [searchRecaps, setSearchRecaps] = useState('')

    useEffect(() => { fetchRecaps() }, [])

    const fetchRecaps = async () => {
        try {
            setLoading(true)
            const res = await api.get('/recapitulatifs')
            setRecaps(res.data)
        } catch (err) {
            setError('Erreur lors du chargement des récapitulatifs')
        } finally {
            setLoading(false)
        }
    }
const toggleDetail = async (recapId) => {
    if (detailOuvert === recapId) { setDetailOuvert(null); return }
    setDetailOuvert(recapId)
    if (detailData[recapId]) return
    setDetailLoading(recapId)
    try {
        const res = await api.get(`/recapitulatifs/${recapId}`)
        setDetailData(prev => ({ ...prev, [recapId]: res.data.detail_par_personne }))
    } catch {
        setError('Erreur lors du chargement du detail')
    } finally {
        setDetailLoading(null)
    }
}
    const handleGenerer = async (e) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        setGenerating(true)
        try {
            const res = await api.post('/recapitulatifs/generer', {
                semaine_debut: debut,
                semaine_fin: fin
            })
            setMessage(res.data.message)
            fetchRecaps()
            setDebut('')
            setFin('')
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la génération')
        } finally {
            setGenerating(false)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        if (selectAll) { setSelected([]); setSelectAll(false) }
        else { setSelected(recapsFiltres.map(r => r.id)); setSelectAll(true) }
    }

    const supprimerSelection = async () => {
        if (selected.length === 0) { alert('Sélectionnez au moins un récapitulatif'); return }
        if (!window.confirm(`Supprimer ${selected.length} récapitulatif(s) ?`)) return
        try {
            await api.delete('/recapitulatifs/supprimer-selection', { data: { ids: selected } })
            setRecaps(prev => prev.filter(r => !selected.includes(r.id)))
            setSelected([])
            setSelectAll(false)
            setMessage('Récapitulatif(s) supprimé(s) avec succès')
        } catch (err) {
            setError('Erreur lors de la suppression')
        }
    }

    const exportExcel = async (recap) => {
        try {
            const res = await api.get(`/recapitulatifs/${recap.id}`)
            const { detail_par_personne } = res.data
            const BOM = '\uFEFF'
           
            const lignes = [
    ['RÉCAPITULATIF HEBDOMADAIRE'],
    [],
    ['Nom', 'Prénom', 'UFR', 'Type', 'Type de trajet', 'Villes', 'Trajets', 'Montant'],
    ...detail_par_personne.map(p => [
        p.nom,
        p.prenom,
        p.ufr || '-',
        p.type_profil || '-',
        getTypeTrajetResume(p),
        getVillesResume(p),
        p.nombre_trajets,
        p.montant_total
    ])
]
            const csvContent = BOM + lignes.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `recap_${recap.semaine_debut}_${recap.semaine_fin}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            alert("Erreur export Excel")
        }
    }
const exportPDF = (recap) => {
    navigate(`/recapitulatifs/${recap.id}/document`)
}

    const recapsFiltres = recaps.filter(r => {
        if (searchRecaps === '') return true
        const terme = searchRecaps.toLowerCase()
        const dateDebut = new Date(r.semaine_debut).toLocaleDateString('fr-FR')
        const dateFin = new Date(r.semaine_fin).toLocaleDateString('fr-FR')
        const semaineLabel = `semaine du ${dateDebut} au ${dateFin}`
        return semaineLabel.includes(terme)
    })

    return (
        <Layout>
            <div className="space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Récapitulatifs hebdomadaires</h1>
                    <p className="text-gray-500 text-sm mt-1">{recapsFiltres.length} récapitulatif(s)</p>
                </div>

                {/* MESSAGES */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {message && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}

                {/* GENERATION */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-700" />
                        Générer un récapitulatif
                    </h2>
                    <form onSubmit={handleGenerer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Début de semaine</label>
                            <input type="date" value={debut} onChange={e => setDebut(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fin de semaine</label>
                            <input type="date" value={fin} onChange={e => setFin(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required />
                        </div>
                        <button type="submit" disabled={generating}
                            className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                            {generating ? <><Loader size={16} className="animate-spin" /> Génération...</> : <><ClipboardList size={16} /> Générer</>}
                        </button>
                    </form>
                </div>

                {/* RECHERCHE */}
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par semaine (ex: 14/07/2026)..."
                        value={searchRecaps}
                        onChange={e => setSearchRecaps(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* BARRE SELECTION */}
                {recapsFiltres.length > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            Tout sélectionner ({recapsFiltres.length})
                        </label>
                        {selected.length > 0 && (
                            <button onClick={supprimerSelection}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                                <Trash2 size={14} />
                                Supprimer ({selected.length})
                            </button>
                        )}
                    </div>
                )}

                {/* LISTE */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recapsFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">
                            {recaps.length === 0 ? 'Aucun récapitulatif' : 'Aucun résultat'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {recaps.length === 0 ? 'Générez votre premier récapitulatif ci-dessus' : 'Essayez une autre recherche'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                      {recapsFiltres.map(recap => (
    <div key={recap.id}
        className={`bg-white rounded-2xl p-5 border shadow-sm transition ${selected.includes(recap.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <input type="checkbox" checked={selected.includes(recap.id)} onChange={() => toggleSelect(recap.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <div className="bg-blue-100 p-3 rounded-xl">
                    <ClipboardList size={20} className="text-blue-700" />
                </div>
                <div>
                    <p className="font-semibold text-gray-800">
                        Semaine du {new Date(recap.semaine_debut).toLocaleDateString('fr-FR')} au {new Date(recap.semaine_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Généré le {new Date(recap.date_generation).toLocaleDateString('fr-FR')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                    recap.statut === 'valide'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                }`}>
                    {recap.statut === 'valide' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {recap.statut === 'valide' ? 'Validé' : 'Brouillon'}
                </span>

                <span className="text-sm font-bold text-gray-700">
                    {Number(recap.montant_total).toLocaleString()} FCFA
                </span>

                <button onClick={() => toggleDetail(recap.id)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
                    {detailOuvert === recap.id ? 'Masquer' : 'Voir les trajets'}
                </button>

                <button onClick={() => exportExcel(recap)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                    <FileSpreadsheet size={15} />
                    Excel
                </button>

                <button onClick={() => exportPDF(recap)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                    <FileText size={15} />
                    PDF
                </button>
            </div>
        </div>

        {detailOuvert === recap.id && (
            <div className="mt-4 border-t border-gray-100 pt-4">
                {detailLoading === recap.id ? (
                    <div className="flex justify-center py-6">
                        <div className="w-5 h-5 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(detailData[recap.id] || []).map((p, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-800">{p.prenom} {p.nom}</p>
                                    <span className="text-xs text-gray-500">{p.ufr || '-'} · {p.type_profil || '-'}</span>
                                </div>
                                <div className="space-y-1">
                                    {p.trajets.map((t, j) => (
                                        <div key={j} className="flex items-center justify-between text-xs text-gray-600 bg-white rounded-lg px-3 py-2">
                                            <span>{new Date(t.date).toLocaleDateString('fr-FR')} — {t.trajet}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="text-gray-400">{LABELS_TRAJET[t.type_trajet] || t.type_trajet}</span>
                                                <span className="font-semibold text-gray-700">{Number(t.montant).toLocaleString()} FCFA</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
))}
                    </div>
                )}
            </div>
        </Layout>
    )
}