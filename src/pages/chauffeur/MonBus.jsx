import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { Bus, QrCode, Printer, CheckCircle } from 'lucide-react'
import QRCode from 'react-qr-code'
import SuiviGPS from '../../components/SuiviGPS'
export default function MonBus() {
    const navigate = useNavigate()
    const [vehicules, setVehicules] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        const fetchVehicules = async () => {
            try {
                const res = await api.get('/vehicules')
                setVehicules(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchVehicules()
    }, [])

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
                    svg { display: block; }
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mon bus</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Sélectionnez votre bus et imprimez le QR code à coller dans le véhicule
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : vehicules.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Bus size={40} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun véhicule disponible</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {vehicules.map(v => (
                            <div key={v.id}
                                className={`bg-white rounded-2xl border shadow-sm p-5 transition cursor-pointer ${
                                    selected?.id === v.id
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-gray-100 hover:border-blue-300'
                                }`}
                                onClick={() => setSelected(selected?.id === v.id ? null : v)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <Bus size={20} className="text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{v.immatriculation}</p>
                                            <p className="text-xs text-gray-500">{v.capacite} places · {v.etat}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selected?.id === v.id && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                                <CheckCircle size={12} /> Sélectionné
                                            </span>
                                        )}
                                        <QrCode size={18} className="text-gray-400" />
                                    </div>
                                </div>

                                     {/* QR Code affiché si sélectionné */}
{selected?.id === v.id && (
    <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="mb-4">
            <SuiviGPS vehiculeId={v.id} />
        </div>
        <div className="flex flex-col items-center gap-4">
            {v.qr_code ? (
                <>
                    <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                        <QRCode
                            value={v.qr_code}
                            size={180}
                            level="H"
                        />
                    </div>
                    <p className="font-mono text-sm font-bold text-gray-600 tracking-widest">
                        {v.qr_code}
                    </p>
                    <button
                        onClick={(e) => { e.stopPropagation(); imprimer(v) }}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
                    >
                        <Printer size={16} />
                        Imprimer le QR
                    </button>
                </>
            ) : (
                <p className="text-gray-400 text-sm">QR code non disponible</p>
            )}
        </div>
    </div>
)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}