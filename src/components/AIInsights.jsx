import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIInsights.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://127.0.0.1:8000');

const AIInsights = ({ filters }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (filters && filters.start_date && filters.end_date) {
      loadInsights();
    }
  }, [filters]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.discom_name) params.append('discom_name', filters.discom_name);
      if (filters.region_name) params.append('region_name', filters.region_name);
      if (filters.feeder_meter_no) params.append('feeder_meter_no', filters.feeder_meter_no);
      if (filters.dtu_meter_no) params.append('dtu_meter_no', filters.dtu_meter_no);
      params.append('start_date', filters.start_date);
      params.append('end_date', filters.end_date);

      const response = await axios.get(`${API_URL}/api/dashboard/insights?${params}`);
      
      if (response.data.success && response.data.data.insights) {
        setInsights(response.data.data.insights);
      } else {
        setInsights([]);
      }
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Failed to load insights');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'insight-critical';
      case 'warning':
        return 'insight-warning';
      case 'success':
        return 'insight-success';
      case 'info':
      default:
        return 'insight-info';
    }
  };

  if (loading) {
    return (
      <div className="ai-insights-container">
        <h3 className="insights-title">AI-Generated Insights</h3>
        <div className="insights-loading">Loading insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-insights-container">
        <h3 className="insights-title">AI-Generated Insights</h3>
        <div className="insights-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ai-insights-container">
      <h3 className="insights-title">
        <span className="ai-icon">🤖</span>
        AI-Generated Insights
      </h3>
      <div className="insights-list">
        {insights.length === 0 ? (
          <div className="insight-item insight-info">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <div className="insight-title">No Insights Available</div>
              <div className="insight-message">
                Insights will be generated based on your current filter selections and KPI data.
              </div>
            </div>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div key={index} className={`insight-item ${getSeverityClass(insight.severity)}`}>
              <div className="insight-icon">{insight.icon || '💡'}</div>
              <div className="insight-content">
                <div className="insight-title">{insight.title}</div>
                <div className="insight-message">{insight.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIInsights;

