import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/contract-types" element={<ContractTypesPage />} />
        <Route path="/contract-fields" element={<ContractFieldsPage />} />
        <Route path="/contract-form-info" element={<ContractFormInfoPage />} />
        <Route path="/login" element={<SystemLogin />} />
        <Route path="/system-login" element={<SystemLogin />} />
        <Route path="/admin/companies" element={<CompaniesPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/roles" element={<RolesPage />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
