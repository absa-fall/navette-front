import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Bus, Plus, Edit, Trash2, X, Check, QrCode, Printer } from 'lucide-react'
import QRCode from 'react-qr-code'

const etatConfig = {
    disponible: 'bg-green-100 text-green-700',
    en_service: 'bg-blue-100 text-blue-700',
    en_panne: 'bg-red-100 text-red-700',
}

const etatLabels = {
    disponible: 'Disponible',
    en_service: 'En service',
    en_panne: 'En panne',
}

export default function Vehicules() {
    const [vehicules, setVehicules] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [modalQR, setModalQR] = useState(null)
    const [editVehicule, setEditVehicule] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({
        immatriculation: '',
        capacite: '',
        etat: 'disponible',
        date_controle_technique: '',
    })

    useEffect(() => {
        chargerVehicules()
    }, [])

    const chargerVehicules = () => {
        api.get('/vehicules')
            .then(res => setVehicules(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const ouvrirModal = (vehicule = null) => {
        if (vehicule) {
            setEditVehicule(vehicule)
            setForm({
                immatriculation: vehicule.immatriculation,
                capacite: vehicule.capacite,
                etat: vehicule.etat,
                date_controle_technique: vehicule.date_controle_technique || '',
            })
        } else {
            setEditVehicule(null)
            setForm({
                immatriculation: '',
                capacite: '',
                etat: 'disponible',
                date_controle_technique: '',
            })
        }
        setError('')
        setModal(true)
    }

    const sauvegarder = async () => {
        if (!form.immatriculation || !form.capacite) {
            setError('Veuillez remplir les champs obligatoires')
            return
        }
        setActionLoading('save')
        setError('')
        try {
            if (editVehicule) {
                await api.put(`/vehicules/${editVehicule.id}`, form)
                setSuccess('Véhicule modifié avec succès')
            } else {
                await api.post('/vehicules', form)
                setSuccess('Véhicule ajouté avec succès')
            }
            setModal(false)
            chargerVehicules()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const supprimer = async (id) => {
        if (!window.confirm('Confirmer la suppression ?')) return
        setActionLoading(id)
        try {
            await api.delete(`/vehicules/${id}`)
            setSuccess('Véhicule supprimé')
            chargerVehicules()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur')
        } finally {
            setActionLoading(null)
        }
    }

    const imprimer = (vehicule) => {
        const html = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>QR Bus ${vehicule.immatriculation}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: white; padding: 32px; }
                    .card { border: 3px solid #1d4ed8; border-radius: 16px; padding: 32px; text-align: center; max-width: 400px; width: 100%; }
                    .logo { font-size: 22px; font-weight: 800; color: #1d4ed8; margin-bottom: 4px; }
                    .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
                    .qr { margin: 0 auto 24px; }
                    .immat { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
                    .capacite { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
                    .instructions { background: #eff6ff; border-radius: 8px; padding: 12px; font-size: 12px; color: #1d4ed8; text-align: left; }
                    @media print { body { padding: 0; } }
                </style>
                <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
            </head>
            <body>
                <div class="card">
                    <div class="logo">UADB Mobilité</div>
                    <div class="subtitle">Scanner pour valider votre montée</div>
                    <div class="qr" id="qr"></div>
                    <div class="immat">${vehicule.immatriculation}</div>
                    <div class="capacite">Capacité : ${vehicule.capacite} places</div>
                    <div class="instructions">
                        📱 Scannez ce QR avec l'application UADB Mobilité pour valider votre présence dans le bus.
                    </div>
                </div>
                <script>
                    QRCode.toCanvas(document.createElement('canvas'), '${vehicule.qr_code}', { width: 220 }, function(err, canvas) {
                        if (!err) document.getElementById('qr').appendChild(canvas);
                        setTimeout(() => window.print(), 500);
                    });
                </script>
            </body>
            </html>
        `
        const win = window.open('', '_blank')
        win.document.write(html)
        win.document.close()
    }

    return (
        <Layout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des véhicules</h1>
                        <p className="text-gray-500 text-sm mt-1">{vehicules.length} véhicule(s)</p>
                    </div>
                    <button
                        onClick={() => ouvrirModal()}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                        <Plus size={18} />
                        Ajouter
                    </button>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                        <Check size={16} /> {success}
                    </div>
                )}

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : vehicules.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bus size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun véhicule</h3>
                        <p className="text-gray-400 text-sm mb-5">Ajoutez des véhicules pour commencer</p>
                        <button
                            onClick={() => ouvrirModal()}
                            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
                        >
                            Ajouter un véhicule
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicules.map(vehicule => (
                            <div key={vehicule.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-blue-100 p-3 rounded-xl">
                                        <Bus size={22} className="text-blue-700" />
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${etatConfig[vehicule.etat]}`}>
                                        {etatLabels[vehicule.etat]}
                                    </span>
                                </div>

                                <p className="font-bold text-gray-800 text-lg">{vehicule.immatriculation}</p>
                                <p className="text-sm text-gray-500 mt-1">Capacité : {vehicule.capacite} places</p>
                                {vehicule.date_controle_technique && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Contrôle : {new Date(vehicule.date_controle_technique).toLocaleDateString('fr-FR')}
                                    </p>
                                )}

                                {/* Boutons actions */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => ouvrirModal(vehicule)}
                                        className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-700 py-2 rounded-xl text-xs font-semibold hover:bg-blue-50 transition"
                                    >
                                        <Edit size={13} />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => supprimer(vehicule.id)}
                                        disabled={actionLoading === vehicule.id}
                                        className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                                    >
                                        {actionLoading === vehicule.id
                                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                            : <Trash2 size={13} />
                                        }
                                        Supprimer
                                    </button>
                                </div>

                                {/* Bouton QR */}
                                {vehicule.qr_code && (
                                    <button
                                        onClick={() => setModalQR(vehicule)}
                                        className="w-full mt-2 flex items-center justify-center gap-1.5 border border-green-200 text-green-700 py-2 rounded-xl text-xs font-semibold hover:bg-green-50 transition"
                                    >
                                        <QrCode size={13} />
                                        Voir QR du bus
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal QR */}
            {modalQR && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">
                                QR — {modalQR.immatriculation}
                            </h2>
                            <button onClick={() => setModalQR(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm mb-4">
                            Imprimez et collez ce QR dans le bus
                        </p>

                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                <QRCode value={modalQR.qr_code} size={180} level="H" />
                            </div>
                        </div>

                        <p className="font-mono text-sm font-bold text-gray-600 tracking-widest mb-5">
                            {modalQR.qr_code}
                        </p>

                        <button
                            onClick={() => imprimer(modalQR)}
                            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition"
                        >
                            <Printer size={16} />
                            Imprimer le QR
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Ajouter/Modifier */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editVehicule ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
                            </h2>
                            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Immatriculation *
                                </label>
                                <input
                                    type="text"
                                    value={form.immatriculation}
                                    onChange={e => setForm({ ...form, immatriculation: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: DK 1234 AB"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacité (places) *
                                </label>
                                <input
                                    type="number"
                                    value={form.capacite}
                                    onChange={e => setForm({ ...form, capacite: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 20"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
                                <select
                                    value={form.etat}
                                    onChange={e => setForm({ ...form, etat: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="disponible">Disponible</option>
                                    <option value="en_service">En service</option>
                                    <option value="en_panne">En panne</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date contrôle technique
                                </label>
                                <input
                                    type="date"
                                    value={form.date_controle_technique}
                                    onChange={e => setForm({ ...form, date_controle_technique: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setModal(false)}
                                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={sauvegarder}
                                disabled={actionLoading === 'save'}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading === 'save' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {editVehicule ? 'Modifier' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}