import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Users, Check, AlertCircle, ArrowLeft, Filter, Search, Plus, X, FileText } from 'lucide-react'

const UFRS = ['SATIC', 'SDD', 'ECOMIJ', 'ISFAR']

function ChevronDownIcon({ ouverte }) {
    return (
        <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-gray-400 transition-transform ${ouverte ? 'rotate-180' : ''}`}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}

export default function NouveauVoyageEtude() {
    const navigate = useNavigate()
    const [enseignants, setEnseignants]     = useState([])
    const [selected, setSelected]           = useState([])
    const [manuels, setManuels]             = useState([])
    const [showAddModal, setShowAddModal]   = useState(false)
    const [addForm, setAddForm]             = useState({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '' })
    const [loading, setLoading]             = useState(false)
    const [loadingEns, setLoadingEns]       = useState(true)
    const [error, setError]                 = useState('')
    const [success, setSuccess]             = useState(false)
    const [filtreUFR, setFiltreUFR]         = useState('tous')
    const [filtrePairing, setFiltrePairing] = useState('tous')
    const [searchEns, setSearchEns]         = useState('')
    const [ufrOuverte, setUfrOuverte]       = useState(null)
    const [form, setForm]                   = useState({
        date_publication: new Date().toISOString().split('T')[0],
        motif: 'Voyage d\'études',
    })

    const anneeActuelle = new Date().getFullYear()
    const pariteAnnee   = anneeActuelle % 2 === 0 ? 'paire' : 'impaire'

    useEffect(() => {
        api.get('/enseignants-permanents')
            .then(res => {
                const data = res.data
                setEnseignants(data)
                const eligibles = data.filter(e => {
                    if (!e.date_embauche) return false
                    const anneeEmbauche = new Date(e.date_embauche).getFullYear()
                    return anneeActuelle % 2 === 0
                        ? anneeEmbauche % 2 === 0
                        : anneeEmbauche % 2 !== 0
                })
                setSelected(eligibles.map(e => e.id))
            })
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
const exportPDF = () => {
    const enseignantsExport = tousEnseignants.filter(e => selected.includes(e.id))
    const annee = new Date().getFullYear()
    const contenu = `
        <html><head><style>
            body { font-family: Arial, sans-serif; padding: 30px; font-size: 13px; }
            h1 { color: #1d4ed8; font-size: 16px; }
            p { color: #6b7280; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1d4ed8; color: white; padding: 8px; text-align: left; font-size: 12px; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            tr:nth-child(even) { background: #f9fafb; }
            .footer { margin-top: 30px; font-size: 10px; color: #9ca3af; text-align: center; }
        </style></head><body>
        <h1>Liste des bénéficiaires — Voyage d'études ${annee}</h1>
        <p>Motif : ${form.motif} — Date : ${new Date(form.date_publication).toLocaleDateString('fr-FR')} — Total : ${enseignantsExport.length} bénéficiaire(s)</p>
        <table>
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>UFR</th>
                </tr>
            </thead>
            <tbody>
                ${enseignantsExport.map((e, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${e.prenom}</td>
                        <td>${e.nom}</td>
                        <td>${e.ufr || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="footer">UADB Mobilité — Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        <button onclick="window.print()" style="position:fixed;bottom:20px;right:20px;background:#1d4ed8;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">
            Imprimer / PDF
        </button>
        </body></html>
    `
    const win = window.open('', '_blank')
    win.document.write(contenu)
    win.document.close()
}
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

    if (success) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-green-100 p-5 rounded-full mb-4">
                        <Check size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Liste publiee !</h2>
                    <p className="text-gray-500">Les Chefs de Departement ont ete notifies.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="w-full space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vice-recteur/voyages-etudes')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Publier une liste de beneficiaires</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Année {anneeActuelle} — Enseignants années <span className="font-semibold">{pariteAnnee}s</span> pré-sélectionnés
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Layout 2 colonnes : formulaire à gauche (1/3), liste élargie à droite (2/3) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* COLONNE GAUCHE — Informations + actions */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                <h2 className="font-semibold text-gray-800">Informations</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de publication *</label>
                                    <input type="date" value={form.date_publication}
                                        onChange={e => setForm({ ...form, date_publication: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                                    <input type="text" value={form.motif}
                                        onChange={e => setForm({ ...form, motif: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                            </div>

                            {/* Récap sélection + actions, visible en permanence à gauche */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 sticky top-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Users size={18} className="text-blue-700" />
                                        Bénéficiaires
                                    </h2>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {selected.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {selected.length > 0 && (
                                        <button type="button" onClick={exportPDF}
                                            className="flex items-center justify-center gap-1.5 text-sm border border-red-200 text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition">
                                            <FileText size={14} /> Exporter PDF
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setShowAddModal(true)}
                                        className="flex items-center justify-center gap-1.5 text-sm border border-blue-200 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition">
                                        <Plus size={14} /> Ajouter manuellement
                                    </button>
                                </div>

                                {manuels.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-orange-600">Ajoutés manuellement :</p>
                                        {manuels.map(m => (
                                            <div key={m.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                                                <span className="text-xs text-gray-800">{m.prenom} {m.nom} — {m.ufr}</span>
                                                <button type="button" onClick={() => retirerManuel(m.id)}
                                                    className="text-xs text-red-500 hover:text-red-700">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-gray-100 space-y-3">
                                    <button type="button" onClick={() => navigate('/vice-recteur/voyages-etudes')}
                                        className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {loading ? 'Publication...' : `Publier (${selected.length})`}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* COLONNE DROITE — Liste enseignants élargie */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

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
        Aucun enseignant trouvé
    </div>
) : (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[36px_1.2fr_1.2fr_90px_90px_110px] gap-0 items-center px-4 py-2.5 bg-gray-100 border-b-2 border-gray-300 text-xs font-semibold text-gray-500 uppercase tracking-wide">
    <span></span>
    <span className="px-2 border-l-2 border-gray-300">Prénom</span>
    <span className="px-2 border-l-2 border-gray-300">Nom</span>
    <span className="px-2 border-l-2 border-gray-300">UFR</span>
    <span className="px-2 border-l-2 border-gray-300 text-center">Année</span>
    <span className="px-2 border-l-2 border-gray-300 text-center">Statut</span>
</div>

        <div className="divide-y divide-gray-100 max-h-[32rem] overflow-y-auto">
            {UFRS.filter(ufr => filtreUFR === 'tous' || filtreUFR === ufr).map(ufr => {
                const ensUFR = parUFR[ufr]
                if (ensUFR.length === 0) return null
                const nbSelectionnesUFR = ensUFR.filter(e => selected.includes(e.id)).length
                const estOuverte = ufrOuverte === null || ufrOuverte === ufr

                const parDept = ensUFR.reduce((acc, e) => {
                    const dept = e.departement || 'Sans département'
                    if (!acc[dept]) acc[dept] = []
                    acc[dept].push(e)
                    return acc
                }, {})

                return (
                    <div key={ufr} className="bg-white">
                        <button type="button"
                            onClick={() => setUfrOuverte(prev => prev === ufr ? '__closed__' : ufr)}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-blue-700">UFR {ufr}</span>
                                <span className="text-xs text-gray-400">{ensUFR.length} enseignant(s)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {nbSelectionnesUFR > 0 && (
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        {nbSelectionnesUFR} sélectionné(s)
                                    </span>
                                )}
                                <ChevronDownIcon ouverte={estOuverte} />
                            </div>
                        </button>

                        {estOuverte && (
                            <div className="divide-y divide-gray-300">
                                {Object.entries(parDept).map(([dept, ens]) => (
                                    <div key={dept}>
                                        <p className="text-xs font-semibold text-gray-400 px-4 pt-2 pb-1 uppercase tracking-wide">
                                            {dept}
                                        </p>
                                        {ens.map(e => {
                                            const annee      = getAnnee(e)
                                            const parite     = annee ? (annee % 2 === 0 ? 'paire' : 'impaire') : null
                                            const isSelected = selected.includes(e.id)
                                            const estEligible = annee && (
                                                anneeActuelle % 2 === 0
                                                    ? annee % 2 === 0
                                                    : annee % 2 !== 0
                                            )
                                            return (
<div key={e.id}
    onClick={() => toggleSelect(e.id)}
    className={`grid grid-cols-[36px_1.2fr_1.2fr_90px_90px_110px] gap-0 items-center px-4 py-2.5 cursor-pointer transition border-l-4 ${
        isSelected ? 'border-l-blue-600' : 'border-l-transparent'
    } ${
        annee && parite === 'paire' ? 'bg-sky-50 hover:bg-sky-100' : 'bg-white hover:bg-gray-50'
    }`}>
    <input type="checkbox"
        checked={isSelected}
        onChange={() => toggleSelect(e.id)}
        onClick={ev => ev.stopPropagation()}
        className="w-4 h-4 accent-blue-700" />

    <span className="text-sm text-gray-800 truncate px-2 border-l-2 border-gray-300">{e.prenom}</span>
    <span className="text-sm font-medium text-gray-800 truncate px-2 border-l-2 border-gray-300">{e.nom}</span>
    <span className="text-xs font-semibold text-blue-700 px-2 border-l-2 border-gray-300">{e.ufr || '-'}</span>

    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded text-center mx-2 border-l-2 border-gray-300 ${
        annee
            ? (parite === 'paire' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700')
            : 'text-gray-300'
    }`}>
        {annee || '—'}
    </span>

    <span className="px-2 border-l-2 border-gray-300 flex justify-center">
        {estEligible ? (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                Éligible
            </span>
        ) : (
            <span className="text-[11px] text-gray-300">—</span>
        )}
    </span>
</div>                                           )
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    </div>
)}
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal ajout manuel */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Ajouter manuellement</h3>
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