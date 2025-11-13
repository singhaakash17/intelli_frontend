import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DashboardHeader.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function DashboardHeader({ onFilterChange }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    discom_name: '',
    region_name: '',
    feeder_meter_no: '',
    dtu_meter_no: '',
    start_date: '',
    end_date: ''
  });

  const [options, setOptions] = useState({
    discoms: [],
    regions: [],
    feeders: [],
    dtus: []
  });

  const [loading, setLoading] = useState({
    discoms: false,
    regions: false,
    feeders: false,
    dtus: false
  });

  // Load DISCOMs on mount and set default dates
  useEffect(() => {
    loadDiscoms();
    // Set default dates: start date as 01-Jan-2025, end date as today
    const endDate = new Date();
    const startDate = new Date('2025-01-01'); // Default start date: 01-Jan-2025

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Set filters synchronously to ensure dates are available immediately
    const initialFilters = {
      discom_name: '',
      region_name: '',
      feeder_meter_no: '',
      dtu_meter_no: '',
      start_date: startDateStr,
      end_date: endDateStr
    };
    
    setFilters(initialFilters);
    
    // Immediately notify parent with initial dates (only on mount)
    if (onFilterChange) {
      onFilterChange(initialFilters);
    }
  }, []); // Only run on mount

  // Load regions when DISCOM changes
  useEffect(() => {
    if (filters.discom_name) {
      loadRegions(filters.discom_name);
      // Reset dependent filters
      setFilters(prev => ({ ...prev, region_name: '', feeder_meter_no: '', dtu_meter_no: '' }));
      setOptions(prev => ({ ...prev, regions: [], feeders: [], dtus: [] }));
    }
  }, [filters.discom_name]);

  // Load feeders when region changes
  useEffect(() => {
    if (filters.discom_name && filters.region_name) {
      loadFeeders(filters.discom_name, filters.region_name);
      // Reset dependent filters
      setFilters(prev => ({ ...prev, feeder_meter_no: '', dtu_meter_no: '' }));
      setOptions(prev => ({ ...prev, feeders: [], dtus: [] }));
    }
  }, [filters.discom_name, filters.region_name]);

  // Load DTUs when feeder changes
  useEffect(() => {
    if (filters.discom_name && filters.region_name && filters.feeder_meter_no) {
      loadDTUs(filters.discom_name, filters.region_name, filters.feeder_meter_no);
      // Reset dependent filter
      setFilters(prev => ({ ...prev, dtu_meter_no: '' }));
      setOptions(prev => ({ ...prev, dtus: [] }));
    }
  }, [filters.discom_name, filters.region_name, filters.feeder_meter_no]);

  const loadDiscoms = async () => {
    setLoading(prev => ({ ...prev, discoms: true }));
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/filters/discoms`, {
        timeout: 10000
      });
      setOptions(prev => ({ ...prev, discoms: response.data.data.discoms || [] }));
    } catch (error) {
      console.error('Error loading DISCOMs:', error);
    } finally {
      setLoading(prev => ({ ...prev, discoms: false }));
    }
  };

  const loadRegions = async (discomName) => {
    setLoading(prev => ({ ...prev, regions: true }));
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/filters/regions?discom_name=${encodeURIComponent(discomName)}`, {
        timeout: 10000
      });
      setOptions(prev => ({ ...prev, regions: response.data.data.regions || [] }));
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(prev => ({ ...prev, regions: false }));
    }
  };

  const loadFeeders = async (discomName, regionName) => {
    setLoading(prev => ({ ...prev, feeders: true }));
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/filters/feeders?discom_name=${encodeURIComponent(discomName)}&region_name=${encodeURIComponent(regionName)}`, {
        timeout: 10000
      });
      setOptions(prev => ({ ...prev, feeders: response.data.data.feeders || [] }));
    } catch (error) {
      console.error('Error loading feeders:', error);
    } finally {
      setLoading(prev => ({ ...prev, feeders: false }));
    }
  };

  const loadDTUs = async (discomName, regionName, feederMeterNo) => {
    setLoading(prev => ({ ...prev, dtus: true }));
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/filters/dtus?discom_name=${encodeURIComponent(discomName)}&region_name=${encodeURIComponent(regionName)}&feeder_meter_no=${encodeURIComponent(feederMeterNo)}`, {
        timeout: 10000
      });
      setOptions(prev => ({ ...prev, dtus: response.data.data.dtus || [] }));
    } catch (error) {
      console.error('Error loading DTUs:', error);
    } finally {
      setLoading(prev => ({ ...prev, dtus: false }));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    // Only notify parent when Apply button is clicked
    if (onFilterChange && filters.start_date && filters.end_date) {
      onFilterChange(filters);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_data');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-header-container">
      {/* Top Section - Title */}
      <div className="dashboard-header-top">
        <div className="header-left">
          <span className="intellismart-logo">IntelliSmart</span>
        </div>
        <div className="header-center">
          <h1 className="dashboard-title">
            Smart Revenue Leakage Detection
          </h1>
        </div>
        <div className="header-right">
          <button 
            className="glossary-button" 
            onClick={() => navigate('/kpi-glossary')} 
            title="KPI Glossary"
          >
            <span>KPI Glossary</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="notification-button" title="Notifications">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="notification-badge">3</span>
          </button>
          <button className="logout-button" onClick={handleLogout} title="Logout">
            <span>Logout</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lower Section - Filters */}
      <div className="dashboard-header-filters">
        <div className="filter-group">
          <label className="filter-label">DISCOM</label>
          <select
            className="filter-select"
            value={filters.discom_name}
            onChange={(e) => handleFilterChange('discom_name', e.target.value)}
            disabled={loading.discoms}
          >
            <option value="">All DISCOMs</option>
            {options.discoms.map((discom) => (
              <option key={discom.discom_name} value={discom.discom_name}>
                {discom.discom_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Region</label>
          <select
            className="filter-select"
            value={filters.region_name}
            onChange={(e) => handleFilterChange('region_name', e.target.value)}
            disabled={!filters.discom_name || loading.regions}
          >
            <option value="">All Regions</option>
            {options.regions.map((region) => (
              <option key={region.region_name} value={region.region_name}>
                {region.region_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Feeder</label>
          <select
            className="filter-select"
            value={filters.feeder_meter_no}
            onChange={(e) => handleFilterChange('feeder_meter_no', e.target.value)}
            disabled={!filters.region_name || loading.feeders}
          >
            <option value="">All Feeders</option>
            {options.feeders.map((feeder) => (
              <option key={feeder.feeder_meter_no} value={feeder.feeder_meter_no}>
                {feeder.feeder_meter_no}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">DTU</label>
          <select
            className="filter-select"
            value={filters.dtu_meter_no}
            onChange={(e) => handleFilterChange('dtu_meter_no', e.target.value)}
            disabled={!filters.feeder_meter_no || loading.dtus}
          >
            <option value="">All DTUs</option>
            {options.dtus.map((dtu) => (
              <option key={dtu.dtu_meter_no} value={dtu.dtu_meter_no}>
                {dtu.dtu_meter_no}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Start Date</label>
          <input
            type="date"
            className="filter-date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">End Date</label>
          <input
            type="date"
            className="filter-date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" style={{ visibility: 'hidden' }}>Apply</label>
          <button 
            className="filter-apply-button"
            onClick={handleApplyFilters}
            disabled={!filters.start_date || !filters.end_date}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;

