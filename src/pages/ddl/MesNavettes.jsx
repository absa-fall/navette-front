import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Bus, Plus, Clock, CheckCircle, XCircle, PenLine, Truck, Trash2, FileText, History, AlertTriangle, Search } from 'lucide-react'
const statutConfig = {
    en_attente_drh: { label: 'En attente DRH', color: 'bg-orange-100 text-orange-700', icon: Clock },
    approuve_drh: { label: 'Approuvé DRH', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    signe_sg: { label: 'Signé SG', color: 'bg-purple-100 text-purple-700', icon: PenLine },
    transmis_chauffeur: { label: 'Transmis chauffeur', color: 'bg-yellow-100 text-yellow-700', icon: Truck },
    execute: { label: 'Exécuté', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
    incident: { label: 'Incident signalé', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
    autres: 'Autres',
}

export default function MesNavettes() {
    const navigate = useNavigate()
    const [enAttente, setEnAttente] = useState([])
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [onglet, setOnglet] = useState('attente')
    const [selected, setSelected] = useState([])
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)
    const [transmettreLoading, setTransmettreLoading] = useState(null)
    const [executeLoading, setExecuteLoading] = useState(null)
    const [searchNavettes, setSearchNavettes] = useState('')

    useEffect(() => {
        chargerOrdres()
    }, [])

    useEffect(() => {
        setSelected([])
    }, [onglet])

    const chargerOrdres = () => {
    api.get('/ordres-mission')
        .then(res => {
            const tous = res.data
            setEnAttente(tous.filter(o => o.statut === 'en_attente_drh' || o.statut === 'incident'))
            setHistorique(tous.filter(o => o.statut !== 'en_attente_drh' && o.statut !== 'incident'))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
}

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const filtrerOrdres = (liste) => liste.filter(o =>
        searchNavettes === '' ||
        o.destination?.toLowerCase().includes(searchNavettes.toLowerCase()) ||
        o.trajet_autre?.toLowerCase().includes(searchNavettes.toLowerCase()) ||
        trajetLabels[o.trajet]?.toLowerCase().includes(searchNavettes.toLowerCase()) ||
        o.chauffeur_prenom?.toLowerCase().includes(searchNavettes.toLowerCase()) ||
        o.chauffeur_nom?.toLowerCase().includes(searchNavettes.toLowerCase()) ||
        o.motif?.toLowerCase().includes(searchNavettes.toLowerCase())
    )

    const enAttenteFiltres = filtrerOrdres(enAttente)
    const historiqueFiltres = filtrerOrdres(historique)

    const toggleSelectAll = () => {
        const ids = historiqueFiltres.map(o => o.id)
        if (ids.every(id => selected.includes(id))) {
            setSelected([])
        } else {
            setSelected(ids)
        }
    }
const toggleSelectAllAttente = () => {
    const ids = enAttenteFiltres.map(o => o.id)
    if (ids.every(id => selected.includes(id))) {
        setSelected([])
    } else {
        setSelected(ids)
    }
}

const toutSelectionneAttente = enAttenteFiltres.length > 0 && enAttenteFiltres.every(o => selected.includes(o.id))
    const supprimerSelection = async () => {
        if (selected.length === 0) return
        if (!confirm(`Voulez-vous vraiment supprimer ${selected.length} ordre(s) de l'historique ?`)) return
        setDeleteSelectionLoading(true)
        try {
            await Promise.all(selected.map(id => api.delete(`/ordres-mission/${id}/historique`)))
            setHistorique(prev => prev.filter(o => !selected.includes(o.id)))
            setSelected([])
        } catch (err) {
            alert('Erreur lors de la suppression.')
        } finally {
            setDeleteSelectionLoading(false)
        }
    }
    const supprimerSelectionAttente = async () => {
    if (selected.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer ${selected.length} demande(s) ?`)) return
    setDeleteSelectionLoading(true)
    try {
        await Promise.all(selected.map(id => api.delete(`/ordres-mission/${id}`)))
        setEnAttente(prev => prev.filter(o => !selected.includes(o.id)))
        setSelected([])
    } catch (err) {
        alert('Une erreur est survenue. Certains ordres (ex: incident déjà traité) n\'ont peut-être pas pu être supprimés.')
        chargerOrdres() // resynchronise avec le serveur en cas d'échec partiel
    } finally {
        setDeleteSelectionLoading(false)
    }
}

    const supprimer = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cette demande ?')) return
        setDeleteLoading(id)
        try {
            await api.delete(`/ordres-mission/${id}`)
            setEnAttente(prev => prev.filter(o => o.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression')
        } finally {
            setDeleteLoading(null)
        }
    }

    const supprimerHistorique = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cet ordre de l\'historique ?')) return
        setDeleteLoading(id)
        try {
            await api.delete(`/ordres-mission/${id}/historique`)
            setHistorique(prev => prev.filter(o => o.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression')
        } finally {
            setDeleteLoading(null)
        }
    }
const transmettreIncident = async (id) => {
        setTransmettreLoading(id)
        try {
            await api.post(`/ordres-mission/${id}/transmettre-incident-drh`)
            chargerOrdres()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setTransmettreLoading(null)
        }
    }
    const marquerExecute = async (id) => {
    if (!confirm('Confirmez-vous que cette mission a bien été effectuée ?')) return
    setExecuteLoading(id)
    try {
        await api.patch(`/ordres-mission/${id}/marquer-execute-manuel`)
        chargerOrdres()
    } catch (err) {
        alert(err.response?.data?.message || 'Erreur')
    } finally {
        setExecuteLoading(null)
    }
}
    const toutSelectionne = historiqueFiltres.length > 0 && historiqueFiltres.every(o => selected.includes(o.id))

    const renderOrdre = (ordre, estHistorique = false) => {
        const statut = statutConfig[ordre.statut] || statutConfig['en_attente_drh']
        const Icon = statut.icon
        const peutModifier = ordre.statut === 'en_attente_drh'

        return (
            <div key={ordre.id} className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition ${estHistorique && selected.includes(ordre.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                   <div className="flex items-center gap-4">
    {/* Checkbox  */}
    <input
        type="checkbox"
        checked={selected.includes(ordre.id)}
        onChange={() => toggleSelect(ordre.id)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 mt-1"
    />
    <div className="bg-blue-100 p-3 rounded-xl">
        <Bus size={20} className="text-blue-700" />
    </div>
                        <div>
                            <p className="font-semibold text-gray-800">
                                {ordre.destination || (ordre.trajet === 'autres' && ordre.trajet_autre
                                    ? ordre.trajet_autre
                                    : trajetLabels[ordre.trajet] || ordre.trajet)}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Départ : {new Date(ordre.date_depart).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Chauffeur : {ordre.chauffeur_prenom} {ordre.chauffeur_nom}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{ordre.motif}</p>
                        </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                        <Icon size={12} />
                        {statut.label}
                    </span>
                </div>

                {ordre.statut === 'rejete' && ordre.commentaire_rejet && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                        <p className="text-xs text-red-600 font-medium">Motif du rejet :</p>
                        <p className="text-xs text-red-500 mt-1">{ordre.commentaire_rejet}</p>
                    </div>
                )}
{ordre.incident_repondu_drh && ordre.reponse_drh && (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
        <p className="text-xs text-blue-600 font-medium">Réponse du DRH à l'incident :</p>
        <p className="text-xs text-blue-500 mt-1">{ordre.reponse_drh}</p>
    </div>
)}
                <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                        onClick={() => navigate(`/ordres-mission/${ordre.id}/document`)}
                        className="flex items-center gap-1.5 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-50 transition"
                    >
                        <FileText size={14} />
                        Voir l'ordre
                    </button>
{ordre.statut === 'incident' && !ordre.incident_transmis_drh && (
    <button
        onClick={() => transmettreIncident(ordre.id)}
        disabled={transmettreLoading === ordre.id}
        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
    >
        {transmettreLoading === ordre.id
            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <AlertTriangle size={14} />
        }
        Transmettre l'incident au DRH
    </button>
)}

{ordre.statut === 'incident' && ordre.incident_transmis_drh && !ordre.incident_repondu_drh && (
    <span className="flex items-center gap-1.5 text-xs text-orange-600 font-medium px-3 py-2">
        En attente de réponse du DRH...
    </span>
)}
{ordre.statut === 'transmis_chauffeur' && (
    <button
        onClick={() => marquerExecute(ordre.id)}
        disabled={executeLoading === ordre.id}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
    >
        {executeLoading === ordre.id
            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <CheckCircle size={14} />
        }
        Marquer comme exécuté
    </button>
)}
                    {!estHistorique && peutModifier && (
                        <>
                            <button
                                onClick={() => navigate(`/ddl/navettes/modifier/${ordre.id}`)}
                                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                            >
                                <PenLine size={14} />
                                Modifier
                            </button>
                            <button
                                onClick={() => supprimer(ordre.id)}
                                disabled={deleteLoading === ordre.id}
                                className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                            >
                                {deleteLoading === ordre.id
                                    ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                    : <Trash2 size={14} />
                                }
                                Supprimer
                            </button>
                        </>
                    )}

                    {estHistorique && (
                        <button
                            onClick={() => supprimerHistorique(ordre.id)}
                            disabled={deleteLoading === ordre.id}
                            className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                        >
                            {deleteLoading === ordre.id
                                ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <Trash2 size={14} />
                            }
                            Supprimer
                        </button>
                    )}

                </div>
            </div>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
<div className="flex items-center justify-between">
    <div>
        <h1 className="text-2xl font-bold text-gray-800">Mes demandes de navette</h1>
        <p className="text-gray-500 text-sm mt-1">{enAttente.length} en attente · {historique.length} dans l'historique</p>
    </div>
    <button
        onClick={() => navigate('/ddl/navettes/nouvelle')}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition"
    >
        <Plus size={18} />
        Nouvelle demande
    </button>
</div>

                {/* Onglets */}
            <div className="flex gap-2 border-b border-gray-200">
    <button
        onClick={() => setOnglet('attente')}
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            onglet === 'attente'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
    >
        En attente ({enAttente.length})
    </button>
    <button
        onClick={() => setOnglet('historique')}
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            onglet === 'historique'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
    >
        <History size={15} />
        Historique ({historique.length})
    </button>
</div>

                {/* Recherche */}
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par destination, chauffeur, motif..."
                        value={searchNavettes}
                        onChange={e => setSearchNavettes(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : onglet === 'attente' ? (
                    enAttenteFiltres.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bus size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucune demande en attente</h3>
                            <p className="text-gray-400 text-sm mb-5">Vous n'avez pas encore soumis de demande</p>
                            <button
                                onClick={() => navigate('/ddl/navettes/nouvelle')}
                                className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
                            >
                                Faire une demande
                            </button>
                        </div>
                   ) : (
    <div className="space-y-4">
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={toutSelectionneAttente}
                    onChange={toggleSelectAllAttente}
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
                    onClick={supprimerSelectionAttente}
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

        {enAttenteFiltres.map(ordre => renderOrdre(ordre, false))}
    </div>
)
                ) : (
                    historiqueFiltres.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                            <p className="text-gray-400 text-sm">Aucun ordre traité pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Barre tout sélectionner + supprimer */}
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

                            {historiqueFiltres.map(ordre => renderOrdre(ordre, true))}
                        </div>
                    )
                )}
            </div>
        </Layout>
    )
}