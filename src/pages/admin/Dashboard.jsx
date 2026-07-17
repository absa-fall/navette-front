import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Users, Bus, FileText, Activity, TrendingUp, PieChart as PieChartIcon, UserPlus, ChevronRight } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts'

const roleLabels = {
    admin:            'Administrateur',
    ddl:              'DDL',
    enseignant:       'Enseignant',
    drh:              'DRH',
    sg_drh:           'SG - DRH',
    chauffeur:        'Chauffeur',
    sg_vr:            'SG - VR',
    vice_recteur:     'Vice-Recteur',
    chef_departement: 'Chef Dépt.',
    directeur_ufr:    'Directeur UFR',
    recteur:          'Recteur',
    commission:       'Commission',
    usager:           'Usager',
}

const COULEURS_ROLES = [
    '#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#84cc16', '#06b6d4', '#a855f7',
]

const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export default function AdminDashboard() {
   const navigate = useNavigate()
   const [stats, setStats] = useState({
       utilisateurs: 0,
       vehicules: 0,
       ordres: 0,
       voyages: 0,
   })
   const [repartitionRoles, setRepartitionRoles] = useState([])
   const [activiteMensuelle, setActiviteMensuelle] = useState([])
   const [derniersInscrits, setDerniersInscrits] = useState([])
   const [loading, setLoading] = useState(true)

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

               // Répartition des utilisateurs par rôle
               const compteParRole = {}
               users.data.forEach(u => {
                   const role = u.role || 'autre'
                   compteParRole[role] = (compteParRole[role] || 0) + 1
               })
               const repartition = Object.entries(compteParRole)
                   .map(([role, count]) => ({
                       role,
                       label: roleLabels[role] || role,
                       value: count,
                   }))
                   .sort((a, b) => b.value - a.value)
               setRepartitionRoles(repartition)

               // Activité mensuelle (ordres de mission + voyages d'études) sur 6 mois
               const maintenant = new Date()
               const mois = []
               for (let i = 5; i >= 0; i--) {
                   const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
                   mois.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: moisLabels[d.getMonth()], Ordres: 0, Voyages: 0 })
               }
               ordres.data.forEach(o => {
                   const dateRef = o.created_at
                   if (!dateRef) return
                   const d = new Date(dateRef)
                   const key = `${d.getFullYear()}-${d.getMonth()}`
                   const entree = mois.find(m => m.key === key)
                   if (entree) entree.Ordres += 1
               })
               voyages.data.forEach(v => {
                   const dateRef = v.created_at || v.date_depart
                   if (!dateRef) return
                   const d = new Date(dateRef)
                   const key = `${d.getFullYear()}-${d.getMonth()}`
                   const entree = mois.find(m => m.key === key)
                   if (entree) entree.Voyages += 1
               })
               setActiviteMensuelle(mois)

               // Derniers utilisateurs inscrits (5 plus récents)
               const inscrits = [...users.data]
                   .filter(u => u.created_at)
                   .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                   .slice(0, 5)
               setDerniersInscrits(inscrits)
           } catch (err) {
               console.error(err)
           } finally {
               setLoading(false)
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

               {/* Cartes statistiques — icônes en badge rond */}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                   <div
                       onClick={() => navigate('/admin/utilisateurs')}
                       className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                   >
                       <div className="bg-blue-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                           <Users size={20} className="text-blue-700" />
                       </div>
                       <p className="text-2xl font-bold text-gray-800">{stats.utilisateurs}</p>
                       <p className="text-sm text-gray-500 mt-1">Utilisateurs</p>
                   </div>

                   <div
                       onClick={() => navigate('/admin/vehicules')}
                       className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                   >
                       <div className="bg-green-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                           <Bus size={20} className="text-green-700" />
                       </div>
                       <p className="text-2xl font-bold text-gray-800">{stats.vehicules}</p>
                       <p className="text-sm text-gray-500 mt-1">Véhicules</p>
                   </div>

                   <div
                       onClick={() => navigate('/admin/ordres-mission')}
                       className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                   >
                       <div className="bg-orange-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                           <FileText size={20} className="text-orange-700" />
                       </div>
                       <p className="text-2xl font-bold text-gray-800">{stats.ordres}</p>
                       <p className="text-sm text-gray-500 mt-1">Ordres de mission</p>
                   </div>

                   <div
                       onClick={() => navigate('/admin/voyages-etudes')}
                       className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
                   >
                       <div className="bg-purple-50 w-11 h-11 rounded-full flex items-center justify-center mb-3">
                           <Activity size={20} className="text-purple-700" />
                       </div>
                       <p className="text-2xl font-bold text-gray-800">{stats.voyages}</p>
                       <p className="text-sm text-gray-500 mt-1">Voyages d'études</p>
                   </div>
               </div>

               {/* Graphiques statistiques */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                   <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                       <div className="flex items-center gap-2 mb-4">
                           <TrendingUp size={18} className="text-blue-700" />
                           <h2 className="text-lg font-semibold text-gray-800">Activité par mois</h2>
                       </div>
                       {loading ? (
                           <p className="text-sm text-slate-400">Chargement...</p>
                       ) : (
                           <div className="h-64">
                               <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={activiteMensuelle}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                       <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                       <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                       <Tooltip cursor={{ fill: '#f8fafc' }} />
                                       <Legend wrapperStyle={{ fontSize: 12 }} />
                                       <Bar dataKey="Ordres" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                       <Bar dataKey="Voyages" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                                   </BarChart>
                               </ResponsiveContainer>
                           </div>
                       )}
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                       <div className="flex items-center gap-2 mb-4">
                           <PieChartIcon size={18} className="text-blue-700" />
                           <h2 className="text-lg font-semibold text-gray-800">Utilisateurs par rôle</h2>
                       </div>
                       {loading ? (
                           <p className="text-sm text-slate-400">Chargement...</p>
                       ) : repartitionRoles.length === 0 ? (
                           <p className="text-sm text-slate-400">Aucun utilisateur</p>
                       ) : (
                           <div className="h-64">
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie
                                           data={repartitionRoles}
                                           dataKey="value"
                                           nameKey="label"
                                           cx="50%"
                                           cy="50%"
                                           innerRadius={40}
                                           outerRadius={70}
                                           paddingAngle={2}
                                       >
                                           {repartitionRoles.map((entry, index) => (
                                               <Cell key={entry.role} fill={COULEURS_ROLES[index % COULEURS_ROLES.length]} />
                                           ))}
                                       </Pie>
                                       <Tooltip />
                                   </PieChart>
                               </ResponsiveContainer>
                           </div>
                       )}
                       {!loading && repartitionRoles.length > 0 && (
                           <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
                               {repartitionRoles.slice(0, 6).map((entry, index) => (
                                   <div key={entry.role} className="flex items-center gap-1.5">
                                       <span
                                           className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                           style={{ backgroundColor: COULEURS_ROLES[index % COULEURS_ROLES.length] }}
                                       />
                                       <span className="text-xs text-slate-500">{entry.label} ({entry.value})</span>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </div>

               {/* Derniers utilisateurs inscrits */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                   <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                           <UserPlus size={18} className="text-blue-700" />
                           <h2 className="text-lg font-semibold text-gray-800">Derniers inscrits</h2>
                       </div>
                       <button onClick={() => navigate('/admin/utilisateurs')} className="text-sm text-blue-700 font-medium hover:underline">
                           Voir tout
                       </button>
                   </div>
                   {loading ? (
                       <p className="text-sm text-slate-400">Chargement...</p>
                   ) : derniersInscrits.length === 0 ? (
                       <p className="text-sm text-slate-400">Aucun utilisateur récent</p>
                   ) : (
                       <div className="space-y-1">
                           {derniersInscrits.map(u => (
                               <div key={u.id}
                                   onClick={() => navigate('/admin/utilisateurs')}
                                   className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition"
                               >
                                   <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700 font-semibold text-sm">
                                       {(u.prenom?.[0] || u.nom?.[0] || u.name?.[0] || '?').toUpperCase()}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium text-slate-800 truncate">
                                           {u.prenom && u.nom ? `${u.prenom} ${u.nom}` : (u.name || u.email || 'Utilisateur')}
                                       </p>
                                       <p className="text-xs text-slate-400">
                                           {roleLabels[u.role] || u.role || '—'} · {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                       </p>
                                   </div>
                                   <ChevronRight size={14} className="text-slate-300" />
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
       </Layout>
   )
}