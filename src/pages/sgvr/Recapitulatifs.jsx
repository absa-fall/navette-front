import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { ClipboardList, Calendar, CheckCircle, AlertCircle, Loader, FileSpreadsheet, FileText } from 'lucide-react'

export default function Recapitulatifs() {
    const [recaps, setRecaps] = useState([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [debut, setDebut] = useState('')
    const [fin, setFin] = useState('')
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        fetchRecaps()
    }, [])

    const fetchRecaps = async () => {
        try {
            setLoading(true)
            const res = await api.get('/recapitulatifs')
            setRecaps(res.data)
        } catch (err) {
            setError('Erreur lors du chargement des récapitulatifs')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerer = async (e) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        setGenerating(true)

        try {
            const res = await api.post('/recapitulatifs/generer', {
                semaine_debut: debut,
                semaine_fin: fin
            })
            setMessage(res.data.message)
            fetchRecaps()
            setDebut('')
            setFin('')
        } catch (err) {
            console.error('Erreur:', err)
            if (err.response?.status === 404) {
                setError('Aucun registre trouvé pour cette période')
            } else if (err.response?.status === 422) {
                setError(err.response?.data?.message || 'Aucune réservation validée pour cette semaine')
            } else if (err.response?.status === 403) {
                setError('Accès refusé. Vérifiez vos permissions.')
            } else {
                setError(err.response?.data?.message || 'Erreur lors de la génération')
            }
        } finally {
            setGenerating(false)
        }
    }

    // ─── Export Excel ───────────────────────────────────────────────
    const exportExcel = async (recap) => {
        try {
            const res = await api.get(`/recapitulatifs/${recap.id}`)
            const { detail_par_personne } = res.data

            const BOM = '\uFEFF'
            const lignes = [
                ['RÉCAPITULATIF HEBDOMADAIRE - UADB MOBILITÉ'],
                [`Période : du ${new Date(recap.semaine_debut).toLocaleDateString('fr-FR')} au ${new Date(recap.semaine_fin).toLocaleDateString('fr-FR')}`],
                [`Généré le : ${new Date(recap.date_generation).toLocaleDateString('fr-FR')}`],
                [],
                ['Nom', 'Prénom', 'UFR', 'Type de profil', 'Catégorie', 'Nombre de trajets', 'Montant total (FCFA)'],
                ...detail_par_personne.map(p => [
                    p.nom,
                    p.prenom,
                    p.ufr || '-',
                    p.type_profil || '-',
                    p.categorie || '-',
                    p.nombre_trajets,
                    p.montant_total
                ]),
                [],
                ['', '', '', '', '', 'TOTAL GÉNÉRAL', recap.montant_total]
            ]

            const csvContent = BOM + lignes.map(row =>
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
            ).join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `recap_${recap.semaine_debut}_${recap.semaine_fin}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            alert("Erreur lors de l'export Excel")
        }
    }

    // ─── Export PDF ─────────────────────────────────────────────────
    const exportPDF = async (recap) => {
        try {
            const res = await api.get(`/recapitulatifs/${recap.id}`)
            const { detail_par_personne } = res.data

            const debutStr = new Date(recap.semaine_debut).toLocaleDateString('fr-FR')
            const finStr = new Date(recap.semaine_fin).toLocaleDateString('fr-FR')
            const genereStr = new Date(recap.date_generation).toLocaleDateString('fr-FR')

            const rows = detail_par_personne.map(p => `
                <tr>
                    <td>${p.nom}</td>
                    <td>${p.prenom}</td>
                    <td>${p.ufr || '-'}</td>
                    <td>${p.type_profil || '-'}</td>
                    <td>${p.categorie || '-'}</td>
                    <td style="text-align:center">${p.nombre_trajets}</td>
                    <td style="text-align:right;font-weight:600">${Number(p.montant_total).toLocaleString('fr-FR')} FCFA</td>
                </tr>
            `).join('')

            const html = `
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <title>Récapitulatif ${debutStr} - ${finStr}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 32px; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #1d4ed8; padding-bottom: 16px; }
                        .header-left h1 { font-size: 20px; font-weight: 700; color: #1d4ed8; }
                        .header-left p { font-size: 11px; color: #6b7280; margin-top: 4px; }
                        .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 700; background: ${recap.statut === 'valide' ? '#dcfce7' : '#fef9c3'}; color: ${recap.statut === 'valide' ? '#15803d' : '#854d0e'}; }
                        .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
                        .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
                        .meta-card .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                        .meta-card .value { font-size: 13px; font-weight: 600; color: #1a1a2e; }
                        table { width: 100%; border-collapse: collapse; }
                        thead tr { background: #1d4ed8; color: white; }
                        thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; }
                        tbody tr:nth-child(even) { background: #f8fafc; }
                        tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
                        .total-row { background: #1e3a5f !important; color: white; font-weight: 700; }
                        .total-row td { padding: 11px 12px; border: none; }
                        .footer { margin-top: 32px; font-size: 10px; color: #9ca3af; text-align: center; }
                        @media print { body { padding: 16px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="header-left">
                            <h1>UADB Mobilité</h1>
                            <p>Récapitulatif hebdomadaire des retenues navette</p>
                        </div>
                        <div><span class="badge">${recap.statut === 'valide' ? 'Validé' : 'Brouillon'}</span></div>
                    </div>

                    <div class="meta">
                        <div class="meta-card">
                            <div class="label">Période</div>
                            <div class="value">Du ${debutStr} au ${finStr}</div>
                        </div>
                        <div class="meta-card">
                            <div class="label">Date de génération</div>
                            <div class="value">${genereStr}</div>
                        </div>
                        <div class="meta-card">
                            <div class="label">Montant total</div>
                            <div class="value" style="color:#1d4ed8">${Number(recap.montant_total).toLocaleString('fr-FR')} FCFA</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Prénom</th>
                                <th>UFR</th>
                                <th>Type de profil</th>
                                <th>Catégorie</th>
                                <th style="text-align:center">Trajets</th>
                                <th style="text-align:right">Montant (FCFA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                            <tr class="total-row">
                                <td colspan="5">TOTAL GÉNÉRAL</td>
                                <td style="text-align:center">${detail_par_personne.reduce((s, p) => s + p.nombre_trajets, 0)}</td>
                                <td style="text-align:right">${Number(recap.montant_total).toLocaleString('fr-FR')} FCFA</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        Document généré automatiquement par UADB Mobilité — ${new Date().toLocaleString('fr-FR')}
                    </div>
                </body>
                </html>
            `

            const win = window.open('', '_blank')
            win.document.write(html)
            win.document.close()
            setTimeout(() => win.print(), 500)
        } catch (err) {
            alert("Erreur lors de l'export PDF")
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Récapitulatifs hebdomadaires</h1>
                    <p className="text-gray-500 text-sm mt-1">{recaps.length} récapitulatif(s)</p>
                </div>

                {/* Formulaire de génération */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-700" />
                        Générer un récapitulatif
                    </h2>

                    <form onSubmit={handleGenerer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Début de semaine</label>
                            <input
                                type="date"
                                value={debut}
                                onChange={(e) => setDebut(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fin de semaine</label>
                            <input
                                type="date"
                                value={fin}
                                onChange={(e) => setFin(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={generating}
                            className="px-6 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <ClipboardList size={16} />
                                    Générer
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 text-sm">
                            <CheckCircle size={16} />
                            {message}
                        </div>
                    )}
                </div>

                {/* Liste des récapitulatifs */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recaps.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun récapitulatif</h3>
                        <p className="text-gray-400 text-sm">Générez votre premier récapitulatif ci-dessus</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recaps.map(recap => (
                            <div key={recap.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Semaine du {new Date(recap.semaine_debut).toLocaleDateString('fr-FR')} au {new Date(recap.semaine_fin).toLocaleDateString('fr-FR')}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Généré le {new Date(recap.date_generation).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button
                                            onClick={() => exportExcel(recap)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition"
                                        >
                                            <FileSpreadsheet size={15} />
                                            Excel
                                        </button>

                                        <button
                                            onClick={() => exportPDF(recap)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition"
                                        >
                                            <FileText size={15} />
                                            PDF
                                        </button>

                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                                                recap.statut === 'valide'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {recap.statut === 'valide' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                {recap.statut === 'valide' ? 'Validé' : 'Brouillon'}
                                            </span>
                                            <p className="text-lg font-bold text-gray-800 mt-1">
                                                {Number(recap.montant_total).toLocaleString()} FCFA
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}