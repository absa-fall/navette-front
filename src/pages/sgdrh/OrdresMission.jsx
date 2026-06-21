import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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

// Signature électronique SVG du SG/DRH — M. Hammadou BALDÉ
// Reproduit fidèlement : cachet rond UAD + signature manuscrite + tampon nom
const SIGNATURE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 160" width="220" height="160">
  <!-- Cachet rond Université Alioune Diop -->
  <circle cx="90" cy="80" r="60" fill="none" stroke="#1a3a8f" stroke-width="2.5"/>
  <circle cx="90" cy="80" r="54" fill="none" stroke="#1a3a8f" stroke-width="1"/>

  <!-- Texte circulaire haut : UNIVERSITE ALIOUNE DIOP -->
  <path id="arcHaut" d="M 40,80 A 50,50 0 0,1 140,80" fill="none"/>
  <text font-family="Times New Roman, serif" font-size="7.5" fill="#1a3a8f" font-weight="bold">
    <textPath href="#arcHaut" startOffset="5%">UNIVERSITE ALIOUNE DIOP</textPath>
  </text>

  <!-- Texte circulaire bas : U . A . D -->
  <path id="arcBas" d="M 38,88 A 52,52 0 0,0 142,88" fill="none"/>
  <text font-family="Times New Roman, serif" font-size="8" fill="#1a3a8f" font-weight="bold">
    <textPath href="#arcBas" startOffset="28%">U . A . D</textPath>
  </text>

  <!-- Texte centre -->
  <text x="90" y="72" text-anchor="middle" font-family="Times New Roman, serif" font-size="7" fill="#1a3a8f">Le Secrétaire</text>
  <text x="90" y="83" text-anchor="middle" font-family="Times New Roman, serif" font-size="7" fill="#1a3a8f">général</text>

  <!-- Étoiles décoratives -->
  <text x="46" y="118" font-size="7" fill="#1a3a8f">★</text>
  <text x="128" y="118" font-size="7" fill="#1a3a8f">★</text>

  <!-- Signature manuscrite stylisée de M. Hammadou BALDÉ -->
  <g transform="translate(50, 40)" stroke="#1a3a8f" stroke-width="1.4" fill="none" opacity="0.9">
    <!-- Courbe principale de la signature -->
    <path d="M 5,45 C 15,30 25,25 35,32 C 42,37 38,48 30,50 C 22,52 18,44 25,40 C 32,36 45,38 55,30 C 65,22 70,28 68,38 C 66,46 58,50 52,48"/>
    <path d="M 52,48 C 60,46 72,42 80,35"/>
    <!-- Trait bas signature -->
    <line x1="5" y1="55" x2="80" y2="55" stroke-width="0.8" opacity="0.4"/>
  </g>

  <!-- Tampon rectangulaire nom -->
  <rect x="130" y="100" width="82" height="32" rx="3" fill="none" stroke="#1a3a8f" stroke-width="1.5"/>
  <text x="171" y="113" text-anchor="middle" font-family="Times New Roman, serif" font-size="7" fill="#1a3a8f" font-weight="bold">M. Hammadou</text>
  <text x="171" y="124" text-anchor="middle" font-family="Times New Roman, serif" font-size="8" fill="#1a3a8f" font-weight="bold">BALDÉ</text>
</svg>
`

const SIGNATURE_BASE64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(SIGNATURE_SVG)))}`

export default function SGDRHOrdres() {
    const [searchParams] = useSearchParams()
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
    const voirOrdre = (ordre) => {
        const dateDepart = new Date(ordre.date_depart).toLocaleDateString('fr-FR')
        const dateRetour = ordre.date_retour
            ? new Date(ordre.date_retour).toLocaleDateString('fr-FR')
            : '___________'

        // Signature SVG encodée en base64 pour l'embarquer dans le HTML imprimable
        const signatureSrc = SIGNATURE_BASE64

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
                .signature-section { display: flex; justify-content: flex-end; margin-top: 20px; }
                .signature-box { text-align: center; font-size: 12px; }
                .signature-box img { width: 220px; height: 160px; display: block; margin: 8px auto 0; }
                .ampliations { margin-top: 40px; font-size: 11px; }
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
            <div class="mention">
                Les autorités civiles et militaires des localités traversées sont priées de faciliter à
                <strong>Monsieur ${ordre.chauffeur_prenom || ''} ${ordre.chauffeur_nom || ''}</strong> l'accomplissement de son voyage.
            </div>
            <div class="signature-section">
                <div class="signature-box">
                    Le Secrétaire Général
                    <img src="${signatureSrc}" alt="Signature SG/DRH" />
                </div>
            </div>
            <div class="ampliations"><strong>Ampliations :</strong><br/>- CM/DDL/DRH.<br/>- Intéressé/Chrono.</div>
            <div class="footer">Tél. : (221) 33 973 30 86. // Fax : (221) 33 973 30 93 // B.P. : 30 – Bambey (République du Sénégal)<br/>Internet : www.uadb.edu.sn // Courriel : rectorat@uadb.edu.sn</div>
            <button class="print-btn" onclick="window.print()">Imprimer / Sauvegarder PDF</button>
        </body>
        </html>`

        const win = window.open('', '_blank')
        win.document.write(html)
        win.document.close()
    }

    const toutSelectionne = historiqueFiltre().length > 0 && historiqueFiltre().every(o => selected.includes(o.id))

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
                        onClick={() => voirOrdre(ordre)}
                        className="flex items-center gap-2 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition"
                    >
                        <FileText size={15} />
                        Aperçu
                    </button>

                    {avecAction ? (
                        signerModal === ordre.id ? (
                            <>
                                <button
                                    onClick={() => setSignerModal(null)}
                                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => signer(ordre.id)}
                                    disabled={actionLoading === ordre.id}
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading === ordre.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    <Send size={14} />
                                    Confirmer
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setSignerModal(ordre.id)}
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