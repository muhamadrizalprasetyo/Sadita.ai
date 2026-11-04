import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ModalGalat from '@/components/ui/modal-galat/ModalGalat';
import AdminApp from '@/layout/AdminApp';
import AdminLogin from '@/pages/auth/AdminLogin';
import { AuthProvider } from '@/lib/auth';

import './index.css';
import './styles/theme.css';

export default function AdminPlayground() {
  return (
    <BrowserRouter basename="/playground-admin">
      <AuthProvider>
        <ModalGalat />
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/dashboard/*" element={<AdminApp />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
