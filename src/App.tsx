import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Workflow from "@/pages/Workflow";
import CompaniesPage from "@/pages/admin/CompaniesPage";
import RolesPage from "@/pages/admin/RolesPage";
import UsersPage from "@/pages/admin/UsersPage";
import SystemLogin from "@/pages/SystemLogin";
import Dashboard from "@/components/Dashboard";
import ContractTypesPage from "@/pages/ContractTypesPage";
import ContractFieldsPage from "@/pages/ContractFieldsPage";
import ContractFormInfoPage from "@/pages/ContractFormInfoPage";
import ContractTemplatesPage from "@/pages/ContractTemplatesPage";
import CreateContractPage from "@/pages/CreateContractPage";
import { isAuthenticatedSync } from "@/services/authService";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const ok = isAuthenticatedSync();
  return ok ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/workflow" element={<ProtectedRoute><Workflow /></ProtectedRoute>} />
        <Route path="/contract-types" element={<ProtectedRoute><ContractTypesPage /></ProtectedRoute>} />
        <Route path="/contract-fields" element={<ProtectedRoute><ContractFieldsPage /></ProtectedRoute>} />
        <Route path="/contract-form-info" element={<ProtectedRoute><ContractFormInfoPage /></ProtectedRoute>} />
        <Route path="/contract-templates" element={<ProtectedRoute><ContractTemplatesPage /></ProtectedRoute>} />
        <Route path="/create-contract" element={<ProtectedRoute><CreateContractPage /></ProtectedRoute>} />
        <Route path="/login" element={<SystemLogin />} />
        <Route path="/system-login" element={<SystemLogin />} />
        <Route path="/admin/companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
