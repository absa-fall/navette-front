import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Bus, PenLine, CheckCircle, Send, FileText, Clock, XCircle, History, Truck, Trash2 } from 'lucide-react'

const statutConfig = {
    en_attente_drh: { label: 'En attente DRH', color: 'bg-orange-100 text-orange-700', icon: Clock },
    approuve_drh: { label: 'Approuvé DRH', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    transmis_chauffeur: { label: 'Transmis chauffeur', color: 'bg-yellow-100 text-yellow-700', icon: Truck },
    execute: { label: 'Exécuté', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
    autres: 'Autres',
}

export default function SGDRHOrdres() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const statutFiltre = searchParams.get('statut')

    const [ordres, setOrdres] = useState([])
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [signerModal, setSignerModal] = useState(null)
    const [successMsg, setSuccessMsg] = useState('')
    const [onglet, setOnglet] = useState('attente')
    const [selected, setSelected] = useState([])
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)

    useEffect(() => {
        chargerOrdres()
    }, [])

    useEffect(() => {
        if (statutFiltre === 'a_signer') {
            setOnglet('attente')
        } else if (statutFiltre === 'signes' || statutFiltre === 'transmis') {
            setOnglet('historique')
        }
    }, [statutFiltre])

    useEffect(() => {
        setSelected([])
    }, [onglet])

    const chargerOrdres = () => {
        api.get('/ordres-mission')
            .then(res => {
                const tous = res.data
                setOrdres(tous.filter(o => o.statut === 'approuve_drh'))
                setHistorique(tous.filter(o => o.statut !== 'approuve_drh'))
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const historiqueFiltre = () => {
        if (!statutFiltre || statutFiltre === 'a_signer') return historique
        if (statutFiltre === 'signes') return historique.filter(o => o.statut === 'transmis_chauffeur' || o.statut === 'execute')
        if (statutFiltre === 'transmis') return historique.filter(o => o.statut === 'transmis_chauffeur')
        return historique
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        const ids = historiqueFiltre().map(o => o.id)
        if (ids.every(id => selected.includes(id))) {
            setSelected([])
        } else {
            setSelected(ids)
        }
    }

   const supprimerSelection = async () => {
    if (selected.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer ${selected.length} ordre(s) de l'historique ?`)) return
    setDeleteSelectionLoading(true)
    try {
        await Promise.all(selected.map(id => api.delete(`/ordres-mission/${id}/historique`)))
        setSelected([])
        chargerOrdres() // recharge depuis le backend
    } catch (err) {
        alert('Erreur lors de la suppression.')
    } finally {
        setDeleteSelectionLoading(false)
    }
}

const supprimerHistorique = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet ordre de l'historique ?")) return
    setDeleteLoading(id)
    try {
        await api.delete(`/ordres-mission/${id}/historique`)
        chargerOrdres() // recharge depuis le backend
    } catch (err) {
        alert(err.response?.data?.message || 'Erreur')
    } finally {
        setDeleteLoading(null)
    }
}
const signer = async (id) => {
    setActionLoading(id)
    try {
        const ordre = ordres.find(o => o.id === id)
        await api.patch(`/ordres-mission/${id}/signer`, {
            chauffeur_id: ordre?.chauffeur_id
        })
        setSignerModal(null)
        chargerOrdres()
        setSuccessMsg(`Ordre signé et transmis au chauffeur ${ordre?.chauffeur_prenom} ${ordre?.chauffeur_nom}.`)
        setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
        alert(err.response?.data?.message || 'Erreur')
    } finally {
        setActionLoading(null)
    }
}

    const toutSelectionne = historiqueFiltre().length > 0 && historiqueFiltre().every(o => selected.includes(o.id))
const aUneSignatureLocale = (ordreId) => {
    const saved = localStorage.getItem(`signature_sg_drh_${ordreId}`)
    return !!(saved && saved.startsWith('data:image'))
}
    const renderOrdre = (ordre, avecAction = true) => {
    const statut = statutConfig[ordre.statut] || statutConfig['approuve_drh']
    const Icon = statut.icon
    return (
        <div key={ordre.id} className={`bg-white rounded-2xl p-5 border shadow-sm ${!avecAction && selected.includes(ordre.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    {!avecAction && (
                        <input
                            type="checkbox"
                            checked={selected.includes(ordre.id)}
                            onChange={() => toggleSelect(ordre.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 mt-1"
                        />
                    )}
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <Bus size={20} className="text-blue-700" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">
                            {ordre.destination || trajetLabels[ordre.trajet] || ordre.trajet}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Départ : {new Date(ordre.date_depart).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Chauffeur : {ordre.chauffeur_prenom} {ordre.chauffeur_nom}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Demandé par : {ordre.ddl?.prenom} {ordre.ddl?.nom}
                        </p>
                    </div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                    <Icon size={12} />
                    {statut.label}
                </span>
            </div>

            <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-xl p-3">{ordre.motif}</p>

            <div className="flex gap-3">
                <button
                    onClick={() => navigate(`/ordres-mission/${ordre.id}/document`)}
                    className="flex items-center gap-2 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition"
                >
                    <FileText size={15} />
                    Aperçu
                </button>
                {avecAction ? (
                    aUneSignatureLocale(ordre.id) ? (
                        <button
                            onClick={() => signer(ordre.id)}
                            disabled={actionLoading === ordre.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                        >
                            {actionLoading === ordre.id
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Send size={16} />
                            }
                            Transmettre au chauffeur
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate(`/ordres-mission/${ordre.id}/document`)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                        >
                            <PenLine size={16} />
                            Signer l'ordre
                        </button>
                    )
                ) : (
                    <button
                        onClick={() => supprimerHistorique(ordre.id)}
                        disabled={deleteLoading === ordre.id}
                        className="flex items-center gap-1.5 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
                    >
                        {deleteLoading === ordre.id
                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={15} />
                        }
                        Supprimer
                    </button>
                )}
            </div>
        </div>
    )
}
   

    const getTitre = () => {
        if (statutFiltre === 'a_signer') return 'Ordres à signer'
        if (statutFiltre === 'signes') return 'Ordres signés ce mois'
        if (statutFiltre === 'transmis') return 'Ordres transmis au chauffeur'
        return 'Ordres de mission'
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{getTitre()}</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {onglet === 'attente'
                            ? `${ordres.length} ordre(s) à signer`
                            : `${historiqueFiltre().length} ordre(s) dans l'historique`
                        }
                    </p>
                </div>

                {successMsg && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                        <p className="text-sm font-medium">{successMsg}</p>
                    </div>
                )}

                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setOnglet('attente')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'attente' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        A signer ({ordres.length})
                    </button>
                    <button
                        onClick={() => setOnglet('historique')}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${onglet === 'historique' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <History size={15} />
                        Historique ({historique.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : onglet === 'attente' ? (
                    ordres.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PenLine size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun ordre à signer</h3>
                            <p className="text-gray-400 text-sm">Tous les ordres ont été traités</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ordres.map(ordre => renderOrdre(ordre, true))}
                        </div>
                    )
                ) : (
                    historiqueFiltre().length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                            <p className="text-gray-400 text-sm">Aucun ordre traité pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={toutSelectionne}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-600 font-medium">
                                        {selected.length > 0
                                            ? `${selected.length} sélectionné(s)`
                                            : 'Tout sélectionner'
                                        }
                                    </span>
                                </div>
                                {selected.length > 0 && (
                                    <button
                                        onClick={supprimerSelection}
                                        disabled={deleteSelectionLoading}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                                    >
                                        {deleteSelectionLoading
                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <Trash2 size={14} />
                                        }
                                        Supprimer la sélection
                                    </button>
                                )}
                            </div>
                            {historiqueFiltre().map(ordre => renderOrdre(ordre, false))}
                        </div>
                    )
                )}
            </div>
        </Layout>
    )
}