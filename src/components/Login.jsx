import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.username || !formData.password) {
        setError('Please enter both username and password');
        setIsLoading(false);
        return;
      }

      // Call login API with timeout
      const response = await axios.post(
        `${API_URL}/api/auth/login`, 
        {
          username: formData.username,
          password: formData.password
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Store auth data
      const authData = {
        username: response.data.username,
        token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in,
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem('auth_data', JSON.stringify(authData));
      
      if (onLoginSuccess) {
        onLoginSuccess(authData);
      }
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Connection timeout. Please check if the backend server is running.');
      } else if (err.response) {
        setError(err.response?.data?.detail || err.message || 'Login failed. Please try again.');
      } else if (err.request) {
        setError('Unable to connect to server. Please check if the backend is running at ' + API_URL);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="login-title">Revenue Leakage</h1>
            <h2 className="login-subtitle">Detection System</h2>
            <p className="login-description">Utilities Sector Analytics Platform</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <span className="label-icon">👤</span>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="button-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            <div className="login-footer">
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>
          </form>
        </div>

        <div className="login-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;

