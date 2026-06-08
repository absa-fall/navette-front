import { useState } from 'react'
import validationService from '../../services/validationService'
import { Scan, CheckCircle, ArrowDown, RotateCcw, MapPin, Clock, User, CreditCard } from 'lucide-react'

export default function ValidationNavette() {
    const [step, setStep] = useState('scan')
    const [qrCode, setQrCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [presence, setPresence] = useState(null)
    const [error, setError] = useState('')

    const validerMontee = async () => {
        if (!qrCode.trim()) {
            setError('Veuillez entrer un code QR')
            return
        }

        setLoading(true)
        setError('')

        try {
            const data = await validationService.validerMontee(qrCode)
            setPresence(data.presence)
            setStep('montee')
        } catch (err) {
            setError(err.response?.data?.message || 'QR code invalide')
        } finally {
            setLoading(false)
        }
    }

    const validerDescente = async () => {
        setLoading(true)
        setError('')

        try {
            const data = await validationService.validerDescente(qrCode)
            setPresence(data.presence)
            setStep('success')
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation')
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setStep('scan')
        setQrCode('')
        setPresence(null)
        setError('')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="bg-blue-700 rounded-t-2xl p-6 text-white text-center">
                    <h1 className="text-xl font-bold">UADB Mobilité</h1>
                    <p className="text-sm opacity-80">Validation Navette</p>
                </div>

                <div className="bg-white rounded-b-2xl shadow-lg p-6">

                    {/* ETAPE 1 : Scan */}
                    {step === 'scan' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                                <Scan size={40} className="text-blue-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Scannez votre QR Code</h2>
                                <p className="text-sm text-gray-500 mt-1">Entrez le code de votre ordre de mission</p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={qrCode}
                                    onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                                    placeholder="Ex: QR-ABC12345"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-mono tracking-widest uppercase focus:border-blue-500 focus:outline-none"
                                />

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={validerMontee}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Validation...' : 'Valider la montée'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ETAPE 2 : Montee validee */}
                    {step === 'montee' && presence && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Montée confirmée !</h2>
                                <p className="text-sm text-gray-500">Bon voyage</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-left">
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-gray-400" />
                                    <div>
                                        <div className="text-xs text-gray-500">Trajet</div>
                                        <div className="text-sm font-semibold">
                                            {presence.registre?.ordre_mission?.ville_depart} → {presence.registre?.ordre_mission?.ville_arrivee}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-gray-400" />
                                    <div>
                                        <div className="text-xs text-gray-500">Heure</div>
                                        <div className="text-sm font-semibold">
                                            {new Date(presence.heure_montee).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User size={16} className="text-gray-400" />
                                    <div>
                                        <div className="text-xs text-gray-500">Passager</div>
                                        <div className="text-sm font-semibold">
                                            {presence.passager?.prenom} {presence.passager?.nom}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep('descente')}
                                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowDown size={18} />
                                Je suis arrivé à destination
                            </button>
                        </div>
                    )}

                    {/* ETAPE 3 : Descente */}
                    {step === 'descente' && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                                <ArrowDown size={32} className="text-orange-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Validation Descente</h2>
                                <p className="text-sm text-gray-500">Confirmez votre arrivée</p>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="text-xs text-blue-600 mb-1">Retenue estimée</div>
                                <div className="text-2xl font-bold text-blue-700">
                                    {presence?.montant_retenue > 0 
                                        ? `${presence.montant_retenue} FCFA` 
                                        : 'Gratuit'
                                    }
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={validerDescente}
                                disabled={loading}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Validation...' : 'Confirmer la descente'}
                            </button>
                        </div>
                    )}

                    {/* ETAPE 4 : Success */}
                    {step === 'success' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Trajet terminé !</h2>
                                <p className="text-sm text-gray-500">Votre descente a été enregistrée</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Retenue</span>
                                    <span className="text-sm font-bold text-orange-600">
                                        {presence?.montant_retenue > 0 
                                            ? `${presence.montant_retenue} FCFA` 
                                            : 'Gratuit'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Arrivée</span>
                                    <span className="text-sm font-semibold">
                                        {new Date(presence?.heure_descente).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={reset}
                                className="w-full py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={18} />
                                Nouvelle validation
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}