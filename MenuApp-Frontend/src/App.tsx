import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './pages/Menu';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentPending from './pages/PaymentPending';
import { useAuthStore } from './context/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token);
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes */}
          <Route path="/m/:slug" element={<Menu />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/pending" element={<PaymentPending />} />

          {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/m/sanjuan-gourmet" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
