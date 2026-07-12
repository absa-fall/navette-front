import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Bus, CheckCircle, Clock, MapPin, RefreshCw, AlertCircle, XCircle, ArrowRight, ArrowLeft, ArrowLeftRight, Trash2, RotateCcw } from 'lucide-react'

const typeTrajetLabel = {
    aller: { label: 'Aller', icon: ArrowRight },
    retour: { label: 'Retour', icon: ArrowLeft },
    aller_retour: { label: 'Aller-Retour', icon: ArrowLeftRight },
}

export default function ChauffeurReservations() {
    const { user } = useAuth()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')
    const [onglet, setOnglet] = useState('attente')
    const [selected, setSelected] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Modal refus chauffeur (pour refuser une demande)
    const [modalRefus, setModalRefus] = useState(null)
    const [motifRefus, setMotifRefus] = useState('')
    const [motifError, setMotifError] = useState('')

    // ✅ NOUVEAU : Modal annulation chauffeur (annuler une résa confirmée)
    const [modalAnnulation, setModalAnnulation] = useState(null)
    const [motifAnnulation, setMotifAnnulation] = useState('')
    const [motifAnnulationError, setMotifAnnulationError] = useState('')

    // ✅ NOUVEAU : Modal réactivation (réactiver une résa annulée)
    const [modalReactivation, setModalReactivation] = useState(null)
    const [motifReactivation, setMotifReactivation] = useState('')
    const [motifReactivationError, setMotifReactivationError] = useState('')

    useEffect(() => { fetchReservations() }, [])
    useEffect(() => { setSelected([]) }, [onglet])

    const fetchReservations = async () => {
        setLoading(true)
        try {
            const response = await api.get('/reservations/chauffeur')
            setReservations(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const showMsg = (msg, type) => {
        setMessage(msg)
        setMessageType(type)
        setTimeout(() => setMessage(''), 4000)
    }

    const confirmer = async (id) => {
        setActionLoading(id + '_confirmer')
        try {
            await api.patch(`/reservations/${id}/confirmer`)
            showMsg('Réservation confirmée ! Le passager a été notifié.', 'success')
            fetchReservations()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', 'error')
        } finally {
            setActionLoading(null)
        }
    }

    // Modal refus (pour en_attente_confirmation)
    const ouvrirModalRefus = (id) => {
        setModalRefus(id)
        setMotifRefus('')
        setMotifError('')
    }
    const fermerModalRefus = () => {
        setModalRefus(null)
        setMotifRefus('')
        setMotifError('')
    }
    const confirmerRefus = async () => {
        if (!motifRefus.trim()) { setMotifError('Veuillez saisir un motif.'); return }
        setActionLoading(modalRefus + '_refuser')
        try {
            await api.patch(`/reservations/${modalRefus}/refuser`, { motif: motifRefus.trim() })
            showMsg('Réservation refusée. Le passager a été notifié.', 'info')
            fermerModalRefus()
            fetchReservations()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', 'error')
        } finally {
            setActionLoading(null)
        }
    }

    // ✅ NOUVEAU : Modal annulation chauffeur (pour confirmee)
    const ouvrirModalAnnulation = (id) => {
        setModalAnnulation(id)
        setMotifAnnulation('')
        setMotifAnnulationError('')
    }
    const fermerModalAnnulation = () => {
        setModalAnnulation(null)
        setMotifAnnulation('')
        setMotifAnnulationError('')
    }
    const confirmerAnnulation = async () => {
        if (!motifAnnulation.trim()) { setMotifAnnulationError('Veuillez saisir un motif.'); return }
        setActionLoading(modalAnnulation + '_annuler')
        try {
            await api.post(`/reservations/${modalAnnulation}/annuler-chauffeur`, { motif: motifAnnulation.trim() })
            showMsg('Réservation annulée. Le passager a été notifié.', 'info')
            fermerModalAnnulation()
            fetchReservations()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', 'error')
        } finally {
            setActionLoading(null)
        }
    }

    // ✅ NOUVEAU : Modal réactivation (pour annulee)
    const ouvrirModalReactivation = (id) => {
        setModalReactivation(id)
        setMotifReactivation('')
        setMotifReactivationError('')
    }
    const fermerModalReactivation = () => {
        setModalReactivation(null)
        setMotifReactivation('')
        setMotifReactivationError('')
    }
    const confirmerReactivation = async () => {
        if (!motifReactivation.trim()) { setMotifReactivationError('Veuillez saisir un motif.'); return }
        setActionLoading(modalReactivation + '_reactiver')
        try {
            await api.post(`/reservations/${modalReactivation}/reactiver`, { motif: motifReactivation.trim() })
            showMsg('Réservation réactivée ! Le passager a été notifié.', 'success')
            fermerModalReactivation()
            fetchReservations()
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', 'error')
        } finally {
            setActionLoading(null)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
    const toggleSelectAll = (liste) => {
        const ids = liste.map(r => r.id)
        const toutSelectionne = ids.every(id => selected.includes(id))
        if (toutSelectionne) setSelected(prev => prev.filter(id => !ids.includes(id)))
        else setSelected(prev => [...new Set([...prev, ...ids])])
    }
    const supprimerSelection = async (liste) => {
        const ids = selected.filter(id => liste.some(r => r.id === id))
        if (ids.length === 0) return
        if (!confirm(`Supprimer ${ids.length} réservation(s) ?`)) return
        setDeleteLoading(true)
        try {
            for (const id of ids) { await api.delete(`/reservations/${id}`) }
            setSelected([])
            showMsg(`${ids.length} réservation(s) supprimée(s)`, 'success')
            fetchReservations()
        } catch {
            showMsg('Erreur lors de la suppression', 'error')
        } finally {
            setDeleteLoading(false)
        }
    }

    const enAttente  = reservations.filter(r => r.statut === 'en_attente_confirmation')
    const confirmees = reservations.filter(r => r.statut === 'confirmee')
    const enCours    = reservations.filter(r => r.statut === 'en_cours')
    const terminees  = reservations.filter(r => r.statut === 'terminee')
    const annulees   = reservations.filter(r => r.statut === 'annulee')

    const listeActive = onglet === 'attente'    ? enAttente
                      : onglet === 'confirmees' ? confirmees
                      : onglet === 'encours'    ? enCours
                      : onglet === 'terminees'  ? terminees
                      : annulees

    const selectedDansListe = selected.filter(id => listeActive.some(r => r.id === id))
    const toutSelectionne   = listeActive.length > 0 && listeActive.every(r => selected.includes(r.id))

    const getStatutBadge = (statut) => {
        switch (statut) {
            case 'en_attente_confirmation': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">En attente</span>
            case 'confirmee':               return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Confirmée</span>
            case 'en_cours':                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">En cours</span>
            case 'terminee':                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Terminée</span>
            case 'annulee':                 return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Annulée</span>
            default: return null
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
    <h1 className="text-2xl font-bold text-gray-800">Réservations passagers</h1>
    <p className="text-gray-500 text-sm mt-1">{enAttente.length} en attente · {annulees.length} annulée(s)</p>
</div>
                   <button onClick={fetchReservations}
    className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 bg-white border border-blue-200 shadow-sm px-4 py-2 rounded-xl transition">
    <RefreshCw size={14} /> Actualiser
</button>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-2 ${
                        messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700'
                        : messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                        {messageType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message}
                    </div>
                )}

              {/* Onglets */}
<div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
    {[
        { key: 'attente',    label: 'En attente',  count: enAttente.length },
        { key: 'confirmees', label: 'Confirmées',  count: confirmees.length },
        { key: 'encours',    label: 'En cours',    count: enCours.length },
        { key: 'terminees',  label: 'Terminées',   count: terminees.length },
        { key: 'annulees',   label: 'Annulées',    count: annulees.length },
    ].map(({ key, label, count }) => (
        <button key={key} onClick={() => setOnglet(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
    onglet === key ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
}`}>
                            {label} ({count})
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : listeActive.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Bus size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucune réservation dans cet onglet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Barre sélection */}
                        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={toutSelectionne}
                                    onChange={() => toggleSelectAll(listeActive)}
                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                {selectedDansListe.length > 0 ? `${selectedDansListe.length} sélectionné(s)` : 'Tout sélectionner'}
                            </label>
                            {selectedDansListe.length > 0 && (
                                <button onClick={() => supprimerSelection(listeActive)} disabled={deleteLoading}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                    {deleteLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                    Supprimer ({selectedDansListe.length})
                                </button>
                            )}
                        </div>

                        {/* Cartes */}
                        {listeActive.map(r => {
                            const typeTrajet = typeTrajetLabel[r.type_trajet] || typeTrajetLabel['aller']
                            const TrajetIcon = typeTrajet.icon
                            return (
                                <div key={r.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition ${
                                    selected.includes(r.id) ? 'border-red-300 bg-red-50' : 'border-gray-100'
                                }`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={selected.includes(r.id)}
                                                onChange={() => toggleSelect(r.id)}
                                                className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                            <div>
                                                <p className="font-bold text-gray-800">{r.prenom} {r.nom}</p>
                                                <p className="text-xs text-gray-500">{r.ufr} · {r.categorie} · {r.type_profil}</p>
                                            </div>
                                        </div>
                                        {getStatutBadge(r.statut)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin size={14} className="text-blue-500" />
                                            {r.ville_depart} → {r.ville_arrivee}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock size={14} className="text-blue-500" />
                                            {r.date_reservation ? new Date(r.date_reservation).toLocaleDateString('fr-FR') : '-'} à {r.heure_reservation}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                            <TrajetIcon size={12} />
                                            {typeTrajet.label}
                                        </span>
                                        {r.trajet_sens && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                r.trajet_sens === 'retour' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {r.trajet_sens === 'retour' ? '↩ Retour' : '→ Aller'}
                                            </span>
                                        )}
                                    </div>

                                  {/* Message annulée */}
{r.statut === 'annulee' && (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 mb-3">
        <XCircle size={14} className="inline mr-1" />
        {r.motif_annulation_chauffeur
            ? `Annulée par le chauffeur : ${r.motif_annulation_chauffeur}`
            : (
                <span>
                    <span className="font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs mr-2">
                        Annulée par le passager
                    </span>
                    {r.prenom} {r.nom} a annulé cette réservation.
                </span>
            )
        }
    </div>
)}
                                    {/* ✅ Boutons selon statut */}

                                    {/* En attente → Refuser / Confirmer */}
                                    {r.statut === 'en_attente_confirmation' && (
                                        <div className="flex gap-3">
                                            <button onClick={() => ouvrirModalRefus(r.id)}
                                                disabled={actionLoading === r.id + '_refuser'}
                                                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50">
                                                {actionLoading === r.id + '_refuser'
                                                    ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                    : <XCircle size={16} />}
                                                Refuser
                                            </button>
                                            <button onClick={() => confirmer(r.id)}
                                                disabled={actionLoading === r.id + '_confirmer'}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                                {actionLoading === r.id + '_confirmer'
                                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <CheckCircle size={16} />}
                                                Confirmer
                                            </button>
                                        </div>
                                    )}

                                    {/* ✅ Confirmée → Annuler par chauffeur */}
                                    {r.statut === 'confirmee' && (
                                        <button onClick={() => ouvrirModalAnnulation(r.id)}
                                            disabled={actionLoading === r.id + '_annuler'}
                                            className="w-full flex items-center justify-center gap-2 border border-orange-300 text-orange-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-50 transition disabled:opacity-50">
                                            {actionLoading === r.id + '_annuler'
                                                ? <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                                : <XCircle size={16} />}
                                            Annuler cette réservation
                                        </button>
                                    )}

                                    {/* ✅ Annulée → Réactiver par chauffeur */}
                                    {r.statut === 'annulee' && (
                                        <button onClick={() => ouvrirModalReactivation(r.id)}
                                            disabled={actionLoading === r.id + '_reactiver'}
                                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                            {actionLoading === r.id + '_reactiver'
                                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <RotateCcw size={16} />}
                                            Réactiver la réservation
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal refus (en_attente) */}
            {modalRefus && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Refuser la réservation</h3>
                                <p className="text-xs text-gray-500">Le passager recevra une notification avec le motif</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Motif <span className="text-red-500">*</span></label>
                            <textarea value={motifRefus} onChange={(e) => { setMotifRefus(e.target.value); setMotifError('') }}
                                placeholder="Ex : Bus complet, trajet annulé..."
                                rows={3} className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none ${motifError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                            {motifError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {motifError}</p>}
                        </div>
                        <div className="mb-5">
                            <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
                            <div className="flex flex-wrap gap-2">
                                {['Bus complet', 'Trajet annulé', 'Heure incorrecte', 'Doublon'].map(s => (
                                    <button key={s} type="button" onClick={() => { setMotifRefus(s); setMotifError('') }}
                                        className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition">{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={fermerModalRefus} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">Annuler</button>
                            <button onClick={confirmerRefus} disabled={actionLoading === modalRefus + '_refuser'}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
                                {actionLoading === modalRefus + '_refuser' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle size={16} />}
                                Confirmer le refus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NOUVEAU : Modal annulation chauffeur (confirmee) */}
            {modalAnnulation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <XCircle size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Annuler la réservation</h3>
                                <p className="text-xs text-gray-500">Le passager sera notifié avec le motif</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Motif <span className="text-red-500">*</span></label>
                            <textarea value={motifAnnulation} onChange={(e) => { setMotifAnnulation(e.target.value); setMotifAnnulationError('') }}
                                placeholder="Ex : Place libérée, changement de programme..."
                                rows={3} className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none ${motifAnnulationError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                            {motifAnnulationError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {motifAnnulationError}</p>}
                        </div>
                        <div className="mb-5">
                            <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
                            <div className="flex flex-wrap gap-2">
                                {['Bus complet', 'Changement de programme', 'Problème technique', 'Place annulée'].map(s => (
                                    <button key={s} type="button" onClick={() => { setMotifAnnulation(s); setMotifAnnulationError('') }}
                                        className="text-xs bg-gray-100 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition">{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={fermerModalAnnulation} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">Fermer</button>
                            <button onClick={confirmerAnnulation} disabled={actionLoading === modalAnnulation + '_annuler'}
                                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
                                {actionLoading === modalAnnulation + '_annuler' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle size={16} />}
                                Confirmer l'annulation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NOUVEAU : Modal réactivation (annulee) */}
            {modalReactivation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <RotateCcw size={20} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Réactiver la réservation</h3>
                                <p className="text-xs text-gray-500">La réservation repassera en "confirmée" et le passager sera notifié</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Motif <span className="text-red-500">*</span></label>
                            <textarea value={motifReactivation} onChange={(e) => { setMotifReactivation(e.target.value); setMotifReactivationError('') }}
                                placeholder="Ex : Place disponible suite à une annulation..."
                                rows={3} className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${motifReactivationError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                            {motifReactivationError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {motifReactivationError}</p>}
                        </div>
                        <div className="mb-5">
                            <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
                            <div className="flex flex-wrap gap-2">
                                {['Place disponible', 'Suite à une annulation', 'Place libérée'].map(s => (
                                    <button key={s} type="button" onClick={() => { setMotifReactivation(s); setMotifReactivationError('') }}
                                        className="text-xs bg-gray-100 hover:bg-green-50 hover:text-green-600 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition">{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={fermerModalReactivation} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">Fermer</button>
                            <button onClick={confirmerReactivation} disabled={actionLoading === modalReactivation + '_reactiver'}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
                                {actionLoading === modalReactivation + '_reactiver' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={16} />}
                                Réactiver
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}