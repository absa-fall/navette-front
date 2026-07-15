import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { formatDateHeure } from '../../utils/formatDate'
import { MapPin, Search, Users, Trash2 } from 'lucide-react'

const STATUT_LABELS = {
    brouillon:  { label: 'Brouillon',       color: 'bg-gray-100 text-gray-600' },
    publiee:    { label: 'Liste publiée',   color: 'bg-orange-100 text-orange-700' },
    definitive: { label: 'Liste définitive', color: 'bg-green-100 text-green-700' },
}

export default function AdminVoyagesEtudes() {
    const [voyages, setVoyages] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        api.get('/voyages-etudes')
            .then(res => setVoyages(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const voyagesFiltres = voyages.filter(v => {
        const s = search.toLowerCase()
        return s === '' ||
            v.destination?.toLowerCase().includes(s)
    })

    const getStatut = (statut) => STATUT_LABELS[statut] || { label: statut, color: 'bg-gray-100 text-gray-600' }

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === voyagesFiltres.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(voyagesFiltres.map(v => v.id))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        const confirmMsg = selectedIds.length === 1
            ? "Voulez-vous vraiment supprimer ce voyage d'études ?"
            : `Voulez-vous vraiment supprimer ces ${selectedIds.length} voyages d'études ?`
        if (!window.confirm(confirmMsg)) return

        setDeleting(true)
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/voyages-etudes/${id}`)))
            setVoyages(prev => prev.filter(v => !selectedIds.includes(v.id)))
            setSelectedIds([])
        } catch (err) {
            console.error(err)
            alert("Une erreur est survenue lors de la suppression.")
        } finally {
            setDeleting(false)
        }
    }

    const allSelected = voyagesFiltres.length > 0 && selectedIds.length === voyagesFiltres.length

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Voyages d'études</h1>
                        <p className="text-gray-500 text-sm mt-1">{voyages.length} voyage(s) au total — vue globale (sans accès aux documents)</p>
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
                        placeholder="Rechercher par destination..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : voyagesFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun voyage d'études trouvé</p>
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
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Destination</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date début</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date fin</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bénéficiaires</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Arrêté</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Créé le</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {voyagesFiltres.map(v => {
                                    const st = getStatut(v.statut_liste)
                                    const isSelected = selectedIds.includes(v.id)
                                    return (
                                        <tr key={v.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <td className="px-5 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(v.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-5 py-4 font-medium text-gray-800">
                                                {v.destination || '-'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {v.date_debut ? new Date(v.date_debut).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {v.date_fin ? new Date(v.date_fin).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} className="text-gray-400" />
                                                    {v.beneficiaires?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs">
                                                {v.arrete_recteur ? (
                                                    <span className="text-green-600 font-semibold">Signé</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                           <td className="px-5 py-4 text-gray-500 text-xs">
    {formatDateHeure(v.created_at)}
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