import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { MapPin, Calendar, FileText, CheckCircle, Bus, User, Fuel, DollarSign, Pencil, Send } from 'lucide-react'

export default function NouvelleNavette() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        chauffeur_id: '',
        chauffeur_nom: '',
        chauffeur_prenom: '',
        nationalite: 'Sénégalais(e)',
        grade_fonction: 'Chauffeur',
        destination: '',
        objet_mission: 'conduit la navette de l\'UAD',
        moyen_transport: '',
        vehicule_id: '',
        date_depart: '',
        date_retour: '',
        frais_transport: 'Appui en carburant',
        indemnite_deplacement: 'Néant',
        trajet: '',
        trajet_autre: '',
        motif: '',
    })
    const [chauffeurs, setChauffeurs] = useState([])
    const [vehicules, setVehicules] = useState([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // NOUVEAU : gestion des étapes
    // 'form'    -> saisie/édition
    // 'preview' -> aperçu de l'ordre avant transmission
    const [step, setStep] = useState('form')
    const [draftId, setDraftId] = useState(null)

    useEffect(() => {
        Promise.all([
            api.get('/chauffeurs'),
            api.get('/vehicules/disponibles'),
        ]).then(([chauffeursRes, vehiculesRes]) => {
            setChauffeurs(chauffeursRes.data)
            setVehicules(vehiculesRes.data)
        }).catch(() => {})
    }, [])

    const handleChauffeurChange = (e) => {
        const chauffeurId = e.target.value
        const selectedChauffeur = chauffeurs.find(c => c.id === parseInt(chauffeurId))
        setForm(prev => ({
            ...prev,
            chauffeur_id: chauffeurId,
            chauffeur_nom: selectedChauffeur?.nom || '',
            chauffeur_prenom: selectedChauffeur?.prenom || '',
            nationalite: selectedChauffeur?.nationalite || 'Sénégalaise',
            grade_fonction: selectedChauffeur?.grade_fonction || 'Chauffeur',
        }))
    }

    const handleVehiculeChange = (e) => {
        const vehiculeId = e.target.value
        const selectedVehicule = vehicules.find(v => v.id === parseInt(vehiculeId))
        setForm(prev => ({
            ...prev,
            vehicule_id: vehiculeId,
            moyen_transport: selectedVehicule?.immatriculation || '',
        }))
    }

    const buildPayload = () => ({
        chauffeur_id: form.chauffeur_id,
        chauffeur_nom: form.chauffeur_nom,
        chauffeur_prenom: form.chauffeur_prenom,
        nationalite: form.nationalite,
        grade_fonction: form.grade_fonction,
        destination: form.destination,
        objet_mission: form.objet_mission,
        moyen_transport: form.moyen_transport,
        vehicule_id: form.vehicule_id || null,
        date_depart: form.date_depart,
        date_retour: form.date_retour,
        frais_transport: form.frais_transport,
        indemnite_deplacement: form.indemnite_deplacement,
        trajet: form.trajet,
        trajet_autre: form.trajet === 'autres' ? form.trajet_autre : null,
        motif: form.motif,
    })

    // ÉTAPE 1 : Enregistrer en brouillon (crée si nouveau, met à jour si déjà enregistré)
    const handleSave = async () => {
        if (!form.chauffeur_id || !form.destination || !form.date_retour || !form.motif.trim()) {
            setError('Veuillez remplir tous les champs obligatoires, y compris le motif')
            return
        }

        setLoading(true)
        setError('')
        try {
            const data = { ...buildPayload(), statut: 'brouillon' }
            if (draftId) {
                await api.put(`/ordres-mission/${draftId}`, data)
            } else {
                const res = await api.post('/ordres-mission', data)
setDraftId(res.data.ordre.id)   
            }
            setStep('preview')
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement")
        } finally {
            setLoading(false)
        }
    }

    // ÉTAPE 3 : Transmettre au DRH (seulement ici la notification part)
    const handleTransmit = async () => {
        setLoading(true)
        setError('')
        try {
            await api.post(`/ordres-mission/${draftId}/transmettre`)
            setSuccess(true)
            setTimeout(() => navigate('/ddl/navettes'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la transmission')
        } finally {
            setLoading(false)
        }
    }

    const chauffeurLabel = `${form.chauffeur_prenom} ${form.chauffeur_nom}`.trim() || '—'
    const trajetLabel = form.trajet === 'autres' ? form.trajet_autre : {
        dakar_bambey: 'Dakar → Bambey',
        thies_bambey: 'Thiès → Bambey',
        bambey_ngouniane: 'Bambey → Ngouniane',
    }[form.trajet] || '—'

    if (success) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-green-100 p-5 rounded-full mb-4">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Demande transmise !</h2>
                    <p className="text-gray-500">Votre demande a été transmise au DRH.</p>
                </div>
            </Layout>
        )
    }

    // ÉTAPE 2 : Aperçu / modification avant transmission
    if (step === 'preview') {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Aperçu de l'ordre de mission</h1>
                        <p className="text-gray-500 text-sm mt-1">Vérifiez les informations avant de transmettre au DRH</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 text-sm">
                        <Row label="Chauffeur" value={chauffeurLabel} />
                        <Row label="Nationalité" value={form.nationalite} />
                        <Row label="Grade et fonction" value={form.grade_fonction} />
                        <Row label="Destination" value={form.destination} />
                        <Row label="Trajet" value={trajetLabel} />
                        <Row label="Objet de la mission" value={form.objet_mission} />
                        <Row label="Véhicule" value={form.moyen_transport || '—'} />
                        <Row label="Date de départ" value={form.date_depart || '—'} />
                        <Row label="Date de retour" value={form.date_retour || '—'} />
                        <Row label="Frais de transport" value={form.frais_transport} />
                        <Row label="Indemnité de déplacement" value={form.indemnite_deplacement} />
                        <Row label="Motif" value={form.motif} multiline />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('form')}
                            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                            <Pencil size={16} />
                            Modifier
                        </button>
                        <button
                            onClick={handleTransmit}
                            disabled={loading}
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                            {loading ? 'Transmission...' : 'Transmettre au DRH'}
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    // ÉTAPE 1 : Formulaire (inchangé, sauf le bouton du bas)
    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-blue-800">Nouvelle demande de navette</h1>
                    <p className="text-gray-500 text-sm mt-1">Remplissez l'ordre de mission</p>
                </div>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

                    {/* Chauffeur */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User size={14} className="inline mr-1" />
                            Chauffeur <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.chauffeur_id}
                            onChange={handleChauffeurChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sélectionner un chauffeur</option>
                            {chauffeurs.map(c => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                    disabled={!c.is_active}
                                    className={!c.is_active ? 'text-gray-400' : ''}
                                >
                                    {c.prenom} {c.nom}{!c.is_active ? ' (Désactivé)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Nationalité */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité</label>
                        <input
                            type="text"
                            value={form.nationalite}
                            onChange={e => setForm({ ...form, nationalite: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Grade et fonction */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade et fonction</label>
                        <input
                            type="text"
                            value={form.grade_fonction}
                            onChange={e => setForm({ ...form, grade_fonction: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Destination */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={14} className="inline mr-1" />
                            Se rend à (Destination) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.destination}
                            onChange={e => setForm({ ...form, destination: e.target.value })}
                            placeholder="Ex: Dakar"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Trajet */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={14} className="inline mr-1" />
                            Trajet
                        </label>
                        <select
                            value={form.trajet}
                            onChange={e => setForm({ ...form, trajet: e.target.value, trajet_autre: '' })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sélectionner un trajet</option>
                            <option value="dakar_bambey">Dakar → Bambey</option>
                            <option value="thies_bambey">Thiès → Bambey</option>
                            <option value="bambey_ngouniane">Bambey → Ngouniane</option>
                            <option value="autres">Autres</option>
                        </select>

                        {form.trajet === 'autres' && (
                            <input
                                type="text"
                                value={form.trajet_autre}
                                onChange={e => setForm({ ...form, trajet_autre: e.target.value })}
                                placeholder="Précisez le trajet"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    </div>

                    {/* Objet mission */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText size={14} className="inline mr-1" />
                            Objet de la mission
                        </label>
                        <input
                            type="text"
                            value={form.objet_mission}
                            onChange={e => setForm({ ...form, objet_mission: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Véhicule */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Bus size={14} className="inline mr-1" />
                            Moyen de transport / Véhicule
                        </label>
                        <select
                            value={form.vehicule_id}
                            onChange={handleVehiculeChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sélectionner un véhicule</option>
                            {vehicules.map(v => (
                                <option key={v.id} value={v.id}>{v.immatriculation} — {v.capacite} places</option>
                            ))}
                        </select>
                    </div>

                    {/* Date départ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={14} className="inline mr-1" />
                            Date de départ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.date_depart}
                            onChange={e => setForm({ ...form, date_depart: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Date retour */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={14} className="inline mr-1" />
                            Date de retour <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.date_retour}
                            onChange={e => setForm({ ...form, date_retour: e.target.value })}
                            min={form.date_depart || new Date().toISOString().split('T')[0]}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Frais de transport */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Fuel size={14} className="inline mr-1" />
                            Frais de transport
                        </label>
                        <input
                            type="text"
                            value={form.frais_transport}
                            onChange={e => setForm({ ...form, frais_transport: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Indemnité */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign size={14} className="inline mr-1" />
                            Indemnité de déplacement
                        </label>
                        <input
                            type="text"
                            value={form.indemnite_deplacement}
                            onChange={e => setForm({ ...form, indemnite_deplacement: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Motif */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText size={14} className="inline mr-1" />
                            Motif (pour le DRH) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={form.motif}
                            onChange={e => setForm({ ...form, motif: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Décrivez le motif..."
                        />
                    </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/ddl/navettes')}
                        className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </Layout>
    )
}

function Row({ label, value, multiline }) {
    return (
        <div className={multiline ? '' : 'flex justify-between items-start gap-4'}>
            <span className="text-gray-500 font-medium">{label}</span>
            <span className={`text-gray-800 ${multiline ? 'block mt-1' : 'text-right'}`}>{value}</span>
        </div>
    )
}