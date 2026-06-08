import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { ClipboardList, UserPlus, Trash2, CheckCircle, Search } from 'lucide-react'

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
}

export default function NouveauRegistre() {
    const { ordreId } = useParams()
    const navigate = useNavigate()
    const [ordre, setOrdre] = useState(null)
    const [registre, setRegistre] = useState(null)
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        Promise.all([
            api.get(`/ordres-mission/${ordreId}`),
            api.get('/users'),
        ]).then(([ordreRes, usersRes]) => {
            setOrdre(ordreRes.data)
            setUsers(usersRes.data)
        }).catch(() => {})
        .finally(() => setLoading(false))
    }, [ordreId])

    const ouvrirRegistre = async () => {
        setActionLoading(true)
        try {
            const res = await api.post('/registres', {
                ordre_mission_id: ordreId,
                date_trajet: new Date().toISOString().split('T')[0],
            })
            setRegistre(res.data.registre)
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(false)
        }
    }

    const ajouterPassager = async (passagerId) => {
        try {
            const res = await api.post(`/registres/${registre.id}/passager`, {
                passager_id: passagerId
            })
            setRegistre(prev => ({
                ...prev,
                presences: [...(prev.presences || []), res.data.presence]
            }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        }
    }

    const retirerPassager = async (passagerId) => {
        try {
            await api.delete(`/registres/${registre.id}/passager/${passagerId}`)
            setRegistre(prev => ({
                ...prev,
                presences: prev.presences.filter(p => p.passager_id !== passagerId)
            }))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        }
    }

    const cloturer = async () => {
        if (!window.confirm('Confirmer la clôture du registre ?')) return
        setActionLoading(true)
        try {
            await api.patch(`/registres/${registre.id}/cloturer`)
            navigate('/chauffeur/registres')
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(false)
        }
    }

    const passagersAjoutes = registre?.presences?.map(p => p.passager_id) || []
    const usersFiltres = users.filter(u =>
        u.role === 'ddl' &&
        (u.nom.toLowerCase().includes(search.toLowerCase()) ||
        u.prenom.toLowerCase().includes(search.toLowerCase()) ||
        (u.matricule || '').toLowerCase().includes(search.toLowerCase()))
    )

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Registre de trajet</h1>
                    {ordre && (
                        <p className="text-gray-500 text-sm mt-1">
                            {trajetLabels[ordre.trajet]} — {new Date(ordre.date_depart).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                </div>

                {/* Ouvrir registre */}
                {!registre ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList size={28} className="text-blue-700" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Ouvrir le registre</h3>
                        <p className="text-gray-400 text-sm mb-5">
                            Cliquez ci-dessous pour ouvrir le registre et enregistrer les passagers
                        </p>
                        <button
                            onClick={ouvrirRegistre}
                            disabled={actionLoading}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                        >
                            {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Ouvrir le registre
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Recherche passagers */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ajouter des passagers</h2>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Rechercher par nom ou matricule..."
                                />
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {usersFiltres.map(user => {
                                    const dejAjoute = passagersAjoutes.includes(user.id)
                                    return (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {user.prenom} {user.nom}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {user.matricule} — {user.statut}
                                                </p>
                                            </div>
                                            {dejAjoute ? (
                                                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                                    <CheckCircle size={14} /> Ajouté
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => ajouterPassager(user.id)}
                                                    className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-1.5 rounded-lg transition"
                                                >
                                                    <UserPlus size={13} />
                                                    Ajouter
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Liste passagers ajoutés */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Passagers enregistrés ({registre.presences?.length || 0})
                            </h2>

                            {!registre.presences?.length ? (
                                <p className="text-center text-gray-400 text-sm py-6">
                                    Aucun passager ajouté
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {registre.presences.map(presence => (
                                        <div key={presence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {presence.passager?.prenom} {presence.passager?.nom}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {presence.statut_passager === 'vacataire' ? '🆓 Gratuit' : `${Number(presence.montant_retenue).toLocaleString()} FCFA`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => retirerPassager(presence.passager_id)}
                                                className="text-red-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Total */}
                            {registre.presences?.length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                                    <span className="text-sm font-semibold text-blue-700">Total à retenir</span>
                                    <span className="text-blue-800 font-bold">
                                        {registre.presences
                                            .filter(p => p.statut_passager === 'permanent')
                                            .reduce((sum, p) => sum + Number(p.montant_retenue), 0)
                                            .toLocaleString()} FCFA
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Clôturer */}
                        <button
                            onClick={cloturer}
                            disabled={actionLoading || !registre.presences?.length}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            <CheckCircle size={18} />
                            Clôturer et transmettre au SG VR
                        </button>
                    </>
                )}
            </div>
        </Layout>
    )
}