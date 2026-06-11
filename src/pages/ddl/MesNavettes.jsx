import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Bus, Plus, Clock, CheckCircle, XCircle, PenLine, Truck, Trash2, FileText, History } from 'lucide-react'

const statutConfig = {
    en_attente_drh: { label: 'En attente DRH', color: 'bg-orange-100 text-orange-700', icon: Clock },
    approuve_drh: { label: 'Approuvé DRH', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    signe_sg: { label: 'Signé SG', color: 'bg-purple-100 text-purple-700', icon: PenLine },
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

export default function MesNavettes() {
    const navigate = useNavigate()
    const [enAttente, setEnAttente] = useState([])
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [onglet, setOnglet] = useState('attente')
    const [selected, setSelected] = useState([])
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)

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
                setEnAttente(tous.filter(o => o.statut === 'en_attente_drh'))
                setHistorique(tous.filter(o => o.statut !== 'en_attente_drh'))
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        const ids = historique.map(o => o.id)
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
            setHistorique(prev => prev.filter(o => !selected.includes(o.id)))
            setSelected([])
        } catch (err) {
            alert('Erreur lors de la suppression.')
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

    const voirOrdre = (ordre) => {
        const dateDepart = new Date(ordre.date_depart).toLocaleDateString('fr-FR')
        const dateRetour = ordre.date_retour
            ? new Date(ordre.date_retour).toLocaleDateString('fr-FR')
            : '___________'

        const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8" />
            <title>Ordre de Mission</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Times New Roman', serif; font-size: 13px; padding: 40px; color: #000; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .header-left { font-size: 11px; line-height: 1.6; }
                .header-right { text-align: right; font-size: 12px; }
                .institution { text-align: center; font-weight: bold; font-size: 12px; margin-top: 5px; line-height: 1.5; }
                .divider { border-top: 1px solid #000; margin: 10px 0; }
                .title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin: 20px 0 25px; letter-spacing: 1px; }
                .field { display: flex; align-items: baseline; margin-bottom: 14px; }
                .field-label { min-width: 200px; font-size: 13px; }
                .field-line { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; padding-left: 8px; font-size: 13px; font-weight: bold; }
                .mention { margin-top: 30px; font-size: 12px; line-height: 1.8; }
                .signature-section { display: flex; justify-content: flex-end; margin-top: 30px; }
                .signature-box { text-align: center; font-size: 12px; }
                .ampliations { margin-top: 50px; font-size: 11px; }
                .footer { margin-top: 40px; border-top: 1px solid #000; padding-top: 8px; text-align: center; font-size: 10px; }
                .print-btn { position: fixed; bottom: 20px; right: 20px; background: #1d4ed8; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; }
                @media print { .print-btn { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-left">
                    <strong>REPUBLIQUE DU SENEGAL</strong><br/>
                    Un Peuple-Un But-Une Foi<br/>
                    Ministère de l'Enseignement supérieur,<br/>
                    de la Recherche et de l'Innovation<br/><br/>
                    <strong>UNIVERSITE ALIOUNE DIOP</strong><br/>
                    <em>« L'excellence est ma constance, l'éthique ma vertu »</em>
                </div>
                <div class="header-right">
                    <strong>N° ______ UAD/R/SG/DRH</strong><br/><br/>
                    Bambey, le ${dateDepart}
                </div>
            </div>
            <div class="institution">RECTORAT<br/>SECRETARIAT GENERAL<br/><span style="font-size:11px;font-weight:normal">DDrm</span></div>
            <div style="text-align:right;font-size:12px;margin-top:5px;">Le Secrétaire général</div>
            <div class="divider"></div>
            <div class="title">ORDRE DE MISSION</div>
            <div class="field"><span class="field-label">Monsieur :</span><span class="field-line">${ordre.chauffeur_prenom || ''} ${ordre.chauffeur_nom || ''}</span></div>
            <div class="field"><span class="field-label">De nationalité :</span><span class="field-line">${ordre.nationalite || 'Sénégalais(e)'}</span></div>
            <div class="field"><span class="field-label">Grade et fonction :</span><span class="field-line">${ordre.grade_fonction || 'Chauffeur'}</span></div>
            <div class="field"><span class="field-label">Se rend à :</span><span class="field-line">${ordre.destination || ''}</span></div>
            <div class="field"><span class="field-label">Objet de la mission :</span><span class="field-line">${ordre.objet_mission || "conduit la navette de l'UAD"}</span></div>
            <div class="field"><span class="field-label">Moyen de transport :</span><span class="field-line">${ordre.moyen_transport || ordre.vehicule?.immatriculation || '___________'}</span></div>
            <div class="field"><span class="field-label">Date de départ :</span><span class="field-line">${dateDepart}</span></div>
            <div class="field"><span class="field-label">Date de retour :</span><span class="field-line">${dateRetour}</span></div>
            <div class="field"><span class="field-label">Frais de transport :</span><span class="field-line">${ordre.frais_transport || 'Appui en carburant'}</span></div>
            <div class="field"><span class="field-label">Indemnité de déplacement :</span><span class="field-line">${ordre.indemnite_deplacement || 'Néant'}</span></div>
            <div class="mention">Les autorités civiles et militaires des localités traversées sont priées de faciliter à <strong>Monsieur ${ordre.chauffeur_prenom || ''} ${ordre.chauffeur_nom || ''}</strong> l'accomplissement de son voyage.</div>
            <div class="signature-section"><div class="signature-box">Le Secrétaire Général<br/><br/><br/><br/><strong>${ordre.sgDrh?.prenom || ''} ${ordre.sgDrh?.nom || ''}</strong></div></div>
            <div class="ampliations"><strong>Ampliations :</strong><br/>- CM/DDL/DRH.<br/>- Intéressé/Chrono.</div>
            <div class="footer">Tél. : (221) 33 973 30 86. // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)<br/>Internet : www.uadb.edu.sn // Courriel : rectorat@uadb.edu.sn</div>
            <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>
        </body>
        </html>`

        const win = window.open('', '_blank')
        win.document.write(html)
        win.document.close()
    }

    const toutSelectionne = historique.length > 0 && historique.every(o => selected.includes(o.id))

    const renderOrdre = (ordre, estHistorique = false) => {
        const statut = statutConfig[ordre.statut] || statutConfig['en_attente_drh']
        const Icon = statut.icon
        const peutModifier = ordre.statut === 'en_attente_drh'

        return (
            <div key={ordre.id} className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition ${estHistorique && selected.includes(ordre.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                        {/* Checkbox historique */}
                        {estHistorique && (
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

                <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                        onClick={() => voirOrdre(ordre)}
                        className="flex items-center gap-1.5 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-50 transition"
                    >
                        <FileText size={14} />
                        Voir l'ordre
                    </button>

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

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : onglet === 'attente' ? (
                    enAttente.length === 0 ? (
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
                            {enAttente.map(ordre => renderOrdre(ordre, false))}
                        </div>
                    )
                ) : (
                    historique.length === 0 ? (
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

                            {historique.map(ordre => renderOrdre(ordre, true))}
                        </div>
                    )
                )}
            </div>
        </Layout>
    )
}