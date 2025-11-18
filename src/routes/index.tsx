import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/SignUp";
import Browse from "../pages/Browse";
import Dashboard from "../pages/Dashboard";
import ProfileSetup from "../pages/ProfileSetup";
import PrivateRoute from "./PrivateRoute";
import PetProfile from "../pages/PetProfile";
import DashboardRouter from "../pages/DashboardRouter";
import StaffDashboard from "../pages/StaffDashboard"; // ← NEW
import CreateListing from "../pages/CreateListing";
import VetDashboard from "../pages/VetDashboard";
import CreatePetListing from "@/pages/CreatePetListing";
import AdminDashboard from "../pages/AdminDashboard"
import StaffDashboard from "../pages/StaffDashboard";
import CreateListing from "@/pages/CreateListing";
import BlockchainDemo from "../components/BlockchainDemo/BlockChainDemo";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/blockchain-demo" element={<PrivateRoute><BlockchainDemo /></PrivateRoute>} />

        {/* existing */}
        <Route path="/browse" element={<PrivateRoute><Browse /></PrivateRoute>}/>
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/pet/:id" element={<PrivateRoute><PetProfile /></PrivateRoute>} />
        <Route path="/create-listing" element={<PrivateRoute><CreateListing /></PrivateRoute>} />
        <Route path="/create-listing-new" element={<PrivateRoute><CreatePetListing /></PrivateRoute>} />

        {/* NEW: staff dashboard */}
        <Route path="/staff" element={<PrivateRoute><StaffDashboard /></PrivateRoute>} />\
        <Route path="/vet" element={<PrivateRoute><VetDashboard /></PrivateRoute>} />
        
        {/* admin dashboard route */}
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />

        {/* Optional: smart router (hit /app to route by role) */}
        <Route path="/app" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}