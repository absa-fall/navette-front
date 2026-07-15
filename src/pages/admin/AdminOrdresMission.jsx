import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { formatDateHeure } from '../../utils/formatDate'
import { FileText, Search, Trash2 } from 'lucide-react'

const STATUT_LABELS = {
    brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
    en_attente_drh: { label: 'En attente DRH', color: 'bg-yellow-100 text-yellow-700' },
    approuve_drh: { label: 'Approuvé DRH', color: 'bg-blue-100 text-blue-700' },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
    transmis_chauffeur: { label: 'Transmis chauffeur', color: 'bg-indigo-100 text-indigo-700' },
    refuse_chauffeur: { label: 'Refusé chauffeur', color: 'bg-red-100 text-red-700' },
    execute: { label: 'Exécuté', color: 'bg-green-100 text-green-700' },
}

export default function AdminOrdresMission() {
    const [ordres, setOrdres] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        api.get('/ordres-mission')
            .then(res => setOrdres(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const ordresFiltres = ordres.filter(o => {
        const s = search.toLowerCase()
        return s === '' ||
            o.ddl?.nom?.toLowerCase().includes(s) ||
            o.ddl?.prenom?.toLowerCase().includes(s) ||
            o.chauffeur_nom?.toLowerCase().includes(s) ||
            o.destination?.toLowerCase().includes(s)
    })

    const getStatut = (statut) => STATUT_LABELS[statut] || { label: statut, color: 'bg-gray-100 text-gray-600' }

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === ordresFiltres.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(ordresFiltres.map(o => o.id))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        const confirmMsg = selectedIds.length === 1
            ? 'Voulez-vous vraiment supprimer cet ordre de mission ?'
            : `Voulez-vous vraiment supprimer ces ${selectedIds.length} ordres de mission ?`
        if (!window.confirm(confirmMsg)) return

        setDeleting(true)
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/ordres-mission/${id}`)))
            setOrdres(prev => prev.filter(o => !selectedIds.includes(o.id)))
            setSelectedIds([])
        } catch (err) {
            console.error(err)
            alert("Une erreur est survenue lors de la suppression.")
        } finally {
            setDeleting(false)
        }
    }

    const allSelected = ordresFiltres.length > 0 && selectedIds.length === ordresFiltres.length

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Ordres de mission</h1>
                        <p className="text-gray-500 text-sm mt-1">{ordres.length} ordre(s) au total — vue globale (sans accès aux documents)</p>
                    </div>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition"
                        >
                            <Trash2 size={16} />
                            {deleting
                                ? 'Suppression...'
                                : `Supprimer (${selectedIds.length})`}
                        </button>
                    )}
                </div>

                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par DDL, chauffeur, destination..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : ordresFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun ordre de mission trouvé</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Créé par (DDL)</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Chauffeur</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Destination</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date départ</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date retour</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Créé le</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {ordresFiltres.map(o => {
                                    const st = getStatut(o.statut)
                                    const isSelected = selectedIds.includes(o.id)
                                    return (
                                        <tr key={o.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <td className="px-5 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(o.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-5 py-4 font-medium text-gray-800">
                                                {o.ddl ? `${o.ddl.prenom} ${o.ddl.nom}` : '-'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {o.chauffeur_prenom} {o.chauffeur_nom}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{o.destination || '-'}</td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {o.date_depart ? new Date(o.date_depart).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {o.date_retour ? new Date(o.date_retour).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
    {formatDateHeure(o.created_at)}
</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    )
}