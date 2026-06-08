import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ValidationNavette from './pages/validation/ValidationNavette'
import Reservation from './pages/Reservation'

// Auth
import Login from './pages/Login'

// DDL
import DDLDashboard from './pages/ddl/Dashboard'
import MesNavettes from './pages/ddl/MesNavettes'
import NouvelleNavette from './pages/ddl/NouvelleNavette'
import ModifierNavette from './pages/ddl/ModifierNavette'

// Enseignant
import EnseignantDashboard from './pages/enseignant/Dashboard'
import EnseignantMesVoyages from './pages/enseignant/MesVoyages'
import EnseignantNouveauVoyage from './pages/enseignant/NouveauVoyage'
import EnseignantNouveauRapport from './pages/enseignant/NouveauRapport'
import EnseignantMesRapports from './pages/enseignant/MesRapports'
import EnseignantResoumettreRapport from './pages/enseignant/ResoumettreRapport'

// DRH
import DRHDashboard from './pages/drh/Dashboard'
import DRHOrdres from './pages/drh/OrdresMission'

// SG DRH
import SGDRHDashboard from './pages/sgdrh/Dashboard'
import SGDRHOrdres from './pages/sgdrh/OrdresMission'


// Chauffeur
import ChauffeurDashboard from './pages/chauffeur/Dashboard'
import MesTrajets from './pages/chauffeur/MesTrajets'
import ChauffeurReservations from './pages/chauffeur/Reservations'

import OrdreMissionPrint from './pages/ordres/OrdreMissionPrint'


// SG VR
import SGVRDashboard from './pages/sgvr/SGDashboard'
import Recapitulatifs from './pages/sgvr/Recapitulatifs'

// Vice-Recteur
import ViceRecteurDashboard from './pages/vicerecteur/Dashboard'
import VoyagesATraiter from './pages/vicerecteur/VoyagesATraiter'
import RapportsAValider from './pages/vicerecteur/RapportsAValider'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUtilisateurs from './pages/admin/Utilisateurs'
import AdminVehicules from './pages/admin/Vehicules'

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
    return user ? children : <Navigate to="/login" replace />
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* Public */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/reservation" element={<Reservation />} />
                    <Route path="/validation" element={<PrivateRoute><ValidationNavette /></PrivateRoute>} />

                    {/* DDL */}
                    <Route path="/ddl/dashboard" element={<PrivateRoute><DDLDashboard /></PrivateRoute>} />
                    <Route path="/ddl/navettes" element={<PrivateRoute><MesNavettes /></PrivateRoute>} />
                    <Route path="/ddl/navettes/nouvelle" element={<PrivateRoute><NouvelleNavette /></PrivateRoute>} />
                    <Route path="/ddl/navettes/modifier/:id" element={<PrivateRoute><ModifierNavette /></PrivateRoute>} />

                    {/* Enseignant */}
                    <Route path="/enseignant/dashboard" element={<PrivateRoute><EnseignantDashboard /></PrivateRoute>} />
                    <Route path="/enseignant/voyages" element={<PrivateRoute><EnseignantMesVoyages /></PrivateRoute>} />
                    <Route path="/enseignant/voyages/nouveau" element={<PrivateRoute><EnseignantNouveauVoyage /></PrivateRoute>} />
                    <Route path="/enseignant/rapports" element={<PrivateRoute><EnseignantMesRapports /></PrivateRoute>} />
                    <Route path="/enseignant/rapports/nouveau/:voyageId" element={<PrivateRoute><EnseignantNouveauRapport /></PrivateRoute>} />
                    <Route path="/enseignant/rapports/resoumettre/:rapportId" element={<PrivateRoute><EnseignantResoumettreRapport /></PrivateRoute>} />

                    {/* DRH */}
                    <Route path="/drh/dashboard" element={<PrivateRoute><DRHDashboard /></PrivateRoute>} />
                    <Route path="/drh/ordres" element={<PrivateRoute><DRHOrdres /></PrivateRoute>} />

                    {/* SG DRH */}
                    <Route path="/sg-drh/dashboard" element={<PrivateRoute><SGDRHDashboard /></PrivateRoute>} />
                    <Route path="/sg-drh/ordres" element={<PrivateRoute><SGDRHOrdres /></PrivateRoute>} />
                    <Route
    path="/ordres-mission/:id/print"
    element={
        <PrivateRoute>
            <OrdreMissionPrint />
        </PrivateRoute>
    }
/>

                    {/* Chauffeur */}
                    <Route path="/chauffeur/dashboard" element={<PrivateRoute><ChauffeurDashboard /></PrivateRoute>} />
                    <Route path="/chauffeur/trajets" element={<PrivateRoute><MesTrajets /></PrivateRoute>} />
                    <Route path="/chauffeur/reservations" element={<PrivateRoute><ChauffeurReservations /></PrivateRoute>} />

                    {/* SG VR */}
                    <Route path="/sg-vr/dashboard" element={<PrivateRoute><SGVRDashboard /></PrivateRoute>} />
                    <Route path="/sg-vr/recapitulatifs" element={<PrivateRoute><Recapitulatifs /></PrivateRoute>} />

                    {/* Vice-Recteur */}
                    <Route path="/vice-recteur/dashboard" element={<PrivateRoute><ViceRecteurDashboard /></PrivateRoute>} />
                    <Route path="/vice-recteur/voyages" element={<PrivateRoute><VoyagesATraiter /></PrivateRoute>} />
                    <Route path="/vice-recteur/rapports" element={<PrivateRoute><RapportsAValider /></PrivateRoute>} />

                    {/* Admin */}
                    <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                    <Route path="/admin/utilisateurs" element={<PrivateRoute><AdminUtilisateurs /></PrivateRoute>} />
                    <Route path="/admin/vehicules" element={<PrivateRoute><AdminVehicules /></PrivateRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/login" replace />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App