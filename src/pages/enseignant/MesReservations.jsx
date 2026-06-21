import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import QRCode from 'react-qr-code'
import { Bus, ArrowLeft, Download, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'

export default function MesReservations() {
    const navigate = useNavigate()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState([])
    const [deleteLoading, setDeleteLoading] = useState(null)
    const [deleteSelectionLoading, setDeleteSelectionLoading] = useState(false)

    useEffect(() => { fetchReservations() }, [])

    const fetchReservations = () => {
        setLoading(true)
        api.get('/mes-reservations')
            .then(res => setReservations(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const telechargerQR = (qrCode) => {
        const svg = document.getElementById(`qr-${qrCode}`)
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 256, 256)
            ctx.drawImage(img, 0, 0, 256, 256)
            const a = document.createElement('a')
            a.href = canvas.toDataURL('image/png')
            a.download = `qr-navette-${qrCode}.png`
            a.click()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    const supprimerReservation = async (id) => {
        if (!confirm('Voulez-vous supprimer cette réservation ?')) return
        setDeleteLoading(id)
        try {
            await api.delete(`/mes-reservations/${id}`)
            setReservations(prev => prev.filter(r => r.id !== id))
            setSelected(prev => prev.filter(i => i !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression')
        } finally {
            setDeleteLoading(null)
        }
    }

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toutSelectionne = reservations.length > 0 && reservations.every(r => selected.includes(r.id))

    const toggleSelectAll = () => {
        if (toutSelectionne) setSelected([])
        else setSelected(reservations.map(r => r.id))
    }

    const supprimerSelection = async () => {
        if (selected.length === 0) return
        if (!confirm(`Supprimer ${selected.length} réservation(s) ?`)) return
        setDeleteSelectionLoading(true)
        try {
            await Promise.all(selected.map(id => api.delete(`/mes-reservations/${id}`)))
            setReservations(prev => prev.filter(r => !selected.includes(r.id)))
            setSelected([])
        } catch {
            alert('Erreur lors de la suppression')
        } finally {
            setDeleteSelectionLoading(false)
        }
    }

    const statutBadge = (statut) => {
        switch (statut) {
            case 'confirme': return { label: 'Confirmé', color: 'bg-green-100 text-green-700', Icon: CheckCircle }
            case 'refuse': return { label: 'Refusé', color: 'bg-red-100 text-red-700', Icon: XCircle }
            default: return { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', Icon: Clock }
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mes réservations</h1>
                        <p className="text-gray-500 text-sm mt-1">{reservations.length} réservation(s)</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Bus size={40} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-gray-700 font-semibold mb-2">Aucune réservation</h3>
                        <p className="text-gray-400 text-sm mb-5">Réservez votre première navette</p>
                        <button
                            onClick={() => navigate('/enseignant/reserver')}
                            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
                            Réserver
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={toutSelectionne} onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                Tout sélectionner ({reservations.length})
                            </label>
                            {selected.length > 0 && (
                                <button onClick={supprimerSelection} disabled={deleteSelectionLoading}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                    {deleteSelectionLoading
                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 size={14} />}
                                    Supprimer ({selected.length})
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {reservations.map(r => {
                                const { label, color, Icon } = statutBadge(r.statut)
                                return (
                                    <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                                        selected.includes(r.id) ? 'border-red-200 bg-red-50' : 'border-gray-100'
                                    }`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {r.ville_depart} → {r.ville_arrivee}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(r.date_reservation).toLocaleDateString('fr-FR')} à {r.heure_reservation}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${color}`}>
                                                    <Icon size={12} /> {label}
                                                </span>
                                                <button onClick={() => supprimerReservation(r.id)} disabled={deleteLoading === r.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                    {deleteLoading === r.id
                                                        ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                        : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                                <QRCode
                                                    id={`qr-${r.qr_code}`}
                                                    value={r.qr_code}
                                                    size={160}
                                                    level="H"
                                                    fgColor="#1e3a8a"
                                                />
                                            </div>
                                            <p className="font-mono text-sm font-bold text-blue-700 tracking-widest">
                                                {r.qr_code}
                                            </p>
                                            <button
                                                onClick={() => telechargerQR(r.qr_code)}
                                                className="flex items-center gap-2 border border-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition text-sm"
                                            >
                                                <Download size={14} /> Télécharger QR
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}