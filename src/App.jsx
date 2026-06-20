import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ValidationNavette from './pages/validation/ValidationNavette'
import Reservation from './pages/Reservation'

// Auth
import Login from './pages/Login'
import Inscription from './pages/Inscription'

// DDL
import DDLDashboard from './pages/ddl/Dashboard'
import MesNavettes from './pages/ddl/MesNavettes'
import NouvelleNavette from './pages/ddl/NouvelleNavette'
import ModifierNavette from './pages/ddl/ModifierNavette'
import DemandesRejetees from './pages/ddl/DemandesRejetees'
import DemandesEnAttente from './pages/ddl/DemandesEnAttente'

// Enseignant
import EnseignantDashboard from './pages/enseignant/Dashboard'
import EnseignantNouveauVoyage from './pages/enseignant/NouveauVoyage'
import EnseignantNouveauRapport from './pages/enseignant/NouveauRapport'
import EnseignantMesRapports from './pages/enseignant/MesRapports'
import EnseignantResoumettreRapport from './pages/enseignant/ResoumettreRapport'
import MesVoyagesEtudes from './pages/enseignant/MesVoyagesEtudes'
import MesReservations from './pages/enseignant/MesReservations'
import DemandeAutorisationAbsence from './pages/enseignant/DemandeAutorisationAbsence'

// Voyages Etudes
import AutorisationAbsenceDocument from './pages/voyages-etudes/AutorisationAbsenceDocument'

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
import ScannerPassager from './pages/chauffeur/ScannerPassager'
import MonBus from './pages/chauffeur/MonBus'

import OrdreMissionPrint from './pages/ordres/OrdreMissionPrint'

// Usager
import ScannerBus from './pages/usager/ScannerBus'
import UsagerDashboard from './pages/usager/Dashboard'
import Reserver from './pages/usager/Reserver'

// SG VR
import SGVRDashboard from './pages/sgvr/SGDashboard'
import Recapitulatifs from './pages/sgvr/Recapitulatifs'

// Vice-Recteur
import ViceRecteurDashboard from './pages/vicerecteur/Dashboard'
import VoyagesATraiter from './pages/vicerecteur/VoyagesATraiter'
import RapportsAValider from './pages/vicerecteur/RapportsAValider'
import NouveauVoyageEtude from './pages/vicerecteur/NouveauVoyageEtude'
import VoyagesEtudes from './pages/vicerecteur/VoyagesEtudes'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUtilisateurs from './pages/admin/Utilisateurs'
import AdminVehicules from './pages/admin/Vehicules'

import ChefDepartementDashboard from './pages/chefdepartement/Dashboard'
import DirecteurUFRDashboard from './pages/directeurufr/Dashboard'
import RecteurDashboard from './pages/recteur/Dashboard'

import CommissionDashboard from './pages/commission/Dashboard'

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
                    <Route path="/reservation" element={<Navigate to="/login" replace />} />
                    <Route path="/validation" element={<PrivateRoute><ValidationNavette /></PrivateRoute>} />
                    <Route path="/inscription" element={<Inscription />} />

                    {/* DDL */}
                    <Route path="/ddl/dashboard" element={<PrivateRoute><DDLDashboard /></PrivateRoute>} />
                    <Route path="/ddl/navettes" element={<PrivateRoute><MesNavettes /></PrivateRoute>} />
                    <Route path="/ddl/navettes/nouvelle" element={<PrivateRoute><NouvelleNavette /></PrivateRoute>} />
                    <Route path="/ddl/navettes/modifier/:id" element={<PrivateRoute><ModifierNavette /></PrivateRoute>} />
                    <Route path="/ddl/demandes-rejetees" element={<DemandesRejetees />} />
                    <Route path="/ddl/en-attente" element={<DemandesEnAttente />} />

                    {/* Enseignant */}
                    <Route path="/enseignant/dashboard" element={<PrivateRoute><EnseignantDashboard /></PrivateRoute>} />
                    <Route path="/enseignant/voyages-etudes" element={<PrivateRoute><MesVoyagesEtudes /></PrivateRoute>} />
                    <Route path="/enseignant/voyages/nouveau" element={<PrivateRoute><EnseignantNouveauVoyage /></PrivateRoute>} />
                    <Route path="/enseignant/rapports" element={<PrivateRoute><EnseignantMesRapports /></PrivateRoute>} />
                    <Route path="/enseignant/rapports/nouveau/:voyageId" element={<PrivateRoute><EnseignantNouveauRapport /></PrivateRoute>} />
                    <Route path="/enseignant/rapports/resoumettre/:rapportId" element={<PrivateRoute><EnseignantResoumettreRapport /></PrivateRoute>} />
                    <Route path="/enseignant/reserver" element={<PrivateRoute><Reserver /></PrivateRoute>} />
                    <Route path="/enseignant/mes-reservations" element={<PrivateRoute><MesReservations /></PrivateRoute>} />
                    <Route path="/enseignant/scanner" element={<PrivateRoute><ScannerBus /></PrivateRoute>} />
                    <Route path="/enseignant/autorisation-absence/:beneficiaireId" element={<PrivateRoute><DemandeAutorisationAbsence /></PrivateRoute>} />

                    {/* Voyages Etudes */}
                    <Route path="/autorisation-absence/:id" element={<PrivateRoute><AutorisationAbsenceDocument /></PrivateRoute>} />

                    {/* DRH */}
                    <Route path="/drh/dashboard" element={<PrivateRoute><DRHDashboard /></PrivateRoute>} />
                    <Route path="/drh/ordres" element={<PrivateRoute><DRHOrdres /></PrivateRoute>} />

                    {/* SG DRH */}
                    <Route path="/sg-drh/dashboard" element={<PrivateRoute><SGDRHDashboard /></PrivateRoute>} />
                    <Route path="/sg-drh/ordres" element={<PrivateRoute><SGDRHOrdres /></PrivateRoute>} />
                    <Route path="/ordres-mission/:id/print" element={<PrivateRoute><OrdreMissionPrint /></PrivateRoute>} />

                    {/* Chauffeur */}
                    <Route path="/chauffeur/dashboard" element={<PrivateRoute><ChauffeurDashboard /></PrivateRoute>} />
                    <Route path="/chauffeur/trajets" element={<PrivateRoute><MesTrajets /></PrivateRoute>} />
                    <Route path="/chauffeur/reservations" element={<PrivateRoute><ChauffeurReservations /></PrivateRoute>} />
                    <Route path="/chauffeur/mon-bus" element={<PrivateRoute><MonBus /></PrivateRoute>} />
                    <Route path="/chauffeur/scanner" element={<PrivateRoute><ScannerPassager /></PrivateRoute>} />

                    {/* Usager */}
                    <Route path="/usager/dashboard" element={<PrivateRoute><UsagerDashboard /></PrivateRoute>} />
                    <Route path="/usager/reserver" element={<PrivateRoute><Reserver /></PrivateRoute>} />
                    <Route path="/usager/scanner" element={<PrivateRoute><ScannerBus /></PrivateRoute>} />

                    {/* SG VR */}
                    <Route path="/sg-vr/dashboard" element={<PrivateRoute><SGVRDashboard /></PrivateRoute>} />
                    <Route path="/sg-vr/recapitulatifs" element={<PrivateRoute><Recapitulatifs /></PrivateRoute>} />

                    {/* Vice-Recteur */}
                    <Route path="/vice-recteur/dashboard" element={<PrivateRoute><ViceRecteurDashboard /></PrivateRoute>} />
                    <Route path="/vice-recteur/voyages" element={<PrivateRoute><VoyagesATraiter /></PrivateRoute>} />
                    <Route path="/vice-recteur/rapports" element={<PrivateRoute><RapportsAValider /></PrivateRoute>} />
                    <Route path="/vice-recteur/rapports-a-valider" element={<PrivateRoute><RapportsAValider /></PrivateRoute>} />
                    <Route path="/vice-recteur/voyages-etudes" element={<PrivateRoute><VoyagesEtudes /></PrivateRoute>} />
                    <Route path="/vice-recteur/voyages-etudes/nouveau" element={<PrivateRoute><NouveauVoyageEtude /></PrivateRoute>} />

                    {/* Admin */}
                    <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                    <Route path="/admin/utilisateurs" element={<PrivateRoute><AdminUtilisateurs /></PrivateRoute>} />
                    <Route path="/admin/vehicules" element={<PrivateRoute><AdminVehicules /></PrivateRoute>} />

                    {/* Chef Departement */}
                    <Route path="/chef-departement/dashboard" element={<PrivateRoute><ChefDepartementDashboard /></PrivateRoute>} />

                    {/* Directeur UFR */}
                    <Route path="/directeur-ufr/dashboard" element={<PrivateRoute><DirecteurUFRDashboard /></PrivateRoute>} />

                    {/* Recteur */}
                    <Route path="/recteur/dashboard" element={<PrivateRoute><RecteurDashboard /></PrivateRoute>} />

                    {/* Commission */}
                    <Route path="/commission/dashboard" element={<PrivateRoute><CommissionDashboard /></PrivateRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/login" replace />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App