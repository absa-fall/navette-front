import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Bus, CheckCircle, FileText, History, Truck, Trash2, ThumbsUp, XCircle } from 'lucide-react'

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
    autres: 'Autres',
}

export default function MesTrajets() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const statutFiltre = searchParams.get('statut')
    const { user } = useAuth()

    const [enCours, setEnCours] = useState([])
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [onglet, setOnglet] = useState('encours')
    const [selected, setSelected] = useState([])

    // ✅ Modal refus
    const [modalRefus, setModalRefus] = useState({ visible: false, ordreId: null })
    const [motifRefus, setMotifRefus] = useState('')
    const [motifError, setMotifError] = useState('')

    useEffect(() => { chargerOrdres() }, [])

    useEffect(() => {
        if (statutFiltre === 'assignes' || statutFiltre === 'en_attente') setOnglet('encours')
        else if (statutFiltre === 'effectues') setOnglet('historique')
    }, [statutFiltre])

    useEffect(() => { setSelected([]) }, [onglet])

    const chargerOrdres = () => {
        api.get('/ordres-mission-chauffeur')
            .then(res => {
                const tous = res.data
                setEnCours(tous.filter(o => o.statut === 'transmis_chauffeur' && o.statut_chauffeur !== 'refuse'))
                setHistorique(tous.filter(o => o.statut === 'execute' || o.statut_chauffeur === 'refuse'))
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const executer = async (id) => {
        setActionLoading(id)
        try {
            await api.patch(`/ordres-mission/${id}/marquer-recu`)
            chargerOrdres()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const approuver = async (id) => {
        setActionLoading(`approuver-${id}`)
        try {
            await api.post(`/ordres-mission/${id}/accepter`)
            chargerOrdres()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'approbation')
        } finally {
            setActionLoading(null)
        }
    }

    const ouvrirModalRefus = (id) => {
        setMotifRefus('')
        setMotifError('')
        setModalRefus({ visible: true, ordreId: id })
    }

    const fermerModalRefus = () => {
        setModalRefus({ visible: false, ordreId: null })
        setMotifRefus('')
        setMotifError('')
    }

    const confirmerRefus = async () => {
        if (!motifRefus.trim()) {
            setMotifError('Le motif est obligatoire.')
            return
        }
        const id = modalRefus.ordreId
        fermerModalRefus()
        setActionLoading(`refuser-${id}`)
        try {
            await api.post(`/ordres-mission/${id}/refuser`, { motif_refus: motifRefus.trim() })
            chargerOrdres()
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors du refus')
        } finally {
            setActionLoading(null)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        const ids = historique.map(o => o.id)
        if (ids.every(id => selected.includes(id))) setSelected([])
        else setSelected(ids)
    }

    const supprimerSelection = async () => {
        if (selected.length === 0) return
        if (!confirm(`Voulez-vous vraiment supprimer ${selected.length} trajet(s) de l'historique ?`)) return
        setDeleteLoading(true)
        try {
            await Promise.all(selected.map(id => api.delete(`/ordres-mission/${id}/historique`)))
            setHistorique(prev => prev.filter(o => !selected.includes(o.id)))
            setSelected([])
        } catch (err) {
            alert('Erreur lors de la suppression.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const missionTerminee = (ordre) => {
        if (!ordre.date_retour) return true
        const aujourdhui = new Date()
        aujourdhui.setHours(0, 0, 0, 0)
        const dateRetour = new Date(ordre.date_retour)
        dateRetour.setHours(0, 0, 0, 0)
        return aujourdhui >= dateRetour
    }

    const toutSelectionne = historique.length > 0 && historique.every(o => selected.includes(o.id))

    const getTitre = () => {
        if (statutFiltre === 'assignes') return 'Trajets assignés'
        if (statutFiltre === 'en_attente') return 'Trajets en attente'
        if (statutFiltre === 'effectues') return 'Trajets effectués'
        return 'Mes trajets'
    }

    return (
        <Layout>
            <div className="space-y-6">

               
                 

              <div>
    <h1 className="text-2xl font-bold text-gray-800">{getTitre()}</h1>
    <p className="text-gray-500 text-sm mt-1">
        {onglet === 'encours'
            ? `${enCours.length} trajet(s) en cours`
            : `${historique.length} trajet(s) dans l'historique`}
    </p>
</div>
               <div className="flex gap-2 border-b border-gray-200">
    <button onClick={() => setOnglet('encours')}
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${onglet === 'encours' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
        En cours ({enCours.length})
    </button>
    <button onClick={() => setOnglet('historique')}
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${onglet === 'historique' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
        <History size={15} />
        Historique ({historique.length})
    </button>
</div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : onglet === 'encours' ? (
                    enCours.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bus size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun trajet en cours</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {enCours.map(ordre => {
                                const estApprouve = ordre.statut_chauffeur === 'accepte'
                                return (
                                    <div key={ordre.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition ${estApprouve ? 'border-green-200' : 'border-gray-100'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${estApprouve ? 'bg-green-100' : 'bg-blue-100'}`}>
                                                    <Bus size={20} className={estApprouve ? 'text-green-700' : 'text-blue-700'} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{ordre.destination || trajetLabels[ordre.trajet] || ordre.trajet}</p>
                                                    <p className="text-sm text-gray-500 mt-0.5">{new Date(ordre.date_depart).toLocaleDateString('fr-FR')}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{ordre.ddl?.prenom} {ordre.ddl?.nom}</p>
                                                </div>
                                            </div>
                                            {estApprouve ? (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                                                    <CheckCircle size={12} /> Approuvé
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700">
                                                    <Truck size={12} /> En attente
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-3 flex-wrap">
                                            <button onClick={() => navigate(`/ordres-mission/${ordre.id}/document`)}
                                                className="flex items-center gap-2 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
                                                <FileText size={15} /> Voir l'ordre
                                            </button>

                                            {!estApprouve && (
                                                <button
                                                    onClick={() => approuver(ordre.id)}
                                                    disabled={actionLoading === `approuver-${ordre.id}`}
                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                                                >
                                                    {actionLoading === `approuver-${ordre.id}`
                                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        : <ThumbsUp size={16} />}
                                                    Approuver
                                                </button>
                                            )}

                                           {estApprouve ? (
                                                missionTerminee(ordre) ? (
                                                    <button
                                                        onClick={() => executer(ordre.id)}
                                                        disabled={actionLoading === ordre.id}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 min-w-[140px]"
                                                    >
                                                        {actionLoading === ordre.id
                                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            : <CheckCircle size={16} />}
                                                        Marquer exécuté
                                                    </button>
                                                ) : (
                                                    <button disabled
                                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-400 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed min-w-[140px]">
                                                        <CheckCircle size={16} />
                                                        Mission en cours — retour le {new Date(ordre.date_retour).toLocaleDateString('fr-FR')}
                                                    </button>
                                                )
                                            ) : (
                                                <button disabled
                                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-400 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed min-w-[140px]">
                                                    <CheckCircle size={16} />
                                                    Approuvez d'abord
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                ) : (
                    historique.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={toutSelectionne} onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                    Tout sélectionner ({historique.length})
                                </label>
                                {selected.length > 0 && (
                                    <button onClick={supprimerSelection} disabled={deleteLoading}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                        {deleteLoading
                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <Trash2 size={14} />}
                                        Supprimer ({selected.length})
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {historique.map(ordre => (
                                    <div key={ordre.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition ${selected.includes(ordre.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <input type="checkbox" checked={selected.includes(ordre.id)} onChange={() => toggleSelect(ordre.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 mt-1" />
                                                <div className="bg-blue-100 p-3 rounded-xl"><Bus size={20} className="text-blue-700" /></div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{ordre.destination || trajetLabels[ordre.trajet] || ordre.trajet}</p>
                                                    <p className="text-sm text-gray-500 mt-0.5">{new Date(ordre.date_depart).toLocaleDateString('fr-FR')}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{ordre.ddl?.prenom} {ordre.ddl?.nom}</p>
                                                </div>
                                            </div>
                                            {ordre.statut_chauffeur === 'refuse' ? (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700">
                                                    <XCircle size={12} /> Refusé
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                                                    <CheckCircle size={12} /> Exécuté
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={() => navigate(`/ordres-mission/${ordre.id}/document`)}
                                            className="flex items-center gap-2 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
                                            <FileText size={15} /> Voir l'ordre
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                )}
            </div>
        </Layout>
    )
}