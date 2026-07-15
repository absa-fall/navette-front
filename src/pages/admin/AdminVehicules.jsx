import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Bus, Search, Trash2 } from 'lucide-react'

const ETAT_LABELS = {
    disponible: { label: 'Disponible', color: 'bg-green-100 text-green-700' },
    en_service: { label: 'En service', color: 'bg-blue-100 text-blue-700' },
    en_panne:   { label: 'En panne',   color: 'bg-red-100 text-red-700' },
}

export default function AdminVehicules() {
    const [vehicules, setVehicules] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        api.get('/vehicules')
            .then(res => setVehicules(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const vehiculesFiltres = vehicules.filter(v => {
        const s = search.toLowerCase()
        return s === '' ||
            v.immatriculation?.toLowerCase().includes(s)
    })

    const getEtat = (etat) => ETAT_LABELS[etat] || { label: etat, color: 'bg-gray-100 text-gray-600' }

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === vehiculesFiltres.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(vehiculesFiltres.map(v => v.id))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        const confirmMsg = selectedIds.length === 1
            ? 'Voulez-vous vraiment supprimer ce véhicule ?'
            : `Voulez-vous vraiment supprimer ces ${selectedIds.length} véhicules ?`
        if (!window.confirm(confirmMsg)) return

        setDeleting(true)
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/vehicules/${id}`)))
            setVehicules(prev => prev.filter(v => !selectedIds.includes(v.id)))
            setSelectedIds([])
        } catch (err) {
            console.error(err)
            alert("Une erreur est survenue lors de la suppression.")
        } finally {
            setDeleting(false)
        }
    }

    const allSelected = vehiculesFiltres.length > 0 && selectedIds.length === vehiculesFiltres.length

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Véhicules</h1>
                        <p className="text-gray-500 text-sm mt-1">{vehicules.length} véhicule(s) au total — vue globale</p>
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
                        placeholder="Rechercher par immatriculation..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : vehiculesFiltres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Bus size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun véhicule trouvé</p>
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
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Immatriculation</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Capacité</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">État</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Contrôle technique</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {vehiculesFiltres.map(v => {
                                    const et = getEtat(v.etat)
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
                                                {v.immatriculation || '-'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {v.capacite ? `${v.capacite} places` : '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${et.color}`}>
                                                    {et.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {v.date_controle_technique ? new Date(v.date_controle_technique).toLocaleDateString('fr-FR') : '-'}
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