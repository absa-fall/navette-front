import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { XCircle, ArrowLeft, Pencil, Trash2, AlertTriangle, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DemandesRejetees() {
    const navigate = useNavigate()
    const [demandes, setDemandes] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [demandeAModifier, setDemandeAModifier] = useState(null)

    const fetchDemandes = async () => {
        try {
            const res = await api.get('/ordres-mission?statut=rejete')
            setDemandes(res.data)
        } catch (error) {
            console.error('Erreur:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDemandes()
    }, [])

    // SUPPRIMER définitivement
    const supprimer = async (id) => {
        if (!confirm('Voulez-vous vraiment SUPPRIMER définitivement cette demande ?')) return

        try {
            await api.delete(`/ordres-mission/${id}`)
            setMessage('Demande supprimée avec succès')
            fetchDemandes()
        } catch (error) {
            setMessage(error.response?.data?.message || 'Erreur lors de la suppression')
        }
    }

    // MASQUER de l'historique (reste en base mais invisible)
    const masquer = async (id) => {
        if (!confirm('Masquer cette demande de votre vue ? Elle restera dans l\'historique.')) return

        try {
            await api.post(`/ordres-mission/${id}/masquer`)
            setMessage('Demande masquée de votre vue')
            fetchDemandes()
        } catch (error) {
            setMessage(error.response?.data?.message || 'Erreur lors du masquage')
        }
    }

    // MODIFIER
    const modifier = async (id, nouvellesDonnees) => {
        try {
            await api.put(`/ordres-mission/${id}`, nouvellesDonnees)
            setMessage('Demande modifiée et renvoyée au DRH')
            setDemandeAModifier(null)
            fetchDemandes()
        } catch (error) {
            setMessage(error.response?.data?.message || 'Erreur lors de la modification')
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/ddl/dashboard')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Demandes rejetées</h1>
                        <p className="text-gray-500 text-sm">Modifier, supprimer ou masquer ces demandes</p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-xl ${message.includes('succès') || message.includes('masquée') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                {loading ? (
                    <p>Chargement...</p>
                ) : demandes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
                        <XCircle size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucune demande rejetée</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {demandes.map((demande) => (
                            <div key={demande.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                
                                {/* Mode affichage */}
                                {demandeAModifier?.id !== demande.id ? (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">
                                                {demande.destination} - {demande.objet_mission}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Date départ : {demande.date_depart}
                                            </p>
                                            {demande.commentaire_rejet && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                                    <p className="text-sm text-red-600 flex items-center gap-2">
                                                        <AlertTriangle size={16} />
                                                        Motif du rejet : {demande.commentaire_rejet}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Boutons d'action */}
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                            <button
                                                onClick={() => setDemandeAModifier(demande)}
                                                className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm w-full justify-center"
                                            >
                                                <Pencil size={16} />
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => masquer(demande.id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm w-full justify-center"
                                            >
                                                <EyeOff size={16} />
                                                Masquer
                                            </button>
                                            <button
                                                onClick={() => supprimer(demande.id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm w-full justify-center"
                                            >
                                                <Trash2 size={16} />
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Mode modification */
                                    <FormulaireModification 
                                        demande={demande}
                                        onSave={(data) => modifier(demande.id, data)}
                                        onCancel={() => setDemandeAModifier(null)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}

// Composant formulaire de modification
function FormulaireModification({ demande, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        destination: demande.destination,
        objet_mission: demande.objet_mission,
        date_depart: demande.date_depart,
        heure_depart: demande.heure_depart,
        date_retour: demande.date_retour,
        moyen_transport: demande.moyen_transport,
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
                    <input
                        type="text"
                        name="objet_mission"
                        value={formData.objet_mission}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date départ</label>
                    <input
                        type="date"
                        name="date_depart"
                        value={formData.date_depart}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure départ</label>
                    <input
                        type="time"
                        name="heure_depart"
                        value={formData.heure_depart}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date retour</label>
                    <input
                        type="date"
                        name="date_retour"
                        value={formData.date_retour}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moyen de transport</label>
                    <input
                        type="text"
                        name="moyen_transport"
                        value={formData.moyen_transport}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Enregistrer et renvoyer au DRH
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                    Annuler
                </button>
            </div>
        </form>
    )
}