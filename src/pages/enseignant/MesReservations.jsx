import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import QRCode from 'react-qr-code'
import { Bus, ArrowLeft, Download, Clock, CheckCircle, XCircle, Trash2, AlertCircle, Search } from 'lucide-react'

export default function MesReservations() {
    const navigate = useNavigate()
    const [reservations, setReservations] = useState([])
    const [qrCodeUser, setQrCodeUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)
    const [annulerLoading, setAnnulerLoading] = useState(null)
    const [exportLoading, setExportLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const exporterPdf = async () => {
        setExportLoading(true)
        try {
            const res = await api.get('/mes-reservations/export-pdf', { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'mes-reservations.pdf')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            alert('Erreur lors du telechargement du PDF')
        } finally {
            setExportLoading(false)
        }
    }

    useEffect(() => { fetchReservations() }, [])

    const fetchReservations = () => {
        setLoading(true)
        api.get('/mes-reservations')
            .then(res => {
                setReservations(res.data.reservations)
                setQrCodeUser(res.data.qr_code_user)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const telechargerQR = (qrValue) => {
        const svg = document.getElementById(`qr-mes-${qrValue}`)
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        canvas.width = 256; canvas.height = 256
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 256, 256)
            ctx.drawImage(img, 0, 0, 256, 256)
            const a = document.createElement('a')
            a.href = canvas.toDataURL('image/png')
            a.download = `qr-navette-${qrValue}.png`
            a.click()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    // ✅ Supprimer une réservation
    const supprimerReservation = async (id) => {
        if (!confirm('Voulez-vous supprimer cette réservation ?')) return
        setDeleteLoading(id)
        try {
            await api.delete(`/mes-reservations/${id}`)
            setReservations(prev => prev.filter(r => r.id !== id))
            setSelected(prev => prev.filter(i => i !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression')
        } finally {
            setDeleteLoading(null)
        }
    }

    // ✅ Annuler une réservation confirmée
    const annulerReservation = async (id) => {
        if (!confirm('Confirmer l\'annulation ? Le chauffeur sera notifié.')) return
        setAnnulerLoading(id)
        try {
            await api.post(`/reservations/${id}/annuler`)
            setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: 'annulee' } : r))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'annulation')
        } finally {
            setAnnulerLoading(null)
        }
    }

    // ✅ Sélection
    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    // ✅ Supprimer la sélection
    const supprimerSelection = async () => {
        if (selected.length === 0) return
        if (!confirm(`Supprimer ${selected.length} réservation(s) ?`)) return
        setDeleteSelectionLoading(true)
        try {
            await Promise.all(selected.map(id => api.delete(`/mes-reservations/${id}`)))
            setReservations(prev => prev.filter(r => !selected.includes(r.id)))
            setSelected([])
        } catch {
            alert('Erreur lors de la suppression')
        } finally {
            setDeleteSelectionLoading(false)
        }
    }

    const statutBadge = (statut) => {
        switch (statut) {
            case 'confirmee':               return { label: 'Confirmée',   color: 'bg-green-100 text-green-700',   Icon: CheckCircle }
            case 'terminee':                return { label: 'Terminée',    color: 'bg-gray-100 text-gray-600',     Icon: CheckCircle }
            case 'refusee':                 return { label: 'Refusée',     color: 'bg-red-100 text-red-700',       Icon: XCircle }
            case 'annulee':                 return { label: 'Annulée',     color: 'bg-orange-100 text-orange-700', Icon: XCircle }
            case 'en_cours':                return { label: 'En cours',    color: 'bg-blue-100 text-blue-700',     Icon: Clock }
            case 'en_attente_confirmation': return { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700', Icon: Clock }
            default:                        return { label: statut,        color: 'bg-gray-100 text-gray-600',     Icon: Clock }
        }
    }

    // ✅ Libellé + couleur du type de réservation (aller / retour / aller_retour)
    const typeTrajetBadge = (typeTrajet) => {
        switch (typeTrajet) {
            case 'aller_retour': return { label: 'Aller-Retour', color: 'bg-indigo-100 text-indigo-700' }
            case 'retour':       return { label: 'Retour',       color: 'bg-orange-100 text-orange-700' }
            case 'aller':        return { label: 'Aller',        color: 'bg-blue-100 text-blue-700' }
            default:             return { label: typeTrajet || 'Aller', color: 'bg-gray-100 text-gray-600' }
        }
    }

    // ✅ Filtre de recherche : ville de depart, ville d'arrivee, ou statut
    // IMPORTANT : cette variable doit être déclarée AVANT toutSelectionne / toggleSelectAll
    // car ces deux-là en dépendent (sinon erreur "Cannot access before initialization" -> page blanche)
    const reservationsAffichees = reservations.filter(r =>
        searchQuery === '' ||
        r.ville_depart?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ville_arrivee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        statutBadge(r.statut).label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ✅ Tout sélectionner (dépend de reservationsAffichees)
    const toutSelectionne = reservationsAffichees.length > 0 && reservationsAffichees.every(r => selected.includes(r.id))

    const toggleSelectAll = () => {
        if (toutSelectionne) setSelected([])
        else setSelected(reservationsAffichees.map(r => r.id))
    }

    // ✅ Grouper par groupe_id pour afficher aller + retour ensemble
    const groupes = reservationsAffichees.reduce((acc, r) => {
        const key = r.groupe_id || `solo-${r.id}`
        if (!acc[key]) acc[key] = []
        acc[key].push(r)
        return acc
    }, {})

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Mes reservations</h1>
                            <p className="text-gray-500 text-sm mt-1">{reservationsAffichees.length} reservation(s)</p>
                        </div>
                    </div>
                    {reservations.length > 0 && (
                        <button onClick={exporterPdf} disabled={exportLoading}
                            className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-xl font-semibold transition disabled:opacity-50">
                            {exportLoading
                                ? <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                : <Download size={15} />}
                            PDF
                        </button>
                    )}
                </div>

                {/* Recherche */}
                {reservations.length > 0 && (
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par ville, statut..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* ✅ QR fixe du passager */}
                {qrCodeUser && reservations.some(r => ['confirmee', 'en_cours'].includes(r.statut)) && (
                    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 text-center">
                        <p className="text-sm font-semibold text-blue-800 mb-1">Mon QR code personnel</p>
                        <p className="text-xs text-gray-500 mb-4">Ce QR est unique et permanent. Le chauffeur le scanne à chaque trajet.</p>
                        <div className="flex justify-center mb-3">
                            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                <QRCode
                                    id={`qr-mes-${qrCodeUser}`}
                                    value={qrCodeUser}
                                    size={160}
                                    level="H"
                                    fgColor="#1e3a8a"
                                />
                            </div>
                        </div>
                        <p className="font-mono text-sm font-bold text-blue-700 tracking-widest mb-3">{qrCodeUser}</p>
                        <button onClick={() => telechargerQR(qrCodeUser)}
                            className="flex items-center gap-2 border border-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition text-sm mx-auto">
                            <Download size={14} /> Télécharger mon QR
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Bus size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucune réservation</h3>
                        <p className="text-gray-400 text-sm mb-5">Réservez votre première navette</p>
                        <button onClick={() => navigate('/enseignant/reserver')}
                            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
                            Réserver
                        </button>
                    </div>
                ) : reservationsAffichees.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Search size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun resultat</h3>
                        <p className="text-gray-400 text-sm">Aucune réservation ne correspond a votre recherche</p>
                    </div>
                ) : (
                    <>
                        {/* ✅ Barre sélection + suppression groupée */}
                        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={toutSelectionne} onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                Tout sélectionner ({reservationsAffichees.length})
                            </label>
                            {selected.length > 0 && (
                                <button onClick={supprimerSelection} disabled={deleteSelectionLoading}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                    {deleteSelectionLoading
                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 size={14} />}
                                    Supprimer ({selected.length})
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {Object.entries(groupes).map(([groupeKey, liste]) => {
                                const estGroupe = liste.length > 1

                                return (
                                    <div key={groupeKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                                        {/* En-tête groupe aller-retour */}
                                        {estGroupe && (
                                            <div className="bg-blue-50 border-b border-blue-100 px-5 py-2">
                                                <p className="text-xs font-bold text-blue-700 uppercase">Réservation Aller-Retour</p>
                                            </div>
                                        )}

                                        {liste.map((r, idx) => {
                                            const { label, color, Icon } = statutBadge(r.statut)
                                            const typeTrajet = typeTrajetBadge(r.type_trajet)
                                            const qrVisible = (r.statut === 'confirmee' || r.statut === 'terminee' || r.statut === 'en_cours') && qrCodeUser

                                            return (
                                                <div key={r.id} className={`p-5 ${idx > 0 ? 'border-t border-gray-100' : ''} ${
                                                    selected.includes(r.id) ? 'bg-red-50' : ''
                                                }`}>
                                                    {/* Infos trajet + checkbox + badges */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            {/* ✅ Checkbox sélection */}
                                                            <input type="checkbox"
                                                                checked={selected.includes(r.id)}
                                                                onChange={() => toggleSelect(r.id)}
                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 mt-1" />
                                                            <div>
                                                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                                                    {r.trajet_sens === 'retour'
                                                                        ? <span className="text-orange-500 text-xs font-bold">↩ RETOUR</span>
                                                                        : <span className="text-blue-500 text-xs font-bold">→ ALLER</span>}
                                                                    {r.ville_depart} → {r.ville_arrivee}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {new Date(r.date_reservation).toLocaleDateString('fr-FR')} à {r.heure_reservation}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* ✅ Badge type de reservation (aller / retour / aller-retour) */}
                                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeTrajet.color}`}>
                                                                {typeTrajet.label}
                                                            </span>
                                                            <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${color}`}>
                                                                <Icon size={12} /> {label}
                                                            </span>
                                                            {/* ✅ Bouton supprimer individuel */}
                                                            <button onClick={() => supprimerReservation(r.id)} disabled={deleteLoading === r.id}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                                {deleteLoading === r.id
                                                                    ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                                    : <Trash2 size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* QR visible si confirmée */}
                                                    {qrVisible && (
                                                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center text-xs text-green-700 mb-3">
                                                            <CheckCircle size={14} className="inline mr-1" />
                                                            Présentez votre QR code personnel (affiché en haut) au chauffeur.
                                                        </div>
                                                    )}

                                                    {/* Refusée : motif */}
                                                    {r.statut === 'refusee' && (
                                                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700 mb-3">
                                                            <p className="font-semibold">Réservation refusée</p>
                                                            {r.motif_refus && <p className="mt-1">Motif : {r.motif_refus}</p>}
                                                        </div>
                                                    )}

                                                    {/* En attente */}
                                                    {r.statut === 'en_attente_confirmation' && (
                                                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-700 flex items-center gap-2 mb-3">
                                                            <Clock size={14} />
                                                            En attente de confirmation du chauffeur.
                                                        </div>
                                                    )}

                                                    {/* Annulée */}
                                                    {r.statut === 'annulee' && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500 mb-3">
                                                            Réservation annulée.
                                                        </div>
                                                    )}

                                                    {/* Montant + ✅ Bouton annuler si confirmée */}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-xs text-gray-400">
                                                            Montant : <span className="font-semibold text-gray-600">{Number(r.montant_retenue).toLocaleString()} FCFA</span>
                                                        </p>

                                                        {/* ✅ Bouton annuler uniquement si confirmée */}
                                                        {r.statut === 'confirmee' && (
                                                            <button
                                                                onClick={() => annulerReservation(r.id)}
                                                                disabled={annulerLoading === r.id}
                                                                className="flex items-center gap-1 border border-red-300 text-red-600 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 transition text-xs disabled:opacity-50">
                                                                {annulerLoading === r.id
                                                                    ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                                    : <XCircle size={13} />}
                                                                Annuler
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}