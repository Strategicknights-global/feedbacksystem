import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // Import your custom CSS

const ADMIN_EMAIL = "admin@gmail.com";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithRollNumber } = useAuth();
  const navigate = useNavigate();

  const isAdminLogin = identifier.trim() === ADMIN_EMAIL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminLogin) {
        await login(identifier.trim(), password.trim());
        navigate('/admin');
      } else {
        const roll = identifier.trim().replace(/\s+/g, '');
        const pass = password.trim().replace(/\s+/g, '');

        if (roll !== pass) {
          throw new Error("Password must be the same as your Roll Number.");
        }

        await loginWithRollNumber(roll);
        navigate('/feedback');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <h2 className="page-title">Portal Login</h2>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">
              {isAdminLogin ? 'Admin Email' : 'Roll Number'}
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="form-input"
              placeholder="Enter email or roll number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder={isAdminLogin ? "Enter admin password" : "Password is your roll number"}
              required
            />
          </div>

          <div className="feedback-submit-container">
            <button
              type="submit"
              disabled={loading}
              className="submit-button btn btn-primary"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;