import React, { useState, useEffect, useCallback, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import KPIGlossary from './components/KPIGlossary';

// Memoized Dashboard Page Component to prevent re-renders
const DashboardPage = memo(function DashboardPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotSessionId, setChatbotSessionId] = useState(() => {
    // Load session ID from sessionStorage if available
    return sessionStorage.getItem('chatbot_session_id') || null;
  });

  const toggleChatbot = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsChatbotOpen(prev => !prev);
  }, []);

  const handleCloseChatbot = useCallback(() => {
    setIsChatbotOpen(false);
  }, []);

  // Save session ID to sessionStorage when it changes
  useEffect(() => {
    if (chatbotSessionId) {
      sessionStorage.setItem('chatbot_session_id', chatbotSessionId);
    }
  }, [chatbotSessionId]);

  return (
    <div className="App">
      <Dashboard />
      
      {/* Chatbot Toggle Button */}
      <button 
        type="button"
        className={`chatbot-toggle-btn ${isChatbotOpen ? 'active' : ''}`}
        onClick={toggleChatbot}
        aria-label="Toggle Chatbot"
      >
        {isChatbotOpen ? '✕' : '💬'}
      </button>

      {/* Chatbot Component - Always mounted but conditionally visible */}
      <Chatbot 
        onClose={handleCloseChatbot}
        isOpen={isChatbotOpen}
        sessionId={chatbotSessionId}
        onSessionIdChange={setChatbotSessionId}
      />
    </div>
  );
});

DashboardPage.displayName = 'DashboardPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is authenticated
    const authData = sessionStorage.getItem('auth_data');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Check if token is still valid (basic check)
        return !!parsed.token;
      } catch {
        return false;
      }
    }
    return false;
  });

  const handleLoginSuccess = (authData) => {
    setIsAuthenticated(true);
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kpi-glossary"
          element={
            <ProtectedRoute>
              <KPIGlossary />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

