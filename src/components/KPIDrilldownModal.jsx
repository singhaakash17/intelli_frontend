import React from 'react';
import { getKPIBreakdown } from '../services/dashboardApi';
import './KPIDrilldownModal.css';

const KPIDrilldownModal = ({ isOpen, onClose, kpiType, currentLevel, data, filters, onDrilldown }) => {
  if (!isOpen) return null;

  const getKpiTitle = (type) => {
    const titles = {
      'total-energy-consumed': 'Total Energy Consumed',
      'total-power-loss': 'Total Power Loss',
      'total-dtus': 'Total DTUs',
      'zero-energy-users': 'Zero Energy Users',
      'solar-consumers': 'Solar Consumers',
      'total-solar-export': 'Total Solar Export',
      'average-current': 'Average Current',
      'average-voltage': 'Average Voltage'
    };
    return titles[type] || 'KPI Breakdown';
  };

  const getNextLevel = (current) => {
    const levels = ['discom', 'region', 'feeder', 'dtu', 'consumer'];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const getLevelLabel = (level) => {
    const labels = {
      'discom': 'DISCOM',
      'region': 'Region',
      'feeder': 'Feeder',
      'dtu': 'DTU',
      'consumer': 'Consumer'
    };
    return labels[level] || level;
  };

  const handleRowClick = async (row) => {
    const nextLevel = getNextLevel(currentLevel);
    if (nextLevel && onDrilldown) {
      // Update filters based on clicked row for next level drilldown
      await onDrilldown(nextLevel);
    }
  };

  const breakdownData = data?.breakdown_data || [];
  const nextLevel = getNextLevel(currentLevel);

  return (
    <div className="kpi-drilldown-modal-overlay" onClick={onClose}>
      <div className="kpi-drilldown-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kpi-drilldown-modal-header">
          <h2>{getKpiTitle(kpiType)} - {getLevelLabel(currentLevel)} Breakdown</h2>
          <button className="kpi-drilldown-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="kpi-drilldown-modal-body">
          {breakdownData.length === 0 ? (
            <div className="kpi-drilldown-empty">
              <p>No data available for this breakdown level.</p>
            </div>
          ) : (
            <div className="kpi-drilldown-table-container">
              <table className="kpi-drilldown-table">
                <thead>
                  <tr>
                    <th>{getLevelLabel(currentLevel)}</th>
                    <th>Value</th>
                    {nextLevel && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {breakdownData.map((row, index) => {
                    const key = Object.keys(row).find(k => k !== 'value');
                    const label = row[key] || 'N/A';
                    const value = row.value || 0;
                    
                    return (
                      <tr key={index} onClick={() => nextLevel && handleRowClick(row)} className={nextLevel ? 'clickable-row' : ''}>
                        <td>{label}</td>
                        <td>
                          {typeof value === 'number' 
                            ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : value}
                        </td>
                        {nextLevel && (
                          <td>
                            <button
                              className="kpi-drilldown-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(row);
                              }}
                            >
                              Drill Down to {getLevelLabel(nextLevel)}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="kpi-drilldown-modal-footer">
          <div className="kpi-drilldown-breadcrumb">
            <span>Level: {getLevelLabel(currentLevel)}</span>
            {nextLevel && <span className="breadcrumb-arrow">→</span>}
            {nextLevel && <span>Next: {getLevelLabel(nextLevel)}</span>}
          </div>
          <button className="kpi-drilldown-modal-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default KPIDrilldownModal;

