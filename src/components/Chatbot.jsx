import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChartRenderer from './ChartRenderer';
import './Chatbot.css';

// Use relative URL to leverage Vite proxy during development
// The Vite proxy in vite.config.js forwards /api requests to http://127.0.0.1:8000
// For production, use environment variable or absolute URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://127.0.0.1:8000');

function Chatbot({ onClose, isOpen = true, sessionId: propSessionId, onSessionIdChange }) {
  const [messages, setMessages] = useState(() => {
    // Load messages from sessionStorage if available
    const saved = sessionStorage.getItem('chatbot_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(propSessionId || null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save session ID to sessionStorage and notify parent
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('chatbot_session_id', sessionId);
      if (onSessionIdChange) {
        onSessionIdChange(sessionId);
      }
    }
  }, [sessionId, onSessionIdChange]);

  // Use prop session ID if provided
  useEffect(() => {
    if (propSessionId && propSessionId !== sessionId) {
      setSessionId(propSessionId);
    }
  }, [propSessionId]);

  const loadSessionHistory = async (sid) => {
    try {
      const response = await axios.get(`${API_URL}/api/session/${sid}/history`);
      if (response.data.messages && response.data.messages.length > 0) {
        // Convert history format to message format
        const historyMessages = [];
        response.data.messages.forEach(msg => {
          historyMessages.push({
            type: 'user',
            content: msg.user,
            timestamp: msg.timestamp
          });
          historyMessages.push({
            type: 'bot',
            content: msg.assistant,
            timestamp: msg.timestamp,
            query: msg.query_executed
          });
        });
        
        // Only update if we have history and no current messages (or messages are just welcome)
        if (historyMessages.length > 0 && (messages.length === 0 || messages.length === 1)) {
          setMessages(historyMessages);
        }
      }
    } catch (err) {
      console.error('Error loading session history:', err);
      // If session doesn't exist, create a new one
      if (err.response?.status === 404) {
        initializeSession();
      }
    }
  };

  // Initialize session or load history when component mounts
  useEffect(() => {
    if (!isInitialized) {
      if (sessionId) {
        // Load existing session history
        loadSessionHistory(sessionId);
      } else {
        // Create new session
        initializeSession();
      }
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isInitialized]);

  // Load history when chatbot opens and has a session
  useEffect(() => {
    if (isOpen && sessionId && isInitialized && messages.length <= 1) {
      loadSessionHistory(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId, isInitialized]);

  // Cleanup session on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // Note: This might not complete due to browser restrictions
        navigator.sendBeacon(`${API_URL}/api/session/${sessionId}`, JSON.stringify({}));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/session/create`, {
        user_id: 'user_' + Date.now()
      });
      const newSessionId = response.data.session_id;
      setSessionId(newSessionId);
      
      // Add welcome message only if no messages exist
      if (messages.length === 0) {
        setMessages([
          {
            type: 'bot',
            content: "👋 Hello! I'm your Revenue Leakage Detection assistant. I can help you explore data about energy consumption, meters, consumers, events, and more. What would you like to know?",
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to connect to the chatbot service. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setError(null);

    // Add user message to chat BEFORE clearing input
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    // Clear input and show loading after message is added
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: userMessage,
        session_id: sessionId
      });

      // Add bot response to chat
      const botMessage = {
        type: 'bot',
        content: response.data.response,
        chartData: response.data.chart_data,
        timestamp: response.data.timestamp,
        query: response.data.query_executed
      };

      // Debug: Log chart data if present
      if (response.data.chart_data) {
        console.log('Chart data received:', response.data.chart_data);
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      
      const errorMessage = {
        type: 'bot',
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      try {
        if (sessionId) {
          await axios.delete(`${API_URL}/api/session/${sessionId}`);
        }
        setMessages([]);
        sessionStorage.removeItem('chatbot_messages');
        sessionStorage.removeItem('chatbot_session_id');
        setSessionId(null);
        setIsInitialized(false);
        initializeSession();
      } catch (err) {
        console.error('Error clearing chat:', err);
      }
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-content">
            <div className="header-title">
              <span className="bot-icon">🤖</span>
              <div>
                <h3>Revenue Leakage Assistant</h3>
                <span className="status-indicator">
                  <span className="status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="clear-btn" 
                onClick={clearChat}
                title="Clear chat"
              >
                🗑️
              </button>
              <button 
                className="close-btn" 
                onClick={onClose}
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.type} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-content">
                {message.type === 'bot' ? (
                  <>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => (
                          <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                            <table className="markdown-table" {...props} />
                          </div>
                        ),
                        th: ({node, ...props}) => <th className="markdown-th" {...props} />,
                        td: ({node, ...props}) => <td className="markdown-td" {...props} />,
                        code: ({node, inline, ...props}) => {
                          // Don't render chart code blocks
                          if (props.className === 'language-chart' || (props.children && typeof props.children === 'string' && props.children.includes('"type"'))) {
                            return null;
                          }
                          return inline ? (
                            <code className="inline-code" {...props} />
                          ) : (
                            <pre><code {...props} /></pre>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.chartData && (
                      <div style={{ marginTop: '16px' }}>
                        <ChartRenderer chartData={message.chartData} />
                      </div>
                    )}
                  </>
                ) : (
                  message.content
                )}
                {message.query && (
                  <div className="query-display">
                    <details>
                      <summary>📊 View SQL Query</summary>
                      <pre>{message.query}</pre>
                    </details>
                  </div>
                )}
              </div>
              <div className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about energy consumption, meters, events..."
              rows="1"
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
              title="Send message"
            >
              {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="loading-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
          <div className="input-hint">
            Press Enter to send • Shift + Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

