import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Bus, CheckCircle, FileText, History, Truck, Trash2, ThumbsUp, XCircle } from 'lucide-react'

const SIGNATURE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 160" width="220" height="160">
  <circle cx="90" cy="80" r="60" fill="none" stroke="#1a3a8f" stroke-width="2.5"/>
  <circle cx="90" cy="80" r="54" fill="none" stroke="#1a3a8f" stroke-width="1"/>
  <path id="arcHaut" d="M 40,80 A 50,50 0 0,1 140,80" fill="none"/>
  <text font-family="Times New Roman, serif" font-size="7.5" fill="#1a3a8f" font-weight="bold">
    <textPath href="#arcHaut" startOffset="5%">UNIVERSITE ALIOUNE DIOP</textPath>
  </text>
  <path id="arcBas" d="M 38,88 A 52,52 0 0,0 142,88" fill="none"/>
  <text font-family="Times New Roman, serif" font-size="8" fill="#1a3a8f" font-weight="bold">
    <textPath href="#arcBas" startOffset="28%">U . A . D</textPath>
  </text>
  <text x="90" y="72" text-anchor="middle" font-family="Times New Roman, serif" font-size="7" fill="#1a3a8f">Le Secrétaire</text>
  <text x="90" y="83" text-anchor="middle" font-family="Times New Roman, serif" font-size="7" fill="#1a3a8f">général</text>
  <text x="46" y="118" font-size="7" fill="#1a3a8f">★</text>
  <text x="128" y="118" font-size="7" fill="#1a3a8f">★</text>
  <g transform="translate(50, 40)" stroke="#1a3a8f" stroke-width="1.4" fill="none" opacity="0.9">
    <path d="M 5,45 C 15,30 25,25 35,32 C 42,37 38,48 30,50 C 22,52 18,44 25,40 C 32,36 45,38 55,30 C 65,22 70,28 68,38 C 66,46 58,50 52,48"/>
    <path d="M 52,48 C 60,46 72,42 80,35"/>
    <line x1="5" y1="55" x2="80" y2="55" stroke-width="0.8" opacity="0.4"/>
  </g>
  <rect x="130" y="100" width="82" height="32" rx="3" fill="none" stroke="#1a3a8f" stroke-width="1.5"/>
  <text x="171" y="113" text-anchor="middle" font-family="Times New Roman, serif" font-size="7" fill="#1a3a8f" font-weight="bold">M. Hammadou</text>
  <text x="171" y="124" text-anchor="middle" font-family="Times New Roman, serif" font-size="8" fill="#1a3a8f" font-weight="bold">BALDÉ</text>
</svg>`

const SIGNATURE_BASE64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(SIGNATURE_SVG)))}`
const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
    autres: 'Autres',
}

export default function MesTrajets() {
    const [searchParams] = useSearchParams()
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

    const voirOrdre = (ordre) => {
        const dateDepart = new Date(ordre.date_depart).toLocaleDateString('fr-FR')
        const dateRetour = ordre.date_retour ? new Date(ordre.date_retour).toLocaleDateString('fr-FR') : '___________'
        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Ordre de Mission</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Times New Roman',serif;font-size:13px;padding:40px;color:#000;}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;}.header-left{font-size:11px;line-height:1.6;}.header-right{text-align:right;font-size:12px;}.institution{text-align:center;font-weight:bold;font-size:12px;margin-top:5px;line-height:1.5;}.divider{border-top:1px solid #000;margin:10px 0;}.title{text-align:center;font-size:16px;font-weight:bold;text-decoration:underline;margin:20px 0 25px;letter-spacing:1px;}.field{display:flex;align-items:baseline;margin-bottom:14px;}.field-label{min-width:200px;font-size:13px;}.field-line{flex:1;border-bottom:1px solid #000;padding-bottom:2px;padding-left:8px;font-size:13px;font-weight:bold;}.mention{margin-top:30px;font-size:12px;line-height:1.8;}.signature-section{display:flex;justify-content:flex-end;margin-top:30px;}.signature-box{text-align:center;font-size:12px;}.ampliations{margin-top:50px;font-size:11px;}.footer{margin-top:40px;border-top:1px solid #000;padding-top:8px;text-align:center;font-size:10px;}.print-btn{position:fixed;bottom:20px;right:20px;background:#1d4ed8;color:white;border:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:bold;cursor:pointer;}@media print{.print-btn{display:none;}}</style></head><body><div class="header"><div class="header-left"><strong>REPUBLIQUE DU SENEGAL</strong><br/>Un Peuple-Un But-Une Foi<br/>Ministère de l'Enseignement supérieur,<br/>de la Recherche et de l'Innovation<br/><br/><strong>UNIVERSITE ALIOUNE DIOP</strong><br/><em>« L'excellence est ma constance, l'éthique ma vertu »</em></div><div class="header-right"><strong>N° ______ UAD/R/SG/DRH</strong><br/><br/>Bambey, le ${dateDepart}</div></div><div class="institution">RECTORAT<br/>SECRETARIAT GENERAL<br/><span style="font-size:11px;font-weight:normal">DDrm</span></div><div style="text-align:right;font-size:12px;margin-top:5px;">Le Secrétaire général</div><div class="divider"></div><div class="title">ORDRE DE MISSION</div><div class="field"><span class="field-label">Monsieur :</span><span class="field-line">${ordre.chauffeur_prenom||''} ${ordre.chauffeur_nom||''}</span></div><div class="field"><span class="field-label">De nationalité :</span><span class="field-line">${ordre.nationalite||'Sénégalaise'}</span></div><div class="field"><span class="field-label">Grade et fonction :</span><span class="field-line">${ordre.grade_fonction||'Chauffeur'}</span></div><div class="field"><span class="field-label">Se rend à :</span><span class="field-line">${ordre.destination||''}</span></div><div class="field"><span class="field-label">Objet de la mission :</span><span class="field-line">${ordre.objet_mission||"conduit la navette de l'UAD"}</span></div><div class="field"><span class="field-label">Moyen de transport :</span><span class="field-line">${ordre.moyen_transport||ordre.vehicule?.immatriculation||'___________'}</span></div><div class="field"><span class="field-label">Date de départ :</span><span class="field-line">${dateDepart}</span></div><div class="field"><span class="field-label">Date de retour :</span><span class="field-line">${dateRetour}</span></div><div class="field"><span class="field-label">Frais de transport :</span><span class="field-line">${ordre.frais_transport||'Appui en carburant'}</span></div><div class="field"><span class="field-label">Indemnité de déplacement :</span><span class="field-line">${ordre.indemnite_deplacement||'Néant'}</span></div><div class="mention">Les autorités civiles et militaires des localités traversées sont priées de faciliter à <strong>Monsieur ${ordre.chauffeur_prenom||''} ${ordre.chauffeur_nom||''}</strong> l'accomplissement de son voyage.</div>
        <div class="signature-section"><div class="signature-box">Le Secrétaire Général<img src="${SIGNATURE_BASE64}" alt="Signature" style="width:220px;height:160px;display:block;margin:8px auto 0;"/></div></div>
        <div class="ampliations"><strong>Ampliations :</strong><br/>- CM/DDL/DRH.<br/>- Intéressé/Chrono.</div><div class="footer">Tél. : (221) 33 973 30 86. // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)<br/>Internet : www.uadb.edu.sn // Courriel : rectorat@uadb.edu.sn</div><button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button></body></html>`
        const win = window.open('', '_blank')
        win.document.write(html)
        win.document.close()
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

                {/* ✅ Modal refus */}
                {modalRefus.visible && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-red-100 p-2 rounded-xl">
                                    <XCircle size={20} className="text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">Refuser la mission</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Veuillez indiquer le motif du refus. Le DDL sera notifié.
                            </p>
                            <textarea
                                value={motifRefus}
                                onChange={e => { setMotifRefus(e.target.value); setMotifError('') }}
                                rows={4}
                                placeholder="Saisissez le motif du refus..."
                                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none ${motifError ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            {motifError && (
                                <p className="text-xs text-red-500 mt-1">{motifError}</p>
                            )}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={fermerModalRefus}
                                    className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmerRefus}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition text-sm"
                                >
                                    Confirmer le refus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                            <button onClick={() => voirOrdre(ordre)}
                                                className="flex items-center gap-2 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
                                                <FileText size={15} /> Voir l'ordre
                                            </button>

                                            {!estApprouve && (
                                                <>
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
                                                    {/* ✅ Bouton refus ouvre la modal */}
                                                    <button
                                                        onClick={() => ouvrirModalRefus(ordre.id)}
                                                        disabled={actionLoading === `refuser-${ordre.id}`}
                                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                                                    >
                                                        {actionLoading === `refuser-${ordre.id}`
                                                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            : <XCircle size={16} />}
                                                        Refuser
                                                    </button>
                                                </>
                                            )}

                                            {estApprouve ? (
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
                                        <button onClick={() => voirOrdre(ordre)}
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