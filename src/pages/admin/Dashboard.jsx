import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Users, Bus, FileText, Activity } from 'lucide-react'

export default function AdminDashboard() {
   const navigate = useNavigate()
   const [stats, setStats] = useState({
       utilisateurs: 0,
       vehicules: 0,
       ordres: 0,
       voyages: 0,
   })

   useEffect(() => {
       const fetchStats = async () => {
           try {
              const [users, vehicules, ordres, voyages] = await Promise.all([
    api.get('/users'),
    api.get('/vehicules'),
    api.get('/ordres-mission'),
    api.get('/voyages-etudes'),
])
               setStats({
                   utilisateurs: users.data.length,
                   vehicules: vehicules.data.length,
                   ordres: ordres.data.length,
                   voyages: voyages.data.length,
               })
           } catch (err) {
               console.error(err)
           }
       }
       fetchStats()
   }, [])

   return (
       <Layout>
           <div className="space-y-6">
               <div>
                   <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
                   <p className="text-gray-500 text-sm mt-1">Vue globale du système</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                   <div
                       onClick={() => navigate('/admin/utilisateurs')}
                       className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                   >
                       <div className="bg-blue-100 p-2 rounded-xl w-fit mb-3">
                           <Users size={20} className="text-blue-700" />
                       </div>
                       <p className="text-2xl font-bold text-gray-800">{stats.utilisateurs}</p>
                       <p className="text-sm text-gray-500 mt-1">Utilisateurs</p>
                   </div>

                   <div
                       onClick={() => navigate('/admin/vehicules')}
                       className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                   >
                       <div className="bg-green-100 p-2 rounded-xl w-fit mb-3">
                           <Bus size={20} className="text-green-700" />
                       </div>
                       <p className="text-2xl font-bold text-gray-800">{stats.vehicules}</p>
                       <p className="text-sm text-gray-500 mt-1">Véhicules</p>
                   </div>

                  <div
    onClick={() => navigate('/admin/ordres-mission')}
    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
>
    <div className="bg-orange-100 p-2 rounded-xl w-fit mb-3">
        <FileText size={20} className="text-orange-700" />
    </div>
    <p className="text-2xl font-bold text-gray-800">{stats.ordres}</p>
    <p className="text-sm text-gray-500 mt-1">Ordres de mission</p>
</div>

                   <div
    onClick={() => navigate('/admin/voyages-etudes')}
    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
>
    <div className="bg-purple-100 p-2 rounded-xl w-fit mb-3">
        <Activity size={20} className="text-purple-700" />
    </div>
    <p className="text-2xl font-bold text-gray-800">{stats.voyages}</p>
    <p className="text-sm text-gray-500 mt-1">Voyages d'études</p>
</div>
 </div>
               {/* Raccourcis */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div
                       onClick={() => navigate('/admin/utilisateurs')}
                       className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-6 cursor-pointer transition"
                   >
                       <Users size={28} className="mb-3" />
                       <p className="font-bold text-lg">Gérer les utilisateurs</p>
                       <p className="text-blue-200 text-sm mt-1">Créer et gérer les comptes</p>
                   </div>

                   <div
                       onClick={() => navigate('/admin/vehicules')}
                       className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-6 cursor-pointer transition"
                   >
                       <Bus size={28} className="mb-3" />
                       <p className="font-bold text-lg">Gérer les véhicules</p>
                       <p className="text-green-200 text-sm mt-1">Ajouter et gérer les bus</p>
                   </div>
               </div>
           </div>
       </Layout>
   )
}