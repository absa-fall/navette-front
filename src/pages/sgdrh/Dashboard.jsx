import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { FileText, PenLine, CheckCircle, Clock, ArrowRight } from 'lucide-react'

export default function SGDRHDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        aSigner: 0,
        signesCeMois: 0,
        transmisChauffeur: 0,
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/notifications/sidebar')
                setStats({
                    aSigner: res.data.sgDrhOrdres || 0,
                    signesCeMois: res.data.sgDrhSignes || 0,
                    transmisChauffeur: res.data.sgDrhTransmis || 0,
                })
            } catch (error) {
                console.error('Erreur stats SG-DRH:', error)
            }
        }

        fetchStats()
    }, [])

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard SG - DRH</h1>
                    <p className="text-gray-500 text-sm mt-1">Signature des ordres de mission</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card À signer */}
                    <div 
                        onClick={() => navigate('/sg-drh/ordres?statut=a_signer')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.aSigner}</p>
                        <p className="text-sm text-gray-500 mt-1">À signer</p>
                    </div>

                    {/* Card Signés ce mois */}
                    <div 
                        onClick={() => navigate('/sg-drh/ordres?statut=signes')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <PenLine size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.signesCeMois}</p>
                        <p className="text-sm text-gray-500 mt-1">Signés ce mois</p>
                    </div>

                    {/* Card Transmis au chauffeur */}
                    <div 
                        onClick={() => navigate('/sg-drh/ordres?statut=transmis')}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{stats.transmisChauffeur}</p>
                        <p className="text-sm text-gray-500 mt-1">Transmis au chauffeur</p>
                    </div>
                </div>

                {/* CORRECTION : Grand card "Ordres à signer" dynamique */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Ordres à signer</h2>
                        {stats.aSigner > 0 && (
                            <button 
                                onClick={() => navigate('/sg-drh/ordres?statut=a_signer')}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                                Voir tout <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                    
                    {stats.aSigner === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <FileText size={40} className="mb-3 opacity-30" />
                            <p className="text-sm">Aucun ordre à signer</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <Clock size={20} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-800">
                                        {stats.aSigner} ordre{stats.aSigner > 1 ? 's' : ''} en attente
                                    </p>
                                    <p className="text-sm text-orange-600">
                                        Signature requise avant transmission au chauffeur
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/sg-drh/ordres?statut=a_signer')}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                            >
                                <PenLine size={16} />
                                Traiter les ordres à signer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}