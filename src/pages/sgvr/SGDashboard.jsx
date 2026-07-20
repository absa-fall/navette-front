import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import GraphiquesSGVR from '../../components/GraphiquesSGVR'
import api from '../../api/axios'
import { 
    MapPin, CreditCard, Calendar, Clock, 
    BadgeCheck, Search, Filter, ChevronDown, 
    ChevronUp, Bus, AlertCircle, Pencil, Trash2,
    FileSpreadsheet, FileText, X, Check, History
} from 'lucide-react'

const typeTrajetLabel = {
    aller: 'Aller',
    retour: 'Retour',
    aller_retour: 'Aller-Retour',
}

export default function SGDashboard() {
    const navigate = useNavigate()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterProfil, setFilterProfil] = useState('tous')
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
    const [editingId, setEditingId] = useState(null)
    const [editMontant, setEditMontant] = useState('')
   const [onglet, setOnglet] = useState('historique')
    const [selected, setSelected] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(false)
    const tableauRef = useRef(null)

    useEffect(() => { fetchReservations() }, [])
    useEffect(() => { setSelected([]) }, [onglet])

    const fetchReservations = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.get('/reservations/sgvr')
            if (response.data && Array.isArray(response.data)) {
                setReservations(response.data)
            } else {
                setReservations([])
            }
        } catch (err) {
            if (err.response?.status === 401) setError('Session expirée. Veuillez vous reconnecter.')
            else if (err.response?.status === 403) setError('Accès refusé.')
            else if (err.response?.status === 500) setError('Erreur serveur (500).')
            else setError('Impossible de contacter le serveur.')
        } finally {
            setLoading(false)
        }
    }

    const allerVers = (ongletCible) => {
        setOnglet(ongletCible)
        setTimeout(() => {
            tableauRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    const handleEditMontant = (r) => {
        setEditingId(r.id)
        setEditMontant(r.montant_retenue || '')
    }

    const handleSaveMontant = async (id) => {
        try {
            await api.patch(`/reservations/${id}/montant`, { montant_retenue: editMontant })
            setReservations(prev => prev.map(r => r.id === id ? { ...r, montant_retenue: editMontant } : r))
            setEditingId(null)
        } catch (err) {
            alert('Erreur lors de la modification du montant.')
        }
    }

    const handleDeleteMontant = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer ce montant ?')) return
        try {
            await api.patch(`/reservations/${id}/montant`, { montant_retenue: 0 })
            setReservations(prev => prev.map(r => r.id === id ? { ...r, montant_retenue: 0 } : r))
        } catch (err) {
            alert('Erreur lors de la suppression du montant.')
        }
    }

    // ✅ Regroupe les 2 réservations (aller + retour) en une seule "ligne"
    // d'affichage. On fusionne dès que 2 réservations appartiennent au même
    // usager, à la même navette, et ont un sens opposé (aller ↔ retour) —
    // que ce soit une réservation "aller_retour" groupée (avec groupe_id)
    // OU deux réservations simples faites séparément pour la même navette
    // (aucun groupe_id dans ce cas, mais même navette_id). Si le trajet lié
    // n'est pas présent dans la liste courante (ex : filtré par la
    // recherche, ou dans un autre onglet), on affiche la réservation seule
    // sans casser l'affichage.
    const regrouperAllerRetour = (liste) => {
        const dejaTraites = new Set()
        const resultat = []

        liste.forEach(r => {
            if (dejaTraites.has(r.id)) return

            const liee = liste.find(x =>
                x.id !== r.id &&
                !dejaTraites.has(x.id) &&
                x.user_id === r.user_id &&
                x.navette_id === r.navette_id &&
                x.trajet_sens !== r.trajet_sens
            )

            if (liee) {
                dejaTraites.add(r.id)
                dejaTraites.add(liee.id)
                resultat.push({ ...r, _liee: liee })
                return
            }

            dejaTraites.add(r.id)
            resultat.push(r)
        })

        return resultat
    }

    // Identifiants réels concernés par une ligne affichée (1 ou 2 réservations)
    const idsLigne = (ligne) => ligne._liee ? [ligne.id, ligne._liee.id] : [ligne.id]

    const toggleSelectLigne = (ligne) => {
        const ids = idsLigne(ligne)
        const tousSelectionnes = ids.every(id => selected.includes(id))
        setSelected(prev => tousSelectionnes
            ? prev.filter(id => !ids.includes(id))
            : [...new Set([...prev, ...ids])])
    }

    const toggleSelectAll = (liste) => {
        const lignes = regrouperAllerRetour(sortedList(liste))
        const ids = lignes.flatMap(idsLigne)
        if (ids.every(id => selected.includes(id))) {
            setSelected(prev => prev.filter(id => !ids.includes(id)))
        } else {
            setSelected(prev => [...new Set([...prev, ...ids])])
        }
    }

    const supprimerSelection = async (liste) => {
    const ids = selected.filter(id => liste.some(r => r.id === id))
    if (ids.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer ${ids.length} réservation(s) ? Cette action est définitive.`)) return
    setDeleteLoading(true)
    try {
        await Promise.all(ids.map(id => api.delete(`/reservations/${id}`)))
        setReservations(prev => prev.filter(r => !ids.includes(r.id)))
        setSelected([])
    } catch (err) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression.')
    } finally {
        setDeleteLoading(false)
    }
}

    const filteredReservations = (liste) => liste.filter(r => {
        const matchesSearch =
            (r.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.ville_depart || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.ville_arrivee || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesProfil = filterProfil === 'tous' || r.type_profil === filterProfil
        return matchesSearch && matchesProfil
    })

    const sortedList = (liste) => [...filteredReservations(liste)].sort((a, b) => {
        const aVal = a[sortConfig.key] || ''
        const bVal = b[sortConfig.key] || ''
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    // ✅ Un trajet est "non effectué" si le passager n'a jamais scanné sa
    // montée (validee_montee = false) et que la date prévue pour CE trajet
    // précis est dépassée. Deux cas, avec deux dates de référence différentes :
    //
    // Cas 1 — trajet retour d'une réservation aller-retour (l'aller a pu
    // être fait, seul le retour manque) : on compare à la vraie date de
    // retour de la navette (navette.date_retour), pas à date_reservation
    // (qui vaut la date de départ, identique pour les 2 legs — voir store()).
    //
    // Cas 2 — réservation simple, aller seul OU retour seul (le passager
    // n'a réservé qu'un seul sens) : on compare à date_reservation, la date
    // de la navette pour ce trajet précis.
    const estLegNonEffectuee = (r) => {
        if (['terminee', 'annulee', 'refusee'].includes(r.statut)) return false
        if (r.validee_montee) return false

        const aujourdHui = new Date()
        aujourdHui.setHours(0, 0, 0, 0)

        if (r.type_trajet === 'aller_retour' && r.trajet_sens === 'retour') {
            if (!r.navette?.date_retour) return false
            return new Date(r.navette.date_retour) < aujourdHui
        }

        if (r.type_trajet !== 'aller_retour') {
            if (!r.date_reservation) return false
            return new Date(r.date_reservation) < aujourdHui
        }

        return false
    }

    // Libellé du badge : "Retour non effectué" seulement pour le retour
    // d'un aller-retour, "Annulée" pour une réservation simple (aller seul
    // ou retour seul) dont la date est passée sans validation de montée.
    const labelLegNonEffectuee = (r) =>
        (r.type_trajet === 'aller_retour' && r.trajet_sens === 'retour')
            ? 'Retour non effectué'
            : 'Annulée'

    const sensLabel = (r) => r.trajet_sens === 'retour' ? 'Retour' : 'Aller'

    // Badge "nu" (sans mention du sens), utilisé dans les lignes fusionnées
    // où le sens est déjà indiqué par le libellé "Aller" / "Retour" à côté.
   const badgeStatutSimple = (r) => {
    if (estLegNonEffectuee(r)) {
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 inline-flex items-center gap-1 whitespace-nowrap">
                <AlertCircle size={11} />
                {labelLegNonEffectuee(r)}
            </span>
        )
    }
    if (r.statut === 'terminee') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">Terminée</span>
    if (r.statut === 'en_cours') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">En cours</span>
    if (r.statut === 'confirmee') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">Confirmée</span>
    if (r.statut === 'refusee') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">Refusée</span>
    if (r.statut === 'annulee') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">Annulée</span>
    if (r.statut === 'retour_non_effectue') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">Retour non effectué</span>
    if (r.statut === 'incident') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 inline-flex items-center gap-1 whitespace-nowrap"><AlertCircle size={11} />Incident</span>
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap">En attente</span>
}
    // Badge avec mention du sens entre parenthèses — comportement d'origine,
    // utilisé pour les réservations simples (aller seul ou retour seul).
  const badgeStatutAvecSens = (r) => {
    if (estLegNonEffectuee(r)) {
        return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit whitespace-nowrap">
                <AlertCircle size={12} />
                {labelLegNonEffectuee(r)}
            </span>
        )
    }
    if (r.statut === 'terminee') return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">Terminée ({sensLabel(r)})</span>
    if (r.statut === 'en_cours') return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">En cours ({sensLabel(r)})</span>
    if (r.statut === 'confirmee') return <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">Confirmée ({sensLabel(r)})</span>
    if (r.statut === 'refusee') return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">Refusée ({sensLabel(r)})</span>
    if (r.statut === 'annulee') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">Annulée ({sensLabel(r)})</span>
    if (r.statut === 'retour_non_effectue') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">Retour non effectué</span>
    if (r.statut === 'incident') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1 w-fit whitespace-nowrap"><AlertCircle size={12} />Incident ({sensLabel(r)})</span>
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap">En attente ({sensLabel(r)})</span>
}
    // ✅ Point d'entrée : ligne fusionnée (aller-retour) → statuts sur une seule ligne.
    // Ligne simple → comportement d'origine.
    const getStatutBadge = (ligne) => {
        if (ligne._liee) {
            const [legAller, legRetour] = ligne.trajet_sens === 'retour'
                ? [ligne._liee, ligne]
                : [ligne, ligne._liee]

            return (
                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Aller</span>
                    {badgeStatutSimple(legAller)}
                    <span className="text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Retour</span>
                    {badgeStatutSimple(legRetour)}
                </div>
            )
        }
        return badgeStatutAvecSens(ligne)
    }

    // ✅ Libellé texte du statut (sans JSX), réutilisé par les exports
    // Excel/PDF — même logique que les badges (estLegNonEffectuee /
    // labelLegNonEffectuee), pour que "Annulée" / "Retour non effectué"
    // apparaissent aussi dans les fichiers exportés, pas seulement à l'écran.
   const libelleStatutTexte = (r) => {
    if (estLegNonEffectuee(r)) return labelLegNonEffectuee(r)
    if (r.statut === 'terminee') return 'Terminée'
    if (r.statut === 'confirmee') return 'Confirmée'
    if (r.statut === 'en_cours') return 'En cours'
    if (r.statut === 'refusee') return 'Refusée'
    if (r.statut === 'annulee') return 'Annulée'
    if (r.statut === 'retour_non_effectue') return 'Retour non effectué'
    if (r.statut === 'incident') return 'Incident'
    return 'En attente'
}

    const getProfilBadge = (typeProfil) => {
        const colors = {
            'permanent': 'bg-purple-100 text-purple-700',
            'non_permanent': 'bg-orange-100 text-orange-700',
            'contractuel': 'bg-pink-100 text-pink-700',
            'vacataire': 'bg-teal-100 text-teal-700',
        }
        return colors[typeProfil] || 'bg-gray-100 text-gray-700'
    }

    // ✅ Type de trajet ajouté dans Excel (inchangé : une ligne par trajet)
    const exportExcel = (liste) => {
        const headers = ['Nom', 'Prénom', 'Catégorie', 'Profil', 'Départ', 'Arrivée', 'Type trajet', 'Date', 'Heure', 'Montant', 'Statut']
        const rows = sortedList(liste).map(r => [
            r.nom, r.prenom, r.categorie, r.type_profil,
            r.ville_depart, r.ville_arrivee,
            typeTrajetLabel[r.type_trajet] || r.type_trajet || '-',
            r.date_reservation ? new Date(r.date_reservation).toLocaleDateString('fr-FR') : '-',
            r.heure_reservation || '-',
            (parseFloat(r.montant_retenue) || 0) === 0 ? '—' : (parseFloat(r.montant_retenue) || 0) + ' FCFA',
            libelleStatutTexte(r)
        ])
        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reservations_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ✅ Type de trajet ajouté dans PDF (inchangé : une ligne par trajet)
    const exportPDF = (liste) => {
        const sorted = sortedList(liste)
        const total = sorted.reduce((sum, r) => sum + (parseFloat(r.montant_retenue) || 0), 0)
        const printContent = `
            <html><head><title>Réservations Navette</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; }
                h1 { color: #1d4ed8; font-size: 16px; margin-bottom: 5px; }
                p { color: #6b7280; margin-bottom: 15px; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #eff6ff; color: #1d4ed8; padding: 8px; text-align: left; font-size: 11px; border: 1px solid #dbeafe; }
                td { padding: 7px 8px; border: 1px solid #e5e7eb; font-size: 11px; }
                tr:nth-child(even) { background: #f9fafb; }
                .footer { margin-top: 15px; color: #9ca3af; font-size: 10px; text-align: right; }
            </style></head>
            <body>
                <h1>Réservations Navette — UADB Mobilité</h1>
                <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${sorted.length} réservation(s)</p>
                <table>
                    <thead><tr>
                        <th>Passager</th>
                        <th>Profil</th>
                        <th>Trajet</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Statut</th>
                    </tr></thead>
                    <tbody>
                        ${sorted.map(r => `
                            <tr>
                                <td>${r.prenom} ${r.nom}<br><small>${r.categorie}</small></td>
                                <td>${r.type_profil}</td>
                                <td>${r.ville_depart} → ${r.ville_arrivee}</td>
                                <td>${typeTrajetLabel[r.type_trajet] || r.type_trajet || '-'}</td>
                                <td>${r.date_reservation ? new Date(r.date_reservation).toLocaleDateString('fr-FR') : '-'}<br>${r.heure_reservation || '-'}</td>
                                <td>${(parseFloat(r.montant_retenue) || 0) === 0 ? '—' : (parseFloat(r.montant_retenue) || 0).toLocaleString() + ' FCFA'}</td>
                                <td>${libelleStatutTexte(r)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">Total retenues : ${total.toLocaleString()} FCFA</div>
            </body></html>`
        const win = window.open('', '_blank')
        win.document.write(printContent)
        win.document.close()
        win.print()
    }

   
const estStatutDefinitif = (s) => ['terminee', 'annulee', 'retour_non_effectue', 'refusee'].includes(s)

const statutEffectifLigne = (ligne) => {
    if (ligne._liee) {
        const legs = [ligne, ligne._liee]
        if (legs.some(l => l.statut === 'incident')) return 'en_cours'
        if (legs.every(l => estStatutDefinitif(l.statut))) return 'terminee'
        if (legs.some(l => ['confirmee', 'en_cours'].includes(l.statut))) return 'en_cours'
        return null
    }
    if (ligne.statut === 'incident') return 'en_cours'
    if (estStatutDefinitif(ligne.statut)) return 'terminee'
    if (['confirmee', 'en_cours'].includes(ligne.statut)) return 'en_cours'
    return null
}

    const lignesGroupees = regrouperAllerRetour(reservations)

    
    const enCours = lignesGroupees.filter(l => statutEffectifLigne(l) === 'en_cours')
    const retoursOublies = reservations.filter(estLegNonEffectuee)
    const terminées = lignesGroupees.filter(l => statutEffectifLigne(l) === 'terminee')
    const totalRetenues = reservations.reduce((sum, r) => sum + (parseFloat(r.montant_retenue) || 0), 0)
    const listeActive = onglet === 'encours' ? enCours : terminées
    const estHistorique = onglet === 'historique'

const renderTableau = (liste) => {
    const sorted = regrouperAllerRetour(sortedList(liste))
    const allIds = sorted.flatMap(idsLigne)
    const toutSelectionne = allIds.length > 0 && allIds.every(id => selected.includes(id))
    const selectedDansListe = selected.filter(id => liste.some(r => r.id === id))

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {selectedDansListe.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
                    <p className="text-sm text-red-700 font-medium">{selectedDansListe.length} sélectionné(s)</p>
                    <button onClick={() => supprimerSelection(liste)} disabled={deleteLoading}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                        {deleteLoading
                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={14} />}
                        Supprimer la sélection
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={toutSelectionne} onChange={() => toggleSelectAll(liste)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nom')}>
                                <div className="flex items-center gap-1">
                                    Passager {sortConfig.key === 'nom' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Profil</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trajet</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date_reservation')}>
                                <div className="flex items-center gap-1">
                                    Date & Heure {sortConfig.key === 'date_reservation' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Montant</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Aucune réservation</td>
                            </tr>
                        ) : (
                            sorted.map((ligne) => {
                                const ids = idsLigne(ligne)
                                const estSelectionnee = ids.some(id => selected.includes(id))
                                const estFusionnee = Boolean(ligne._liee)

                                // Pour l'affichage Trajet / Date, on privilégie toujours le trajet "aller"
                                const legAller = estFusionnee
                                    ? (ligne.trajet_sens === 'retour' ? ligne._liee : ligne)
                                    : ligne

                                const montantTotal = estFusionnee
                                    ? (parseFloat(ligne.montant_retenue) || 0) + (parseFloat(ligne._liee.montant_retenue) || 0)
                                    : (parseFloat(ligne.montant_retenue) || 0)

                                return (
                                    <tr key={ligne.id} className={`hover:bg-gray-50 transition ${estSelectionnee ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input type="checkbox" checked={ids.every(id => selected.includes(id))} onChange={() => toggleSelectLigne(ligne)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {(ligne.prenom || '').charAt(0)}{(ligne.nom || '').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{ligne.prenom} {ligne.nom}</p>
                                                    <p className="text-xs text-gray-500">{ligne.categorie}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProfilBadge(ligne.type_profil)}`}>
                                                {ligne.type_profil}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-sm text-gray-700">
                                                <MapPin size={14} className="text-blue-500" />
                                                {legAller.ville_depart} <span className="text-gray-400">→</span> {legAller.ville_arrivee}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {typeTrajetLabel[ligne.type_trajet] || ligne.type_trajet || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-700">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {legAller.date_reservation ? new Date(legAller.date_reservation).toLocaleDateString('fr-FR') : '-'}
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {legAller.heure_reservation || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {estFusionnee ? (
                                                <span className="text-blue-700 font-bold text-sm">
                                                    {montantTotal === 0 ? '—' : montantTotal.toLocaleString() + ' FCFA'}
                                                </span>
                                            ) : editingId === ligne.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input type="number" value={editMontant} onChange={(e) => setEditMontant(e.target.value)}
                                                        className="w-24 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                    <button onClick={() => handleSaveMontant(ligne.id)} className="text-green-600 hover:text-green-800"><Check size={16} /></button>
                                                    <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <span className="text-blue-700 font-bold text-sm">
                                                    {montantTotal === 0 ? '—' : montantTotal.toLocaleString() + ' FCFA'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{getStatutBadge(ligne)}</td>
                                        <td className="px-4 py-3">
                                            {estFusionnee ? (
                                                <span className="text-xs text-gray-300 italic">—</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditMontant(ligne)} className="text-blue-500 hover:text-blue-700 transition" title="Modifier le montant">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => handleDeleteMontant(ligne.id)} className="text-red-400 hover:text-red-600 transition" title="Mettre le montant à 0">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {liste.length > 0 && (
                <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-500">
                    {sorted.length} réservation(s) affichée(s) sur {liste.length} au total
                </div>
            )}
        </div>
    )
}
    return (
        <Layout>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
    <div>
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord SG VR</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion des réservations navette</p>
    </div>
</div>



{error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-red-700 font-medium text-sm">{error}</p>
                            <button onClick={fetchReservations} className="text-red-600 text-xs underline mt-1 hover:text-red-800">Réessayer</button>
                        </div>
                    </div>
                )}

                {!error && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div onClick={() => allerVers('encours')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-blue-100 p-2 rounded-xl"><Bus size={20} className="text-blue-700" /></div>
                                <span className="text-xs text-gray-400">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{reservations.length}</p>
                            <p className="text-sm text-gray-500 mt-1">Réservations</p>
                        </div>
                        <div onClick={() => allerVers('encours')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-yellow-100 p-2 rounded-xl"><Clock size={20} className="text-yellow-700" /></div>
                                <span className="text-xs text-gray-400">En cours</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{enCours.length}</p>
                            <p className="text-sm text-gray-500 mt-1">En cours</p>
                        </div>
                        <div onClick={() => allerVers('historique')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-green-100 p-2 rounded-xl"><BadgeCheck size={20} className="text-green-700" /></div>
                                <span className="text-xs text-gray-400">Terminées</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{terminées.length}</p>
                            <p className="text-sm text-gray-500 mt-1">Terminées</p>
                        </div>
                        <div onClick={() => navigate('/sg-vr/recapitulatifs')} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-purple-100 p-2 rounded-xl"><CreditCard size={20} className="text-purple-700" /></div>
                                <span className="text-xs text-gray-400">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{totalRetenues.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">FCFA retenues</p>
                        </div>
                        
                    </div>
                    
                )}
                <GraphiquesSGVR reservations={reservations} />

                {!error && (
    <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setOnglet('historique')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${onglet === 'historique' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <History size={15} />
            Historique ({terminées.length})
        </button>
        <button onClick={() => setOnglet('encours')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'encours' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            En cours ({enCours.length})
        </button>
    </div>
)}

                {!error && reservations.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Rechercher par nom, prénom ou trajet..."
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-gray-400" />
                                <select value={filterProfil} onChange={(e) => setFilterProfil(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="tous">Tous les profils</option>
                                    <option value="permanent">Permanent</option>
                                    <option value="non_permanent">Non permanent</option>
                                    <option value="contractuel">Contractuel</option>
                                    <option value="vacataire">Vacataire</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={tableauRef}>
                    {!error && !loading && renderTableau(listeActive)}
                </div>

                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </Layout>
    )
}