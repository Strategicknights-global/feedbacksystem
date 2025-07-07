import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import UnifiedFeedbackForm from './components/UnifiedFeedbackForm';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// This component uses Auth context to render correct routes based on role
function AppContent() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected admin route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } 
          />

          {/* Protected student route */}
          <Route 
            path="/feedback" 
            element={
              <ProtectedRoute requiredRole="user">
                <UnifiedFeedbackForm />
              </ProtectedRoute>
            } 
          />

          {/* Redirect root path based on authentication and role */}
          <Route 
            path="/"
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : userRole === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/feedback" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

// App wrapper with Router and AuthProvider
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
