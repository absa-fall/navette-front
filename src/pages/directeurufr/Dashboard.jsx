import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, CheckCircle, AlertCircle, Send, Eye, Trash2 } from 'lucide-react'

export default function DirecteurUFRDashboard() {
    const navigate  = useNavigate()
    const location  = useLocation()
    const [dossiers, setDossiers]           = useState([])
    const [loading, setLoading]             = useState(true)
    const [activeTab, setActiveTab]         = useState('attente')
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage]             = useState('')
    const [error, setError]                 = useState('')
    const [selectedAttente, setSelectedAttente]   = useState([])
    const [selectedTransmis, setSelectedTransmis] = useState([])
    const [autorisationsAbsence, setAutorisationsAbsence] = useState([])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (tab === 'attente' || tab === 'transmis') setActiveTab(tab)
    }, [location.search])

    useEffect(() => { fetchDossiers() }, [])

   const fetchDossiers = async () => {
    try {
        const [resDossiers, resAutos] = await Promise.all([
            api.get('/voyages-etudes/dossiers-departement'),
            api.get('/autorisations-absence'),
        ])
        setDossiers(resDossiers.data)
        setAutorisationsAbsence(resAutos.data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
}

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg)
        else setMessage(msg)
        setTimeout(() => { setMessage(''); setError('') }, 3000)
    }

   const approuverEtTransmettre = async (autorisationId) => {
    setActionLoading(autorisationId + '_approuver')
    try {
        await api.patch(`/autorisations-absence/${autorisationId}/avis-directeur-ufr`, {
            avis: 'favorable',
        })
        showMsg('Autorisation approuvee et transmise au Recteur')
        fetchDossiers()
    } catch (err) {
        showMsg(err.response?.data?.message || 'Erreur', true)
    } finally {
        setActionLoading(null)
    }
}

    const supprimerDossiers = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} dossier(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`)
            setDossiers(prev => prev.filter(d => !ids.includes(d.id)))
            setSelectedAttente([])
            setSelectedTransmis([])
            showMsg('Suppression effectuée')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

   const autorisationsEnAttente = autorisationsAbsence.filter(a => a.statut === 'avis_chef_departement')
const autorisationsTransmises = autorisationsAbsence.filter(a =>
    ['avis_directeur_ufr', 'signee_recteur', 'transmise'].includes(a.statut)
)

    const BarreSelection = ({ selected, total, onSelectAll, onDeleteSelected, onDeleteAll }) => (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
                <input type="checkbox"
                    checked={selected.length === total && total > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                <span className="text-sm text-gray-600">
                    {selected.length > 0 ? `${selected.length} sélectionné(s)` : 'Tout sélectionner'}
                </span>
            </div>
            <div className="flex gap-2">
                {selected.length > 0 && (
                    <button onClick={onDeleteSelected}
                        className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        <Trash2 size={13} /> Supprimer ({selected.length})
                    </button>
                )}
                <button onClick={onDeleteAll}
                    className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                    <Trash2 size={13} /> Supprimer tout
                </button>
            </div>
        </div>
    )

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Directeur UFR</h1>
                    <p className="text-gray-500 text-sm mt-1">Autorisations de sortie a transmettre au Recteur</p>
                </div>

               
{/* Stats cliquables */}
<div className="grid grid-cols-2 gap-4">
    <div onClick={() => setActiveTab('attente')}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
            <FileText size={20} className="text-blue-700" />
        </div>
        <p className="text-2xl font-bold text-gray-800">{autorisationsEnAttente.length}</p>
        <p className="text-sm text-gray-500 mt-1">En attente de transmission</p>
    </div>
    <div onClick={() => setActiveTab('transmis')}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 hover:shadow-md transition">
        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
            <CheckCircle size={20} className="text-green-700" />
        </div>
        <p className="text-2xl font-bold text-gray-800">{autorisationsTransmises.length}</p>
        <p className="text-sm text-gray-500 mt-1">Transmis au Recteur</p>
    </div>
</div>
               {/* Onglets */}
<div className="flex gap-2 border-b border-gray-200">
    <button onClick={() => setActiveTab('attente')}
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'attente'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}>
        En attente
        {autorisationsEnAttente.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5 font-bold">
                {autorisationsEnAttente.length}
            </span>
        )}
    </button>
    <button onClick={() => setActiveTab('transmis')}
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'transmis'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}>
        Transmis au Recteur
        {autorisationsTransmises.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs rounded-full px-1.5 py-0.5 font-bold">
                {autorisationsTransmises.length}
            </span>
        )}
    </button>
</div>
                {/* Messages */}
                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                  {/* ONGLET EN ATTENTE */}
{activeTab === 'attente' && (
    autorisationsEnAttente.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <FileText size={40} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-gray-700 font-semibold mb-2">Aucune autorisation</h3>
            <p className="text-gray-400 text-sm">Les autorisations a transmettre apparaitront ici</p>
        </div>
    ) : (
        <div className="space-y-3">
            {autorisationsEnAttente.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                {a.enseignant?.prenom?.[0]}{a.enseignant?.nom?.[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{a.enseignant?.prenom} {a.enseignant?.nom}</p>
                                <p className="text-xs text-gray-500">{a.numero}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-gray-700 text-sm">{a.lieu_deplacement}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(a.periode_debut).toLocaleDateString('fr-FR')} - {new Date(a.periode_fin).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-3 mb-4">
                        <p className="text-sm text-blue-700">
                            Le Chef de Departement a donne un avis favorable. Vous devez approuver et transmettre au Recteur.
                        </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => navigate('/autorisation-absence/' + a.id + '/document')}
                            className="flex items-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition">
                            <Eye size={14} />
                            Voir l'autorisation d'absence
                        </button>
                        <button onClick={() => approuverEtTransmettre(a.id)}
                            disabled={actionLoading === a.id + '_approuver'}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                            {actionLoading === a.id + '_approuver'
                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Send size={14} />}
                            Autoriser et transmettre au Recteur
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
)}
                        {/* ONGLET TRANSMIS */}
{activeTab === 'transmis' && (
    autorisationsTransmises.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-gray-700 font-semibold mb-2">Aucun dossier transmis</h3>
            <p className="text-gray-400 text-sm">Les dossiers transmis au Recteur apparaîtront ici</p>
        </div>
    ) : (
        <div className="space-y-3">
            {autorisationsTransmises.map(a => (
                <div key={a.id} className="rounded-2xl border bg-green-50 border-green-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                            {a.enseignant?.prenom?.[0]}{a.enseignant?.nom?.[0]}
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">{a.enseignant?.prenom} {a.enseignant?.nom}</p>
                            <p className="text-xs text-gray-500">{a.numero}</p>
                        </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        <CheckCircle size={12} />
                        {a.statut === 'transmise' ? 'Finalise' : a.statut === 'signee_recteur' ? 'Signe Recteur' : 'Transmis'}
                    </span>
                </div>
            ))}
        </div>
    )
)}
                    </>
                )}
            </div>
        </Layout>
    )
}