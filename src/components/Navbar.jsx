import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png'; // Make sure you have a logo image here

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo-container">
        <img src={logo} alt="Institution Logo" className="navbar-logo" />
        <span className="navbar-title">Student Feedback Portal</span>
      </div>
      {currentUser && (
        <div className="navbar-links">
          {userRole === 'admin' && (
            <Link to="/admin" className="navbar-link">Admin Panel</Link>
          )}
          {userRole === 'user' && (
            <Link to="/feedback" className="navbar-link">Feedback Form</Link>
          )}
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;