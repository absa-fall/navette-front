import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import api from '../../api/axios'
import { QrCode, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function ScannerPassager() {
   const navigate = useNavigate()
   const [result, setResult] = useState(null)
   const [error, setError] = useState(null)
   const [loading, setLoading] = useState(false)
   const [scanned, setScanned] = useState(false)
   const scannerRef = useRef(null)

   const startScanner = () => {
       const scanner = new Html5QrcodeScanner('qr-reader-chauffeur', {
           fps: 10,
           qrbox: { width: 200, height: 200 },
           aspectRatio: 1.0,
       }, false)

       scanner.render(async (decodedText) => {
           if (scanned) return
           setScanned(true)
           scanner.clear()
           setLoading(true)
           setError(null)

           try {
               const res = await api.post('/scan/passager', {
                   qr_code_passager: decodedText
               })
               setResult(res.data)
           } catch (err) {
               setError(err.response?.data?.message || 'QR code invalide ou aucune réservation trouvée')
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

   const reset = () => {
       setResult(null)
       setError(null)
       setScanned(false)
       setTimeout(() => startScanner(), 300)
   }

   return (
       <div className="min-h-screen bg-gray-50">
           <div className="bg-blue-700 text-white p-4">
               <div className="max-w-lg mx-auto flex items-center gap-3">
                   <button onClick={() => navigate(-1)}
                       className="p-2 hover:bg-white/20 rounded-lg transition">
                       <ArrowLeft size={20} />
                   </button>
                   <div className="flex items-center gap-2">
                       <QrCode size={22} />
                       <span className="font-bold text-lg">Scanner un passager</span>
                   </div>
               </div>
           </div>

           <div className="max-w-lg mx-auto p-6">
               {!result ? (
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                       <p className="text-gray-500 text-sm text-center mb-6">
                           Scannez le QR code du passager pour valider sa montée
                       </p>

                       {loading ? (
                           <div className="flex flex-col items-center py-12 gap-4">
                               <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                               <p className="text-gray-500 text-sm">Validation en cours...</p>
                           </div>
                       ) : (
                           <div id="qr-reader-chauffeur" className="w-full max-w-xs mx-auto" />
                       )}

                       {error && (
                           <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                               <AlertCircle size={16} />
                               {error}
                               <button onClick={reset} className="ml-auto underline text-xs">
                                   Réessayer
                               </button>
                           </div>
                       )}
                   </div>
               ) : (
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                       <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CheckCircle size={40} className="text-green-600" />
                       </div>
                       <h2 className="text-xl font-bold text-green-700 mb-2">Passager validé !</h2>
                       <p className="text-gray-800 font-semibold text-lg mb-1">{result.passager}</p>
                       <p className="text-gray-500 text-sm mb-6">{result.message}</p>

                       <button onClick={reset}
                           className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2 mx-auto">
                           <RefreshCw size={16} />
                           Scanner un autre passager
                       </button>
                   </div>
               )}
           </div>
       </div>
   )
}