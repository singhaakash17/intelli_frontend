import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary';
import DashboardHeader from './DashboardHeader';
import KPISection from './KPISection';
import AIInsights from './AIInsights';
import HourlyConsumptionGraph from './graphs/HourlyConsumptionGraph';
import ZeroConsumptionGraph from './graphs/ZeroConsumptionGraph';
import TopEventsGraph from './graphs/TopEventsGraph';
import DailyEventsVolumeGraph from './graphs/DailyEventsVolumeGraph';
import EventsByWeekdayGraph from './graphs/EventsByWeekdayGraph';
import ConsumptionAnomaliesGraph from './graphs/ConsumptionAnomaliesGraph';
import SolarForecastGraph from './graphs/SolarForecastGraph';
import AnomalyCategoriesGraph from './graphs/AnomalyCategoriesGraph';
import KPIGlossary from './KPIGlossary';
import './Dashboard.css';

const Dashboard = memo(function Dashboard() {
  const [activeTab, setActiveTab] = useState('ai-insights');
  const [filters, setFilters] = useState({
    discom_name: '',
    region_name: '',
    feeder_meter_no: '',
    dtu_meter_no: '',
    start_date: '',
    end_date: ''
  });

  // Use ref to track previous filters and prevent unnecessary updates
  const prevFiltersRef = useRef(null);

  const handleFilterChange = useCallback((newFilters) => {
    // Only update if filters actually changed (deep comparison)
    const prevFiltersStr = JSON.stringify(prevFiltersRef.current);
    const newFiltersStr = JSON.stringify(newFilters);
    
    if (prevFiltersStr !== newFiltersStr) {
      prevFiltersRef.current = { ...newFilters }; // Create a copy
      setFilters({ ...newFilters }); // Create a new object reference only when changed
    }
  }, []);

  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => filters, [
    filters.discom_name,
    filters.region_name,
    filters.feeder_meter_no,
    filters.dtu_meter_no,
    filters.start_date,
    filters.end_date
  ]);

  // Note: Default dates are set by DashboardHeader component
  // This ensures single source of truth for filter initialization

  return (
    <ErrorBoundary>
      <div className="dashboard-container">
        <DashboardHeader onFilterChange={handleFilterChange} />
        
        <div className="dashboard-content">
          {!stableFilters.start_date || !stableFilters.end_date ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#718096',
              background: '#f7fafc',
              border: '1px solid #e1e8ed',
              borderRadius: '10px',
              margin: '20px'
            }}>
              <h2>Loading Dashboard...</h2>
              <p>Setting up filters and date ranges...</p>
            </div>
          ) : (
          <>
            {/* Tab Navigation */}
            <div className="dashboard-tabs">
              <button 
                className={`tab-button ${activeTab === 'ai-insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai-insights')}
              >
                AI Insights
              </button>
              <button 
                className={`tab-button ${activeTab === 'deep-dive' ? 'active' : ''}`}
                onClick={() => setActiveTab('deep-dive')}
              >
                Deep Dive Analysis
              </button>
              <button 
                className={`tab-button ${activeTab === 'glossary' ? 'active' : ''}`}
                onClick={() => setActiveTab('glossary')}
              >
                KPI Glossary
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'glossary' ? (
              <ErrorBoundary>
                <KPIGlossary />
              </ErrorBoundary>
            ) : (
              <>
                {/* KPI Cards - shown in both AI Insights and Deep Dive Analysis */}
                <ErrorBoundary>
                  <KPISection filters={stableFilters} key={`${stableFilters.start_date}-${stableFilters.end_date}`} />
                </ErrorBoundary>

                {/* AI Insights Tab */}
                {activeTab === 'ai-insights' && (
                  <div className="dashboard-grid">
                    <ErrorBoundary>
                      <div className="graph-card">
                        <AIInsights filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <ConsumptionAnomaliesGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <AnomalyCategoriesGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                  </div>
                )}

                {/* Deep Dive Analysis Tab */}
                {activeTab === 'deep-dive' && (
                  <div className="dashboard-grid">
                    <ErrorBoundary>
                      <div className="graph-card">
                        <HourlyConsumptionGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <ZeroConsumptionGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <TopEventsGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <DailyEventsVolumeGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <EventsByWeekdayGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <div className="graph-card">
                        <SolarForecastGraph filters={stableFilters} />
                      </div>
                    </ErrorBoundary>
                  </div>
                )}
              </>
            )}
          </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

