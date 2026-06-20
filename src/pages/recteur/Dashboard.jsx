import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, CheckCircle, AlertCircle, FileText, Send, Eye, Trash2, History } from 'lucide-react'

export default function RecteurDashboard() {
    const navigate  = useNavigate()
    const location  = useLocation()
    const [voyages, setVoyages]             = useState([])
    const [autorisations, setAutorisations] = useState([])
    const [loading, setLoading]             = useState(true)
    const [activeTab, setActiveTab]         = useState('arretes')
    const [actionLoading, setActionLoading] = useState(null)
    const [message, setMessage]             = useState('')
    const [error, setError]                 = useState('')

    const [selectedDefinitifs, setSelectedDefinitifs] = useState([])
    const [selectedSignes, setSelectedSignes]         = useState([])
    const [selectedAuto, setSelectedAuto]             = useState([])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (['arretes', 'autorisations', 'historique', 'historique_arretes'].includes(tab)) setActiveTab(tab)
    }, [location.search])

    useEffect(() => { fetchAll() }, [])

    const fetchAll = async () => {
        try {
            const [voyagesRes, autorisationsRes] = await Promise.all([
                api.get('/voyages-etudes'),
                api.get('/voyages-etudes/dossiers-departement'),
            ])
            setVoyages(voyagesRes.data)
            setAutorisations(autorisationsRes.data)
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

    const signerArrete = async (voyageId) => {
        setActionLoading('arrete_' + voyageId)
        try {
            await api.patch(`/voyages-etudes/${voyageId}/signer-arrete`)
            showMsg('Arrete signe — le Vice-Recteur a ete notifie')
            setTimeout(() => {
                setVoyages(prev => prev.map(v =>
                    v.id === voyageId ? { ...v, arrete_recteur: true } : v
                ))
            }, 1500)
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    const approuverAutorisation = async (beneficiaireId) => {
        setActionLoading('autorisation_' + beneficiaireId)
        try {
            await api.patch(`/voyages-etudes/beneficiaire/${beneficiaireId}/approuver-autorisation-recteur`)
            showMsg('Autorisation de sortie approuvee')
            setTimeout(() => {
                setAutorisations(prev => prev.filter(d => d.id !== beneficiaireId))
            }, 3000)
        } catch (err) {
            showMsg(err.response?.data?.message || 'Erreur', true)
        } finally {
            setActionLoading(null)
        }
    }

    const supprimerVoyages = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} voyage(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/voyages-etudes/${id}`)
            setVoyages(prev => prev.filter(v => !ids.includes(v.id)))
            setSelectedDefinitifs(prev => prev.filter(i => !ids.includes(i)))
            setSelectedSignes(prev => prev.filter(i => !ids.includes(i)))
            showMsg('Suppression effectuée')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const supprimerAutorisations = async (ids) => {
        if (!confirm(`Supprimer ${ids.length} autorisation(s) ?`)) return
        try {
            for (const id of ids) await api.delete(`/voyages-etudes/beneficiaire/${id}/dossier`)
            setAutorisations(prev => prev.filter(d => !ids.includes(d.id)))
            setSelectedAuto([])
            showMsg('Suppression effectuée')
        } catch { showMsg('Erreur lors de la suppression', true) }
    }

    const definitifs     = voyages.filter(v => v.statut_liste === 'definitive' && !v.arrete_recteur)
    const signes         = voyages.filter(v => v.arrete_recteur)
    const autorEnAttente = autorisations.filter(d => d.statut_autorisation === 'envoye_recteur')
    const autorHistorique = autorisations.filter(d => d.statut_autorisation === 'approuve_recteur')

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
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Recteur</h1>
                    <p className="text-gray-500 text-sm mt-1">Signature des arretes et autorisations de sortie</p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div onClick={() => setActiveTab('arretes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <FileText size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{definitifs.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Arretes a signer</p>
                    </div>
                    <div onClick={() => setActiveTab('autorisations')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition">
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <Send size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{autorEnAttente.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Autorisations a approuver</p>
                    </div>
                    <div onClick={() => setActiveTab('historique_arretes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 hover:shadow-md transition">
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{signes.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Arretes signes</p>
                    </div>
                    <div onClick={() => setActiveTab('historique')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 hover:shadow-md transition">
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <History size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{autorHistorique.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Historique autorisations</p>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-200 flex-wrap">
                    {[
                        { key: 'arretes', label: 'Arretes a signer', count: definitifs.length, color: 'orange' },
                        { key: 'autorisations', label: 'Autorisations de sortie', count: autorEnAttente.length, color: 'blue' },
                        { key: 'historique_arretes', label: 'Historique arretes signes', count: signes.length, color: 'green' },
                        { key: 'historique', label: 'Historique autorisations', count: autorHistorique.length, color: 'green' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'border-blue-700 text-blue-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`bg-${tab.color}-100 text-${tab.color}-700 text-xs rounded-full px-1.5 py-0.5 font-bold`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

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
                        {/* ===== ARRETES A SIGNER ===== */}
                        {activeTab === 'arretes' && (
                            definitifs.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun arrete en attente</h3>
                                    <p className="text-gray-400 text-sm">Les listes definitives apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedDefinitifs}
                                        total={definitifs.length}
                                        onSelectAll={() => setSelectedDefinitifs(
                                            selectedDefinitifs.length === definitifs.length ? [] : definitifs.map(v => v.id)
                                        )}
                                        onDeleteSelected={() => supprimerVoyages(selectedDefinitifs)}
                                        onDeleteAll={() => supprimerVoyages(definitifs.map(v => v.id))}
                                    />
                                    {definitifs.map(voyage => (
                                        <div key={voyage.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                            selectedDefinitifs.includes(voyage.id) ? 'border-blue-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedDefinitifs.includes(voyage.id)}
                                                        onChange={() => setSelectedDefinitifs(prev =>
                                                            prev.includes(voyage.id) ? prev.filter(i => i !== voyage.id) : [...prev, voyage.id]
                                                        )}
                                                        className="w-4 h-4 accent-blue-700 cursor-pointer mt-1" />
                                                    <div className="bg-blue-100 p-3 rounded-xl">
                                                        <MapPin size={20} className="text-blue-700" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{voyage.destination}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} - {new Date(voyage.date_fin).toLocaleDateString('fr-FR')}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {voyage.beneficiaires?.filter(b => b.dans_liste_definitive).length} beneficiaire(s)
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                                                    En attente
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {voyage.beneficiaires?.filter(b => b.dans_liste_definitive).map(b => (
                                                    <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                            {b.enseignant?.prenom?.[0]}{b.enseignant?.nom?.[0]}
                                                        </div>
                                                        <p className="text-sm text-gray-700">{b.enseignant?.prenom} {b.enseignant?.nom}</p>
                                                        <span className="text-xs text-gray-500">{b.enseignant?.ufr}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button onClick={() => signerArrete(voyage.id)}
                                                disabled={actionLoading === 'arrete_' + voyage.id}
                                                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50">
                                                {actionLoading === 'arrete_' + voyage.id
                                                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    : <FileText size={16} />}
                                                Signer l'arrete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== HISTORIQUE ARRETES ===== */}
                        {activeTab === 'historique_arretes' && (
                            signes.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <History size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun arrete signe</h3>
                                    <p className="text-gray-400 text-sm">Les arretes que vous signez apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedSignes}
                                        total={signes.length}
                                        onSelectAll={() => setSelectedSignes(
                                            selectedSignes.length === signes.length ? [] : signes.map(v => v.id)
                                        )}
                                        onDeleteSelected={() => supprimerVoyages(selectedSignes)}
                                        onDeleteAll={() => supprimerVoyages(signes.map(v => v.id))}
                                    />
                                    {signes.map(voyage => (
                                        <div key={voyage.id} className={`rounded-2xl p-4 flex items-center justify-between border transition ${
                                            selectedSignes.includes(voyage.id) ? 'bg-green-50 border-blue-300' : 'bg-green-50 border-green-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox"
                                                    checked={selectedSignes.includes(voyage.id)}
                                                    onChange={() => setSelectedSignes(prev =>
                                                        prev.includes(voyage.id) ? prev.filter(i => i !== voyage.id) : [...prev, voyage.id]
                                                    )}
                                                    className="w-4 h-4 accent-blue-700 cursor-pointer" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{voyage.destination}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(voyage.date_debut).toLocaleDateString('fr-FR')} - {new Date(voyage.date_fin).toLocaleDateString('fr-FR')} · {voyage.beneficiaires?.filter(b => b.dans_liste_definitive).length} beneficiaire(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                                                <CheckCircle size={14} /> Signe
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== AUTORISATIONS ===== */}
                        {activeTab === 'autorisations' && (
                            autorEnAttente.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucune autorisation</h3>
                                    <p className="text-gray-400 text-sm">Les autorisations de sortie apparaitront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <BarreSelection
                                        selected={selectedAuto}
                                        total={autorEnAttente.length}
                                        onSelectAll={() => setSelectedAuto(
                                            selectedAuto.length === autorEnAttente.length ? [] : autorEnAttente.map(d => d.id)
                                        )}
                                        onDeleteSelected={() => supprimerAutorisations(selectedAuto)}
                                        onDeleteAll={() => supprimerAutorisations(autorEnAttente.map(d => d.id))}
                                    />
                                    {autorEnAttente.map(d => (
                                        <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                            selectedAuto.includes(d.id) ? 'border-blue-300' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox"
                                                        checked={selectedAuto.includes(d.id)}
                                                        onChange={() => setSelectedAuto(prev =>
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

                                            <div className="bg-blue-50 rounded-xl p-3 mb-4">
                                                <p className="text-sm text-blue-700">
                                                    Autorisation de sortie transmise par le Directeur UFR. Votre approbation est requise.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                {d.autorisation_absence && d.autorisation_absence.id && (
                                                    <button
                                                        onClick={() => navigate('/autorisation-absence/' + d.autorisation_absence.id + '/document')}
                                                        className="w-full flex items-center justify-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 py-2.5 rounded-xl font-semibold text-sm transition">
                                                        <Eye size={16} /> Voir le document
                                                    </button>
                                                )}
                                                <button onClick={() => approuverAutorisation(d.id)}
                                                    disabled={actionLoading === 'autorisation_' + d.id}
                                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50">
                                                    {actionLoading === 'autorisation_' + d.id
                                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        : <CheckCircle size={16} />}
                                                    Approuver l'autorisation de sortie
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== HISTORIQUE AUTORISATIONS ===== */}
                        {activeTab === 'historique' && (
                            autorHistorique.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                    <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-gray-700 font-semibold mb-2">Aucun historique</h3>
                                    <p className="text-gray-400 text-sm">Les autorisations approuvées apparaîtront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {autorHistorique.map(d => (
                                        <div key={d.id} className="bg-green-50 rounded-2xl border border-green-200 p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                                                    {d.enseignant?.prenom?.[0]}{d.enseignant?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{d.enseignant?.prenom} {d.enseignant?.nom}</p>
                                                    <p className="text-xs text-gray-500">{d.enseignant?.ufr} — {d.voyage?.destination}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                                                    <CheckCircle size={12} /> Approuvée
                                                </span>
                                                {d.autorisation_absence && d.autorisation_absence.id && (
                                                    <button
                                                        onClick={() => navigate('/autorisation-absence/' + d.autorisation_absence.id + '/document')}
                                                        className="flex items-center gap-1.5 border border-green-600 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                                                        <Eye size={13} /> Voir
                                                    </button>
                                                )}
                                            </div>
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