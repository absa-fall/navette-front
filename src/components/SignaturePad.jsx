import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { PenLine, Check, Trash2, X } from 'lucide-react'

export default function SignaturePad({ storageKey, label = 'Signature', onSaved, readOnly = false, initialValue = null }) {
    const sigRef = useRef(null)
    const [signatureSauvegardee, setSignatureSauvegardee] = useState(initialValue)
    const [modalOuvert, setModalOuvert] = useState(false)

    useEffect(() => {
    if (initialValue && typeof initialValue === 'string' && initialValue.startsWith('data:image')) {
        setSignatureSauvegardee(initialValue)
        return
    }
    const saved = localStorage.getItem(storageKey)
    if (saved && saved.startsWith('data:image')) {
        setSignatureSauvegardee(saved)
        // Correctif : prevenir le parent meme quand la signature vient du
        // localStorage (et pas seulement quand on vient de dessiner), sinon
        // un parent qui attend onSaved pour activer un bouton reste bloque.
        onSaved?.(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [storageKey, initialValue])

    const sauvegarder = () => {
        if (sigRef.current.isEmpty()) return
        const dataUrl = sigRef.current.getCanvas().toDataURL('image/png')
        localStorage.setItem(storageKey, dataUrl)
        setSignatureSauvegardee(dataUrl)
        setModalOuvert(false)
        onSaved?.(dataUrl)
    }

    const effacer = () => {
        sigRef.current.clear()
    }

    const supprimerSignatureSauvegardee = () => {
        localStorage.removeItem(storageKey)
        setSignatureSauvegardee(null)
        onSaved?.(null)
    }

    return (
        <>
            <div className="text-center text-[12px]">
                <p className="font-bold">{label.toUpperCase()}</p>
               <div className="h-20 flex items-end justify-center">
    {signatureSauvegardee && typeof signatureSauvegardee === 'string' && signatureSauvegardee.startsWith('data:image') ?  (
        <img src={signatureSauvegardee} alt="Signature" className="h-16 object-contain" />
    ) : (
        <p className="text-gray-300 text-xs">………………………………</p>
    )}
</div>

                {!readOnly && (
                    <div className="print:hidden flex items-center justify-center gap-2 mt-2">
                        <button type="button" onClick={() => setModalOuvert(true)}
                            className="flex items-center gap-1.5 text-xs border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold transition">
                            <PenLine size={13} /> {signatureSauvegardee ? 'Modifier la signature' : 'Signer'}
                        </button>
                        {signatureSauvegardee && (
                            <button type="button" onClick={supprimerSignatureSauvegardee}
                                className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition">
                                <Trash2 size={13} /> Supprimer
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!readOnly && modalOuvert && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Dessinez votre signature</h3>
                            <button onClick={() => setModalOuvert(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                            <SignatureCanvas
                                ref={sigRef}
                                penColor="black"
                                canvasProps={{ width: 380, height: 180, className: 'bg-white' }}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={effacer}
                                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                <Trash2 size={14} /> Effacer
                            </button>
                            <button type="button" onClick={sauvegarder}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                                <Check size={14} /> Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}