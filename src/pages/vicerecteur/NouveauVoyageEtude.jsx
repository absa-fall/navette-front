import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Users, Check, AlertCircle, ArrowLeft, Filter, Download, FileText, Search, Pencil, Plus, X } from 'lucide-react'

const UFRS = ['SATIC', 'SDD', 'ECOMIJ', 'ISFAR']

export default function NouveauVoyageEtude() {
    const navigate = useNavigate()
    const [enseignants, setEnseignants]     = useState([])
    const [selected, setSelected]           = useState([])
    const [overrides, setOverrides]         = useState({}) // { id: { ufr, departement } }
    const [editingId, setEditingId]         = useState(null)
    const [editForm, setEditForm]           = useState({ ufr: '', departement: '' })
    const [showAddModal, setShowAddModal]   = useState(false)
    const [addForm, setAddForm]             = useState({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '' })
    const [loading, setLoading]             = useState(false)
    const [loadingEns, setLoadingEns]       = useState(true)
    const [error, setError]                 = useState('')
    const [success, setSuccess]             = useState(false)
    const [filtreUFR, setFiltreUFR]         = useState('tous')
    const [filtrePairing, setFiltrePairing] = useState('tous')
    const [searchEns, setSearchEns]         = useState('')
    const [form, setForm]                   = useState({
        destination: '', date_debut: '', date_fin: '', description: '',
    })

    // Enseignants manuels ajoutés (ids négatifs fictifs)
    const [manuels, setManuels] = useState([])

    useEffect(() => {
        api.get('/enseignants-permanents')
            .then(res => setEnseignants(res.data))
            .catch(() => {})
            .finally(() => setLoadingEns(false))
    }, [])

    const tousEnseignants = [...enseignants, ...manuels]

    const getAnnee = (e) => e.date_embauche ? new Date(e.date_embauche).getFullYear() : null

    const enseignantsFiltres = enseignants.filter(e => {
        const matchUFR     = filtreUFR === 'tous' || e.ufr === filtreUFR
        const annee        = getAnnee(e)
        const matchPairing = filtrePairing === 'tous'
            || (filtrePairing === 'paire'   && annee !== null && annee % 2 === 0)
            || (filtrePairing === 'impaire' && annee !== null && annee % 2 !== 0)
        const matchSearch  = searchEns === ''
            || (e.prenom + ' ' + e.nom + ' ' + e.ufr + ' ' + (e.departement || '')).toLowerCase().includes(searchEns.toLowerCase())
        return matchUFR && matchPairing && matchSearch
    })

    const parUFR = UFRS.reduce((acc, ufr) => {
        acc[ufr] = enseignantsFiltres.filter(e => e.ufr === ufr)
        return acc
    }, {})

    const toggleSelect = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

    const selecterTousFiltres = () => {
        const ids = enseignantsFiltres.map(e => e.id)
        const tousSelectionnes = ids.every(id => selected.includes(id))
        if (tousSelectionnes) setSelected(prev => prev.filter(id => !ids.includes(id)))
        else setSelected(prev => [...new Set([...prev, ...ids])])
    }

    // Ouvrir édition UFR/département dans le récap
    const ouvrirEdit = (ens) => {
        setEditingId(ens.id)
        setEditForm({
            ufr: overrides[ens.id]?.ufr || ens.ufr || '',
            departement: overrides[ens.id]?.departement || ens.departement || '',
        })
    }

    const sauvegarderEdit = () => {
        setOverrides(prev => ({ ...prev, [editingId]: editForm }))
        setEditingId(null)
    }

    // Ajouter manuellement un enseignant
    const ajouterManuel = () => {
        if (!addForm.prenom || !addForm.nom) return
        const fakeId = `manuel_${Date.now()}`
        const nouvel = { ...addForm, id: fakeId, date_embauche: null, _manuel: true }
        setManuels(prev => [...prev, nouvel])
        setSelected(prev => [...prev, fakeId])
        setAddForm({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '' })
        setShowAddModal(false)
    }

    const retirerManuel = (id) => {
        setManuels(prev => prev.filter(e => e.id !== id))
        setSelected(prev => prev.filter(i => i !== id))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (selected.length === 0) {
            setError('Veuillez selectionner au moins un beneficiaire')
            return
        }
        setLoading(true)
        setError('')
        try {
            // IDs réels uniquement (les manuels sont gérés séparément si besoin)
            const idsReels = selected.filter(id => typeof id === 'number')
            await api.post('/voyages-etudes', { ...form, enseignants: idsReels })
            setSuccess(true)
            setTimeout(() => navigate('/vice-recteur/voyages-etudes'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la publication')
        } finally {
            setLoading(false)
        }
    }

    const exportExcel = () => {
        const enseignantsExport = selected.map(id => {
            const ens = tousEnseignants.find(e => e.id === id)
            if (!ens) return null
            const ov = overrides[id] || {}
            return { ...ens, ufr: ov.ufr || ens.ufr, departement: ov.departement || ens.departement }
        }).filter(Boolean)
        const rows = [
            ['Prenom', 'Nom', 'UFR', 'Departement', 'Matricule', 'Date embauche'],
            ...enseignantsExport.map(e => [
                e.prenom, e.nom, e.ufr, e.departement || '', e.matricule || '',
                e.date_embauche ? new Date(e.date_embauche).getFullYear() : ''
            ])
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url
        a.download = `liste_beneficiaires.csv`
        a.click()
    }

    const exportPDF = () => {
        const enseignantsExport = selected.map(id => {
            const ens = tousEnseignants.find(e => e.id === id)
            if (!ens) return null
            const ov = overrides[id] || {}
            return { ...ens, ufr: ov.ufr || ens.ufr, departement: ov.departement || ens.departement }
        }).filter(Boolean)
        const contenu = `
            <html><head><style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1d4ed8; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #1d4ed8; color: white; padding: 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
                tr:nth-child(even) { background: #f9fafb; }
            </style></head><body>
            <h1>Liste des beneficiaires — Voyage d'etudes</h1>
            <p>Total : ${enseignantsExport.length}</p>
            <table>
                <thead><tr><th>Prenom</th><th>Nom</th><th>UFR</th><th>Departement</th><th>Matricule</th></tr></thead>
                <tbody>
                    ${enseignantsExport.map(e => `
                        <tr>
                            <td>${e.prenom}</td><td>${e.nom}</td><td>${e.ufr}</td>
                            <td>${e.departement || '-'}</td><td>${e.matricule || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </body></html>
        `
        const win = window.open('', '_blank')
        win.document.write(contenu)
        win.document.close()
        win.print()
    }

    if (success) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-green-100 p-5 rounded-full mb-4">
                        <Check size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Liste publiee !</h2>
                    <p className="text-gray-500">Les Chefs de Departement ont ete notifies par UFR.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Publier une liste de beneficiaires</h1>
                        <p className="text-gray-500 text-sm mt-1">Voyage d'etudes</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Informations voyage */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <MapPin size={18} className="text-blue-700" /> Informations du voyage
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                            <input type="text" value={form.destination}
                                onChange={e => setForm({ ...form, destination: e.target.value })}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Paris, France" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date debut *</label>
                                <input type="date" value={form.date_debut}
                                    onChange={e => setForm({ ...form, date_debut: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
                                <input type="date" value={form.date_fin}
                                    onChange={e => setForm({ ...form, date_fin: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Objectif du voyage..." />
                        </div>
                    </div>

                    {/* Sélection bénéficiaires */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Users size={18} className="text-blue-700" />
                                Selectionner les beneficiaires
                                {selected.length > 0 && (
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {selected.length} selectionne(s)
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2">
                                {selected.length > 0 && (
                                    <>
                                        <button type="button" onClick={exportPDF}
                                            className="flex items-center gap-1 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                                            <FileText size={12} /> PDF
                                        </button>
                                        <button type="button" onClick={exportExcel}
                                            className="flex items-center gap-1 text-xs border border-green-200 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
                                            <Download size={12} /> Excel
                                        </button>
                                    </>
                                )}
                                <button type="button" onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-1 text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                                    <Plus size={12} /> Ajouter manuellement
                                </button>
                            </div>
                        </div>

                        {/* Récap vertical avec édition */}
                        {selected.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                                    Bénéficiaires sélectionnés ({selected.length})
                                </p>
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {selected.map(id => {
                                        const ens = tousEnseignants.find(e => e.id === id)
                                        if (!ens) return null
                                        const ov = overrides[id] || {}
                                        const ufr  = ov.ufr  || ens.ufr  || ''
                                        const dept = ov.departement || ens.departement || ''
                                        const isManuel = ens._manuel

                                        return (
                                            <div key={id} className="bg-white border border-blue-100 rounded-lg px-3 py-2 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                            {ens.prenom?.[0]}{ens.nom?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">
                                                                {ens.prenom} {ens.nom}
                                                                {isManuel && <span className="ml-1 text-xs text-orange-500">(manuel)</span>}
                                                            </p>
                                                            <p className="text-xs text-gray-400">{ufr}{dept ? ` — ${dept}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button type="button"
                                                            onClick={() => editingId === id ? setEditingId(null) : ouvrirEdit(ens)}
                                                            className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition flex items-center gap-1">
                                                            <Pencil size={10} /> Modifier
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => isManuel ? retirerManuel(id) : toggleSelect(id)}
                                                            className="text-xs bg-red-50 border border-red-200 text-red-500 px-2 py-0.5 rounded-lg hover:bg-red-100 transition">
                                                            Retirer
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Formulaire édition inline */}
                                                {editingId === id && (
                                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                                                        <p className="text-xs font-semibold text-blue-700">Modifier UFR / Département</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-xs text-gray-500 mb-0.5 block">UFR</label>
                                                                <select value={editForm.ufr}
                                                                    onChange={e => setEditForm(f => ({ ...f, ufr: e.target.value }))}
                                                                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300">
                                                                    {UFRS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-500 mb-0.5 block">Département</label>
                                                                <input type="text" value={editForm.departement}
                                                                    onChange={e => setEditForm(f => ({ ...f, departement: e.target.value }))}
                                                                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                                    placeholder="Ex: Informatique" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <button type="button" onClick={() => setEditingId(null)}
                                                                className="text-xs text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                                                                Annuler
                                                            </button>
                                                            <button type="button" onClick={sauvegarderEdit}
                                                                className="text-xs bg-blue-700 text-white px-3 py-1 rounded-lg hover:bg-blue-800 transition">
                                                                Sauvegarder
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Filtres */}
                        <div className="flex gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-gray-400" />
                                <select value={filtreUFR} onChange={e => setFiltreUFR(e.target.value)}
                                    className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                                    <option value="tous">Toutes les UFR</option>
                                    {UFRS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                                {[
                                    { val: 'tous',    label: 'Toutes' },
                                    { val: 'paire',   label: 'Années paires' },
                                    { val: 'impaire', label: 'Années impaires' },
                                ].map(opt => (
                                    <button key={opt.val} type="button"
                                        onClick={() => setFiltrePairing(opt.val)}
                                        className={`px-3 py-1.5 transition ${
                                            filtrePairing === opt.val
                                                ? 'bg-blue-700 text-white font-semibold'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative flex-1 min-w-40">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={searchEns}
                                    onChange={e => setSearchEns(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                            </div>
                        </div>

                        {/* Bouton tout sélectionner */}
                        {enseignantsFiltres.length > 0 && (
                            <button type="button" onClick={selecterTousFiltres}
                                className="text-xs text-blue-700 hover:underline font-semibold">
                                {enseignantsFiltres.every(e => selected.includes(e.id))
                                    ? 'Tout désélectionner'
                                    : `Sélectionner tout (${enseignantsFiltres.length})`}
                            </button>
                        )}

                        {loadingEns ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : enseignantsFiltres.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Aucun enseignant trouvé avec ces filtres
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {UFRS.filter(ufr => filtreUFR === 'tous' || filtreUFR === ufr).map(ufr => {
                                    const ensUFR = parUFR[ufr]
                                    if (ensUFR.length === 0) return null
                                    const parDept = ensUFR.reduce((acc, e) => {
                                        const dept = e.departement || 'Sans département'
                                        if (!acc[dept]) acc[dept] = []
                                        acc[dept].push(e)
                                        return acc
                                    }, {})
                                    return (
                                        <div key={ufr}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">UFR {ufr}</span>
                                                <span className="text-xs text-gray-400">{ensUFR.length} enseignant(s)</span>
                                            </div>
                                            {Object.entries(parDept).map(([dept, ens]) => (
                                                <div key={dept} className="mb-3">
                                                    <p className="text-xs font-semibold text-gray-500 mb-1 pl-1">Département : {dept}</p>
                                                    <div className="space-y-1">
                                                        {ens.map(e => {
                                                            const annee  = getAnnee(e)
                                                            const parite = annee ? (annee % 2 === 0 ? 'paire' : 'impaire') : null
                                                            const isSelected = selected.includes(e.id)
                                                            return (
                                                                <div key={e.id}
                                                                    className={`flex items-center justify-between p-3 rounded-xl transition ${
                                                                        isSelected
                                                                            ? 'bg-blue-50 border border-blue-300'
                                                                            : 'bg-gray-50 border border-transparent hover:border-gray-200'
                                                                    }`}>
                                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSelect(e.id)}>
                                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                                            {e.prenom?.[0]}{e.nom?.[0]}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-800">{e.prenom} {e.nom}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {e.matricule || ''}
                                                                                {annee && (
                                                                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                                                                                        parite === 'paire' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                                                                                    }`}>
                                                                                        {annee} ({parite})
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isSelected ? (
                                                                            <button type="button" onClick={() => toggleSelect(e.id)}
                                                                                className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-100 transition">
                                                                                × Retirer
                                                                            </button>
                                                                        ) : (
                                                                            <button type="button" onClick={() => toggleSelect(e.id)}
                                                                                className="flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition">
                                                                                + Ajouter
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => navigate('/vice-recteur/voyages-etudes')}
                            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Publication...' : `Publier la liste (${selected.length} beneficiaire(s))`}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal ajout manuel */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Ajouter un enseignant manuellement</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Prénom *</label>
                                <input type="text" value={addForm.prenom}
                                    onChange={e => setAddForm(f => ({ ...f, prenom: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    placeholder="Prénom" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Nom *</label>
                                <input type="text" value={addForm.nom}
                                    onChange={e => setAddForm(f => ({ ...f, nom: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    placeholder="Nom" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">UFR</label>
                            <select value={addForm.ufr}
                                onChange={e => setAddForm(f => ({ ...f, ufr: e.target.value }))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                                {UFRS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Département</label>
                            <input type="text" value={addForm.departement}
                                onChange={e => setAddForm(f => ({ ...f, departement: e.target.value }))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Ex: Informatique" />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Matricule</label>
                            <input type="text" value={addForm.matricule}
                                onChange={e => setAddForm(f => ({ ...f, matricule: e.target.value }))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Ex: PER001" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowAddModal(false)}
                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                            <button type="button" onClick={ajouterManuel}
                                disabled={!addForm.prenom || !addForm.nom}
                                className="flex-1 bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}