import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import UnifiedFeedbackForm from './components/UnifiedFeedbackForm';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feedback" 
            element={
              <ProtectedRoute requiredRole="user">
                <UnifiedFeedbackForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/"
            element={
              !currentUser ? (
                <Navigate to="/login" />
              ) : userRole === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/feedback" />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

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