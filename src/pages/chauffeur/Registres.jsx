import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { ClipboardList, CheckCircle, Clock, Users } from 'lucide-react'

const trajetLabels = {
    dakar_bambey: 'Dakar → Bambey',
    thies_bambey: 'Thiès → Bambey',
    bambey_ngouniane: 'Bambey → Ngouniane',
}

const statutConfig = {
    ouvert: { label: 'Ouvert', color: 'bg-orange-100 text-orange-700', icon: Clock },
    cloture: { label: 'Clôturé', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    transmis: { label: 'Transmis SG VR', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

export default function ChauffeurRegistres() {
    const navigate = useNavigate()
    const [registres, setRegistres] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        api.get('/registres')
            .then(res => setRegistres(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    return (
        <Layout>
            <div className="space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mes registres de trajet</h1>
                    <p className="text-gray-500 text-sm mt-1">{registres.length} registre(s)</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : registres.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Aucun registre</h3>
                        <p className="text-gray-400 text-sm">Vos registres apparaîtront ici après chaque trajet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registres.map(registre => {
                            const statut = statutConfig[registre.statut] || statutConfig['ouvert']
                            const Icon = statut.icon
                            return (
                                <div key={registre.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => setSelected(selected === registre.id ? null : registre.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-blue-100 p-3 rounded-xl">
                                                    <ClipboardList size={20} className="text-blue-700" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {trajetLabels[registre.ordre_mission?.trajet] || 'Trajet'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {new Date(registre.date_trajet).toLocaleDateString('fr-FR')}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Users size={11} />
                                                        {registre.presences?.length || 0} passager(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
                                                <Icon size={12} />
                                                {statut.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Détail passagers */}
                                    {selected === registre.id && (
                                        <div className="border-t border-gray-100 p-5">
                                            {registre.presences?.length === 0 ? (
                                                <p className="text-center text-gray-400 text-sm py-4">
                                                    Aucun passager enregistré
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <Users size={16} />
                                                        Passagers
                                                    </p>
                                                    <div className="space-y-2">
                                                        {registre.presences?.map(presence => (
                                                            <div key={presence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        {presence.passager?.prenom} {presence.passager?.nom}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {presence.statut_passager}
                                                                    </p>
                                                                </div>
                                                                {presence.statut_passager === 'vacataire' ? (
                                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg">
                                                                        Gratuit
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm font-bold text-gray-800">
                                                                        {Number(presence.montant_retenue).toLocaleString()} FCFA
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Total */}
                                                    <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-blue-700">Total</span>
                                                        <span className="text-blue-800 font-bold">
                                                            {registre.presences
                                                                ?.filter(p => p.statut_passager === 'permanent')
                                                                .reduce((sum, p) => sum + Number(p.montant_retenue), 0)
                                                                .toLocaleString()} FCFA
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {/* Ouvrir registre si encore ouvert */}
                                            {registre.statut === 'ouvert' && (
                                                <button
                                                    onClick={() => navigate(`/chauffeur/registres/nouveau/${registre.ordre_mission_id}`)}
                                                    className="w-full mt-4 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                                                >
                                                    Continuer le registre
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}