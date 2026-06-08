import Layout from '../../components/Layout'
import { MapPin, FileText, CheckCircle, Clock } from 'lucide-react'

export default function ViceRecteurDashboard() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Vice-Recteur</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des voyages d'études</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <Clock size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages en attente</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <CheckCircle size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages approuvés</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <FileText size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Rapports à valider</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Voyages en attente</h2>
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <MapPin size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">Aucun voyage en attente</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}