import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import api from '../../api/axios'
import { Bus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ScannerBus() {
    const navigate = useNavigate()
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [scanned, setScanned] = useState(false)
    const scannerRef = useRef(null)

    const startScanner = () => {
        const container = document.getElementById('qr-reader')
        if (container) container.innerHTML = ''

        const scanner = new Html5QrcodeScanner('qr-reader', {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        }, false)

        scanner.render(async (decodedText) => {
            if (scanned) return
            setScanned(true)
            scanner.clear().catch(() => {})
            setLoading(true)
            setError(null)

            try {
                const res = await api.post('/scan/bus', {
                    qr_code_bus: decodedText
                })
                setResult(res.data.message)
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors du scan')
                setScanned(false)
            } finally {
                setLoading(false)
            }
        }, () => {})

        scannerRef.current = scanner
    }

    useEffect(() => {
        let timer = null

        timer = setTimeout(() => {
            startScanner()
        }, 100)

        return () => {
            clearTimeout(timer)
            scannerRef.current?.clear().catch(() => {})
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-blue-700 text-white p-4">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/20 rounded-lg transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Bus size={22} />
                        <span className="font-bold text-lg">Scanner le QR du bus</span>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-6">
                {!result ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <p className="text-gray-500 text-sm text-center mb-6">
                            Pointez votre caméra vers le QR code affiché dans le bus
                        </p>

                        {loading ? (
                            <div className="flex flex-col items-center py-12 gap-4">
                                <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-500 text-sm">Validation en cours...</p>
                            </div>
                        ) : (
                            <div id="qr-reader" className="w-full" />
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-green-700 mb-2">Montée validée !</h2>
                        <p className="text-gray-500 text-sm mb-6">{result}</p>
                        <button onClick={() => navigate(-1)}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition">
                            Retour
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}