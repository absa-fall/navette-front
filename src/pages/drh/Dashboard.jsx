import Layout from '../../components/Layout'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function DRHDashboard() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard DRH</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des ordres de mission</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <Clock size={20} className="text-orange-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">En attente d'approbation</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-green-100 p-2 rounded-xl">
                                <CheckCircle size={20} className="text-green-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Approuvés</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-red-100 p-2 rounded-xl">
                                <XCircle size={20} className="text-red-700" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-sm text-gray-500 mt-1">Rejetés</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Ordres en attente</h2>
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <FileText size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">Aucun ordre en attente</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}