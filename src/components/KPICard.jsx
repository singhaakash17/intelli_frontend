import React from 'react';
import './KPICard.css';
import { formatNumber } from '../utils/numberFormatter';

const KPICard = ({ title, value, unit, icon, trend, isLoading, error }) => {
  if (error) {
    return (
      <div className="kpi-card error">
        <div className="kpi-icon">{icon}</div>
        <div className="kpi-content">
          <h3 className="kpi-title">{title}</h3>
          <p className="kpi-error">Error loading data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <h3 className="kpi-title">{title}</h3>
        {isLoading ? (
          <div className="kpi-loading">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <div className="kpi-value">
              <span className="value-number">{formatNumber(value)}</span>
              {unit && <span className="value-unit">{unit}</span>}
            </div>
            {trend && (
              <div className={`kpi-trend ${trend.direction}`}>
                <span className="trend-icon">{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
                <span className="trend-value">{trend.value}</span>
                <span className="trend-label">{trend.label}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default KPICard;

