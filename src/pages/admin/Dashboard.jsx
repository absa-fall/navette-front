import Layout from '../../components/Layout'
import { Users, Bus, FileText, Activity } from 'lucide-react'

export default function AdminDashboard() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
                    <p className="text-gray-500 text-sm mt-1">Vue globale du système</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                            <Users size={20} className="text-blue-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">8</p>
                        <p className="text-sm text-gray-500 mt-1">Utilisateurs</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                            <Bus size={20} className="text-green-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Véhicules</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
                            <FileText size={20} className="text-orange-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Ordres de mission</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="bg-purple-100 p-2 rounded-xl w-fit mb-3">
                            <Activity size={20} className="text-purple-700" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Voyages d'études</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

