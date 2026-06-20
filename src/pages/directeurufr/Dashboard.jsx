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

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (tab === 'attente' || tab === 'transmis') setActiveTab(tab)
    }, [location.search])

    useEffect(() => { fetchDossiers() }, [])

    const fetchDossiers = async () => {
        try {
            const res = await api.get('/voyages-etudes/dossiers-departement')
            setDossiers(res.data)
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

    const envoyerAuRecteur = async (id) => {
        setActionLoading(id)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${id}/envoyer-autorisation-recteur`)
            showMsg('Autorisation de sortie transmise au Recteur')
            // Retirer automatiquement après 3s
            setTimeout(() => {
                setDossiers(prev => prev.map(d =>
                    d.id === id ? { ...d, statut_autorisation: 'envoye_recteur' } : d
                ))
            }, 3000)
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

    const dossiersFiltres = dossiers.filter(d => d.statut_autorisation === 'envoye_directeur_ufr')
    const dossiersTransmis = dossiers.filter(d =>
        d.statut_autorisation === 'envoye_recteur' || d.statut_autorisation === 'approuve_recteur'
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
                        <p className="text-2xl font-bold text-gray-800">{dossiersFiltres.length}</p>
                        <p className="text-sm text-gray-500 mt-1">En attente de transmission</p>
                    </div>
                    <div onClick={() => setActiveTab('transmis')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 hover:shadow-md transition">
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{dossiersTransmis.length}</p>
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
                        {dossiersFiltres.length > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5 font-bold">
                                {dossiersFiltres.length}
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
                        {dossiersTransmis.length > 0 && (
                            <span className="bg-green-100 text-green-700 text-xs rounded-full px-1.5 py-0.5 font-bold">
                                {dossiersTransmis.length}
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
                            dossiersFiltres.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <FileText size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune autorisation</h3>
                                    <p className="text-gray-400 text-sm">Les autorisations de sortie apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedAttente}
                                        total={dossiersFiltres.length}
                                        onSelectAll={() => setSelectedAttente(
                                            selectedAttente.length === dossiersFiltres.length ? [] : dossiersFiltres.map(d => d.id)
                                        )}
                                        onDeleteSelected={() => supprimerDossiers(selectedAttente)}
                                        onDeleteAll={() => supprimerDossiers(dossiersFiltres.map(d => d.id))}
                                    />
                                    {dossiersFiltres.map(d => (
                                        <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                            selectedAttente.includes(d.id) ? 'border-blue-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedAttente.includes(d.id)}
                                                        onChange={() => setSelectedAttente(prev =>
                                                            prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]
                                                        )}
                                                        className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                                        {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                        <p className="text-xs text-gray-500">{d.enseignant?.ufr}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-700 text-sm">{d.voyage?.destination}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(d.voyage?.date_debut).toLocaleDateString('fr-FR')} - {new Date(d.voyage?.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 rounded-xl p-3 mb-4">
                                                <p className="text-sm text-blue-700">
                                                    Le Chef de Departement a emis une autorisation de sortie. Vous devez l'autoriser et la transmettre au Recteur.
                                                </p>
                                            </div>

                                            {d.justificatifs?.length > 0 && (
                                                <div className="space-y-1 mb-4">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Justificatifs :</p>
                                                    {d.justificatifs.map(j => (
                                                        <button key={j.id}
                                                            onClick={() => window.open(`http://127.0.0.1:8000/storage/${j.fichier_pdf}`, '_blank')}
                                                            className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                                                            <Eye size={14} /> {j.nom_original || 'Fichier PDF'}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                          {d.autorisation_absence && d.autorisation_absence.id && (
    <button
        onClick={() => navigate('/autorisation-absence/' + d.autorisation_absence.id + '/document')}
        className="flex items-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold transition mb-2">
        <Eye size={14} />
        Voir l'autorisation d'absence
    </button>
)}
<button onClick={() => envoyerAuRecteur(d.id)}
    disabled={actionLoading === d.id}
    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
    {actionLoading === d.id
        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <Send size={14} />}
    Autoriser et transmettre au Recteur
</button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ONGLET TRANSMIS */}
                        {activeTab === 'transmis' && (
                            dossiersTransmis.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun dossier transmis</h3>
                                    <p className="text-gray-400 text-sm">Les dossiers transmis au Recteur apparaîtront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedTransmis}
                                        total={dossiersTransmis.length}
                                        onSelectAll={() => setSelectedTransmis(
                                            selectedTransmis.length === dossiersTransmis.length ? [] : dossiersTransmis.map(d => d.id)
                                        )}
                                        onDeleteSelected={() => supprimerDossiers(selectedTransmis)}
                                        onDeleteAll={() => supprimerDossiers(dossiersTransmis.map(d => d.id))}
                                    />
                                    {dossiersTransmis.map(d => (
                                        <div key={d.id} className={`rounded-2xl border p-4 flex items-center justify-between transition ${
                                            selectedTransmis.includes(d.id)
                                                ? 'bg-green-50 border-blue-300'
                                                : 'bg-green-50 border-green-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox"
                                                    checked={selectedTransmis.includes(d.id)}
                                                    onChange={() => setSelectedTransmis(prev =>
                                                        prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]
                                                    )}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                                                    {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                    <p className="text-xs text-gray-500">{d.voyage?.destination}</p>
                                                </div>
                                            </div>
                                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                d.statut_autorisation === 'approuve_recteur'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                <CheckCircle size={12} />
                                                {d.statut_autorisation === 'approuve_recteur' ? 'Approuvé' : 'Transmis'}
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