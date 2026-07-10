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
import {Shifts} from './pages/Shifts';
import { PublicRoute } from './components/PublicRoute';
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'GERANT']} />}>
            <Route path="/dashboard" element={<SidebarLayout />}>
              <Route index element={<Overview />} />
              <Route path="ventes" element={<VentesComptoir />} />
              <Route path="produits" element={<Produits />} />
              <Route element={<Categories />} path="categories" />
              <Route path="ingredients" element={<Ingredients />} />
              <Route path="staff" element={<Staff />} />
              <Route path="rapports" element={<Rapports />} />
              <Route path="journalcalendrier" element={<JournalCalendrier />} />
              <Route path="shifts" element={<Shifts />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}