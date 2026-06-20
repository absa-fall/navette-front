import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function GraphiquesSGVR({ reservations }) {

    // ===== 1. Réservations par jour (barres) =====
    const parJour = {}
    reservations.forEach(r => {
        if (!r.date_reservation) return
        const date = new Date(r.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        parJour[date] = (parJour[date] || 0) + 1
    })
    const dataEvolution = Object.entries(parJour)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => {
            const [dA, mA] = a.date.split('/').map(Number)
            const [dB, mB] = b.date.split('/').map(Number)
            return mA - mB || dA - dB
        })

    // ===== 2. Donut répartition profils =====
    const parProfil = {}
    reservations.forEach(r => {
        if (!r.type_profil) return
        parProfil[r.type_profil] = (parProfil[r.type_profil] || 0) + 1
    })
    const dataProfil = Object.entries(parProfil).map(([name, value]) => ({ name, value }))

    // ===== 3. Top trajets (barres horizontales) =====
    const parTrajet = {}
    reservations.forEach(r => {
        if (!r.ville_depart || !r.ville_arrivee) return
        const key = `${r.ville_depart} → ${r.ville_arrivee}`
        parTrajet[key] = (parTrajet[key] || 0) + 1
    })
    const dataTrajets = Object.entries(parTrajet)
        .map(([trajet, total]) => ({ trajet, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

    // ===== 4. Montants retenus par jour (aire) =====
    const parJourMontant = {}
    reservations.forEach(r => {
        if (!r.date_reservation) return
        const date = new Date(r.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        parJourMontant[date] = (parJourMontant[date] || 0) + (parseFloat(r.montant_retenue) || 0)
    })
    const dataMontants = Object.entries(parJourMontant)
        .map(([date, montant]) => ({ date, montant }))
        .sort((a, b) => {
            const [dA, mA] = a.date.split('/').map(Number)
            const [dB, mB] = b.date.split('/').map(Number)
            return mA - mB || dA - dB
        })

    const CustomTooltipMontant = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2 text-sm">
                    <p className="text-gray-500 mb-1">{label}</p>
                    <p className="font-bold text-green-600">{Number(payload[0].value).toLocaleString()} FCFA</p>
                </div>
            )
        }
        return null
    }

    const CustomTooltipBar = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2 text-sm">
                    <p className="text-gray-500 mb-1">{label}</p>
                    <p className="font-bold text-blue-600">{payload[0].value} réservation(s)</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* 1. Barres — réservations par jour */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Réservations par jour</h3>
                <p className="text-xs text-gray-400 mb-4">Nombre de réservations enregistrées</p>
                {dataEvolution.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Aucune donnée</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dataEvolution} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltipBar />} />
                            <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Réservations" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* 2. Donut — répartition profils */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Répartition par profil</h3>
                <p className="text-xs text-gray-400 mb-4">Distribution des types de passagers</p>
                {dataProfil.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Aucune donnée</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={dataProfil}
                                dataKey="value"
                                nameKey="name"
                                cx="50%" cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                            >
                                {dataProfil.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} passager(s)`, name]} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* 3. Barres horizontales — top trajets */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Top 5 trajets</h3>
                <p className="text-xs text-gray-400 mb-4">Les trajets les plus empruntés</p>
                {dataTrajets.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Aucune donnée</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dataTrajets} layout="vertical" barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="trajet" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                            <Tooltip content={<CustomTooltipBar />} />
                            <Bar dataKey="total" radius={[0, 6, 6, 0]} name="Réservations">
                                {dataTrajets.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* 4. Aire — montants retenus */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Montants retenus</h3>
                <p className="text-xs text-gray-400 mb-4">Évolution des retenues en FCFA</p>
                {dataMontants.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Aucune donnée</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={dataMontants}>
                            <defs>
                                <linearGradient id="gradMontant" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString()} />
                            <Tooltip content={<CustomTooltipMontant />} />
                            <Area type="monotone" dataKey="montant" stroke="#10b981" strokeWidth={2} fill="url(#gradMontant)" name="Montant" dot={{ r: 3, fill: '#10b981' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}