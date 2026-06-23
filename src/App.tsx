import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SidebarLayout } from './components/SidebarLayout';
import { Login } from './pages/Login';
import { Categories } from './pages/Categories';
// 🔌 Feature View Components Injection
import { Overview } from './pages/Overview';
import { VentesComptoir } from './pages/VentesComptoir';
import { Produits } from './pages/Produits';
import { Ingredients } from './pages/Ingredients';
import {Staff} from './pages/Staff';
import {Rapports} from './pages/Rapports';
import {JournalCalendrier} from './pages/JournalCalendrier';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 🔓 Public Authentication Portal */}
          <Route path="/login" element={<Login />} />

          {/* 🔒 Strict Role Guards Layer (ADMIN & GERANT Access Only) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'GERANT']} />}>
            
            {/* Main Application Layout Structure Framework */}
            <Route path="/dashboard" element={<SidebarLayout />}>
              
              {/* Default landing fallback route (Overview Dashboard Panel) */}
              <Route index element={<Overview />} />
              
              {/* Live Counter Cash register sales interface matching your mockup layout */}
              <Route path="ventes" element={<VentesComptoir />} />
              
              {/* Menu Catalog Explorer view */}
              <Route path="produits" element={<Produits />} />
              <Route element={<Categories />} path="categories" />
              {/* Warehouse Inventory raw material ledger module */}
              <Route path="ingredients" element={<Ingredients />} />
              
              {/* Secondary management workflows */}
              <Route path="staff" element={<Staff />} />
              <Route path="rapports" element={<Rapports />} />
              <Route path="journalcalendrier" element={<JournalCalendrier />} />
              
            </Route>
          </Route>

          {/* 🧭 Catch-All Fallback Navigation Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}