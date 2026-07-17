import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import SignaturePad from '../../components/SignaturePad'
import { Users, Check, AlertCircle, ArrowLeft, Filter, Search, Plus, X } from 'lucide-react'

const UFRS = ['SATIC', 'SDD', 'ECOMIJ', 'ISFAR']

function ChevronDownIcon({ ouverte }) {
    return (
        <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-slate-400 transition-transform ${ouverte ? 'rotate-180' : ''}`}
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
    const [editingId, setEditingId] = useState(null)
    const [addForm, setAddForm]             = useState({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '', date_embauche: '' })
    const [ajoutManuelLoading, setAjoutManuelLoading] = useState(false)
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

    // ===== Etape apercu + signature avant transmission =====
    const [step, setStep]                 = useState('form') // 'form' | 'apercu'
    const [voyageCree, setVoyageCree]     = useState(null)
    const [signature, setSignature]       = useState(null)
    const [transmitLoading, setTransmitLoading] = useState(false)

    const anneeActuelle = new Date().getFullYear()
    const pariteAnnee   = anneeActuelle % 2 === 0 ? 'paire' : 'impaire'
const estEligiblePourAnnee = (dateEmbauche, anneeRef) => {
    if (!dateEmbauche) return false
    const annee = new Date(dateEmbauche).getFullYear()
    const anciennete = anneeRef - annee
    return anciennete >= 2 && anciennete % 2 === 0
}
   useEffect(() => {
api.get('/enseignants-permanents')
    .then(res => {
        setEnseignants(res.data)
        const idsEligibles = res.data
            .filter(e => estEligiblePourAnnee(e.date_embauche, anneeActuelle))
            .map(e => e.id)
        setSelected(idsEligibles)
    })
    .catch(() => {})
    .finally(() => setLoadingEns(false))
}, [])

    const tousEnseignants = [...enseignants, ...manuels]

    const getAnnee = (e) => e.date_embauche ? new Date(e.date_embauche).getFullYear() : null

    const enseignantsFiltres = tousEnseignants.filter(e => {
        const matchUFR     = filtreUFR === 'tous' || e.ufr === filtreUFR
        const annee        = getAnnee(e)
        const matchPairing = filtrePairing === 'tous'
            || e._manuel
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
    const idsEligibles = enseignantsFiltres
        .filter(e => e._manuel || estEligiblePourAnnee(e.date_embauche, anneeActuelle))
        .map(e => e.id)
    const tousSelectionnes = idsEligibles.every(id => selected.includes(id))
    if (tousSelectionnes) setSelected(prev => prev.filter(id => !idsEligibles.includes(id)))
    else setSelected(prev => [...new Set([...prev, ...idsEligibles])])
}
  const ajouterManuel = async () => {
    if (!addForm.prenom || !addForm.nom || !addForm.date_embauche) return

    if (editingId) {
        setManuels(prev => prev.map(m => m.id === editingId ? { ...m, ...addForm } : m))
        setEditingId(null)
        setUfrOuverte(addForm.ufr)
        setFiltreUFR(prev => (prev !== 'tous' && prev !== addForm.ufr) ? 'tous' : prev)
        setAddForm({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '', date_embauche: '' })
        setShowAddModal(false)
        return
    }

    setAjoutManuelLoading(true)
    try {
        const res = await api.post('/enseignants-manuel', addForm)
        const nouvel = { ...res.data.enseignant, _manuel: true }
        setManuels(prev => [...prev, nouvel])
        setSelected(prev => [...prev, nouvel.id])
        setUfrOuverte(addForm.ufr)
        setFiltreUFR(prev => (prev !== 'tous' && prev !== addForm.ufr) ? 'tous' : prev)
        setAddForm({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '', date_embauche: '' })
        setShowAddModal(false)
    } catch (err) {
        alert(err.response?.data?.message || "Erreur lors de l'ajout de l'enseignant")
    } finally {
        setAjoutManuelLoading(false)
    }
}

const ouvrirModification = (m) => {
    setAddForm({ prenom: m.prenom, nom: m.nom, ufr: m.ufr, departement: m.departement, matricule: m.matricule, date_embauche: m.date_embauche || '' })
    setEditingId(m.id)
    setShowAddModal(true)
}

const fermerModal = () => {
    setShowAddModal(false)
    setEditingId(null)
    setAddForm({ prenom: '', nom: '', ufr: 'SATIC', departement: '', matricule: '', date_embauche: '' })
}

    const retirerManuel = (id) => {
        setManuels(prev => prev.filter(e => e.id !== id))
        setSelected(prev => prev.filter(i => i !== id))
    }
    const retirerDeLaSelection = (item) => {
    if (item._manuel) {
        retirerManuel(item.id)
    } else {
        toggleSelect(item.id)
    }
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
       const res = await api.post('/voyages-etudes', { ...form, enseignants: selected })
        const voyage = res.data?.voyage ?? res.data?.data ?? res.data

        if (!voyage || !voyage.id) {
            console.error('Réponse inattendue de /voyages-etudes:', res.data)
            setError("La liste a peut-être été créée mais la réponse du serveur est dans un format inattendu. Vérifiez la page d'historique.")
            return
        }

        setVoyageCree(voyage)
        setStep('apercu')
    } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la creation')
    } finally {
        setLoading(false)
    }
}

    useEffect(() => {
        if (step === 'apercu') {
            const saved = localStorage.getItem('signature_vice_recteur')
            if (saved && saved.startsWith('data:image')) setSignature(saved)
        }
    }, [step])

    const handleSignerEtTransmettre = async () => {
        if (!signature || !voyageCree) return
        setTransmitLoading(true)
        setError('')
        try {
           await api.patch(`/voyages-etudes/${voyageCree.id}/transmettre`, { signature })
            setSuccess(true)
            setTimeout(() => navigate('/vice-recteur/voyages-etudes'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmitLoading(false)
        }
    }

    if (success) {
    return (
        <Layout>
            <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-emerald-50 p-5 rounded-full mb-4">
                    <Check size={48} className="text-emerald-600" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-blue-950 mb-2">Liste publiée !</h2>
                <p className="text-slate-500">Les Chefs de Département et la Commission ont été notifiés.</p>
            </div>
        </Layout>
    )
}

    if (step === 'apercu' && voyageCree) {
        const beneficiairesApercu = tousEnseignants.filter(e => selected.includes(e.id))

        return (
            <Layout>
                <div className="w-full max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setStep('form')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-blue-950">Aperçu avant transmission</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Vérifiez la liste puis signez pour la transmettre aux Chefs de Département et à la Commission
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-8 py-8 font-serif text-slate-900">
                        <h2 className="text-lg font-bold text-blue-800 mb-1">
                            Liste des bénéficiaires — {form.motif}
                        </h2>
                        <p className="text-sm text-slate-600 mb-6">
                            Publiée le {new Date(form.date_publication).toLocaleDateString('fr-FR')} — Total : {beneficiairesApercu.length} bénéficiaire(s)
                        </p>

                        <table className="w-full border-collapse text-[13px] mb-10">
                            <thead>
                                <tr>
                                    <th className="border border-slate-800 px-3 py-1.5 text-left">N°</th>
                                    <th className="border border-slate-800 px-3 py-1.5 text-left">Prénom</th>
                                    <th className="border border-slate-800 px-3 py-1.5 text-left">Nom</th>
                                    <th className="border border-slate-800 px-3 py-1.5 text-left">UFR</th>
                                    <th className="border border-slate-800 px-3 py-1.5 text-left">Département</th>
                                </tr>
                            </thead>
                            <tbody>
                                {beneficiairesApercu.map((e, i) => (
                                    <tr key={e.id}>
                                        <td className="border border-slate-800 px-3 py-1.5">{i + 1}.</td>
                                        <td className="border border-slate-800 px-3 py-1.5">{e.prenom}</td>
                                        <td className="border border-slate-800 px-3 py-1.5 font-bold">{e.nom?.toUpperCase()}</td>
                                        <td className="border border-slate-800 px-3 py-1.5">{e.ufr || '-'}</td>
                                        <td className="border border-slate-800 px-3 py-1.5">{e.departement || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end">
                            <SignaturePad
                                storageKey="signature_vice_recteur"
                                label="Le Vice-Recteur"
                                onSaved={setSignature}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setStep('form')}
                            className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                            Retour au formulaire
                        </button>
                        <button type="button" onClick={handleSignerEtTransmettre}
                            disabled={!signature || transmitLoading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {transmitLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {!signature ? 'Signez pour continuer' : (transmitLoading ? 'Transmission...' : 'Signer et transmettre')}
                        </button>
                    </div>
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
                        className="p-2 hover:bg-slate-100 rounded-xl transition">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="font-serif text-2xl font-semibold text-blue-950">Publier une liste de beneficiaires</h1>
                       <p className="text-slate-500 text-sm mt-1">
    Année {anneeActuelle} — Sont éligibles les enseignants ayant au moins 2 ans d'ancienneté, à intervalle de 2 ans depuis leur embauche
</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* COLONNE GAUCHE — Informations + actions */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <h2 className="font-semibold text-blue-950">Informations</h2>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de publication *</label>
                                    <input type="date" value={form.date_publication}
                                        onChange={e => setForm({ ...form, date_publication: e.target.value })}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Motif *</label>
                                    <input type="text" value={form.motif}
                                        onChange={e => setForm({ ...form, motif: e.target.value })}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 sticky top-6">
                                <div className="flex items-center justify-between">
    <h2 className="font-semibold text-blue-950 flex items-center gap-2">
        <Users size={18} className="text-blue-700" />
        Bénéficiaires
    </h2>
    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
        {selected.length}
    </span>
</div>

                                <div className="flex flex-col gap-2">
                                    <button type="button" onClick={() => setShowAddModal(true)}
                                        className="flex items-center justify-center gap-1.5 text-sm border border-blue-200 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition">
                                        <Plus size={14} /> Ajouter manuellement
                                    </button>
                                </div>

                                <div className="pt-2 border-t border-slate-100 space-y-3">
                                    <button type="button" onClick={() => navigate('/vice-recteur/voyages-etudes')}
                                        className="w-full border border-slate-300 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {loading ? 'Creation...' : `Continuer vers l'apercu (${selected.length})`}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* COLONNE DROITE — Liste enseignants élargie */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">

                                {/* Filtres */}
                                <div className="flex gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Filter size={14} className="text-slate-400" />
                                        <select value={filtreUFR} onChange={e => setFiltreUFR(e.target.value)}
                                            className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                                            <option value="tous">Toutes les UFR</option>
                                            {UFRS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
                                        {[
                                            { val: 'tous',    label: 'Toutes' },
                                            { val: 'paire',   label: 'Années paires' },
                                            { val: 'impaire', label: 'Années impaires' },
                                        ].map(opt => (
                                            <button key={opt.val} type="button"
                                                onClick={() => setFiltrePairing(opt.val)}
                                                className={`px-3 py-1.5 transition ${
                                                    filtrePairing === opt.val
                                                        ? 'bg-blue-600 text-white font-semibold'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                }`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative flex-1 min-w-40">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" value={searchEns}
                                            onChange={e => setSearchEns(e.target.value)}
                                            placeholder="Rechercher..."
                                            className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                    </div>
                                </div>

                               {enseignantsFiltres.length > 0 && (() => {
    const eligiblesFiltres = enseignantsFiltres.filter(e => e._manuel || estEligiblePourAnnee(e.date_embauche, anneeActuelle))
    if (eligiblesFiltres.length === 0) return null
    return (
        <button type="button" onClick={selecterTousFiltres}
            className="text-xs text-blue-700 hover:underline font-semibold">
            {eligiblesFiltres.every(e => selected.includes(e.id))
                ? 'Tout désélectionner'
                : `Sélectionner les éligibles (${eligiblesFiltres.length})`}
        </button>
    )
})()}

                              {loadingEns ? (
    <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
) : enseignantsFiltres.length === 0 ? (
    <div className="text-center py-8 text-slate-400 text-sm">
        Aucun enseignant trouvé
    </div>
) : (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[36px_1.2fr_1.2fr_90px_90px_110px] gap-0 items-center px-4 py-2.5 bg-slate-100 border-b-2 border-slate-300 text-xs font-semibold text-slate-500 uppercase tracking-wide">
    <span></span>
    <span className="px-2 border-l-2 border-slate-300">Prénom</span>
    <span className="px-2 border-l-2 border-slate-300">Nom</span>
    <span className="px-2 border-l-2 border-slate-300">UFR</span>
    <span className="px-2 border-l-2 border-slate-300 text-center">Année</span>
    <span className="px-2 border-l-2 border-slate-300 text-center">Statut</span>
</div>

        <div className="divide-y divide-slate-100 max-h-[32rem] overflow-y-auto">
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
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-blue-700">UFR {ufr}</span>
                                <span className="text-xs text-slate-400">{ensUFR.length} enseignant(s)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {nbSelectionnesUFR > 0 && (
                                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                        {nbSelectionnesUFR} sélectionné(s)
                                    </span>
                                )}
                                <ChevronDownIcon ouverte={estOuverte} />
                            </div>
                        </button>

                        {estOuverte && (
                            <div className="divide-y divide-slate-300">
                                {Object.entries(parDept).map(([dept, ens]) => (
                                    <div key={dept}>
                                        <p className="text-xs font-semibold text-slate-400 px-4 pt-2 pb-1 uppercase tracking-wide">
                                            {dept}
                                        </p>
                                        {ens.map(e => {
                                            const annee      = getAnnee(e)
                                            const parite     = annee ? (annee % 2 === 0 ? 'paire' : 'impaire') : null
                                            const isSelected = selected.includes(e.id)
                                            const anciennete = annee ? anneeActuelle - annee : null
                                            const estEligible = anciennete !== null && anciennete >= 2 && anciennete % 2 === 0
                                            return (
<div key={e.id}
    onClick={() => toggleSelect(e.id)}
    className={`grid grid-cols-[36px_1.2fr_1.2fr_90px_90px_110px] gap-0 items-center px-4 py-2.5 cursor-pointer transition border-l-4 ${
        isSelected ? 'border-l-blue-600' : 'border-l-transparent'
    } ${
        annee && parite === 'paire' ? 'bg-blue-50/60 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'
    }`}>
    <input type="checkbox"
        checked={isSelected}
        onChange={() => toggleSelect(e.id)}
        onClick={ev => ev.stopPropagation()}
        className="w-4 h-4 accent-blue-600" />

    <span className="text-sm text-slate-800 truncate px-2 border-l-2 border-slate-300">{e.prenom}</span>
    <span className="text-sm font-medium text-slate-800 truncate px-2 border-l-2 border-slate-300">{e.nom}</span>
    <span className="text-xs font-semibold text-blue-700 px-2 border-l-2 border-slate-300">{e.ufr || '-'}</span>

    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded text-center mx-2 border-l-2 border-slate-300 ${
        annee
            ? (parite === 'paire' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700')
            : 'text-slate-300'
    }`}>
        {annee || '—'}
    </span>

    <span className="px-2 border-l-2 border-slate-300 flex justify-center items-center gap-2">
        {e._manuel ? (
            <>
                {estEligible ? (
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Éligible
                    </span>
                ) : (
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">
                        Dérogation
                    </span>
                )}
                <button type="button" onClick={(ev) => { ev.stopPropagation(); ouvrirModification(e) }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium">
                    Modifier
                </button>
                <button type="button" onClick={(ev) => { ev.stopPropagation(); retirerManuel(e.id) }}
                    className="text-rose-500 hover:text-rose-700">
                    <X size={12} />
                </button>
            </>
        ) :estEligible ? (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                Éligible
            </span>
        ) : isSelected ? (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">
                Dérogation
            </span>
        ) : (
            <span className="text-[11px] text-slate-300">—</span>
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
                           <h3 className="font-serif font-semibold text-blue-950">{editingId ? 'Modifier l\'enseignant' : 'Ajouter manuellement'}</h3>
<button onClick={fermerModal} className="text-slate-400 hover:text-slate-600">
    <X size={20} />
</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Prénom *</label>
                                <input type="text" value={addForm.prenom}
                                    onChange={e => setAddForm(f => ({ ...f, prenom: e.target.value }))}
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    placeholder="Prénom" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Nom *</label>
                                <input type="text" value={addForm.nom}
                                    onChange={e => setAddForm(f => ({ ...f, nom: e.target.value }))}
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    placeholder="Nom" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">UFR</label>
                            <select value={addForm.ufr}
                                onChange={e => setAddForm(f => ({ ...f, ufr: e.target.value }))}
                                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                                {UFRS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Département</label>
                            <input type="text" value={addForm.departement}
                                onChange={e => setAddForm(f => ({ ...f, departement: e.target.value }))}
                                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Ex: Informatique" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Matricule</label>
                            <input type="text" value={addForm.matricule}
                                onChange={e => setAddForm(f => ({ ...f, matricule: e.target.value }))}
                                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder="Ex: PER001" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Date d'embauche *</label>
                            <input type="date" value={addForm.date_embauche} required
                                onChange={e => setAddForm(f => ({ ...f, date_embauche: e.target.value }))}
                                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                            <p className="text-[11px] text-slate-400 mt-1">L'éligibilité sera calculée automatiquement à partir de cette date.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                           <button type="button" onClick={fermerModal}
    className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
    Annuler
</button>
<button type="button" onClick={ajouterManuel}
    disabled={!addForm.prenom || !addForm.nom || !addForm.date_embauche || ajoutManuelLoading}
    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
    {ajoutManuelLoading ? 'Ajout...' : (editingId ? 'Enregistrer' : 'Ajouter')}
</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}