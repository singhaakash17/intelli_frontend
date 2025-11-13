import React, { useState, useEffect } from 'react';
import KPICard from './KPICard';
import KPIDrilldownModal from './KPIDrilldownModal';
import { 
  getTotalEnergyConsumed, 
  getTotalPowerLoss, 
  getTotalDTUs, 
  getZeroEnergyUsers,
  getSolarConsumers,
  getTotalSolarExport
} from '../services/dashboardApi';
import './KPISection.css';

const KPISection = ({ filters }) => {
  const [kpis, setKpis] = useState({
    totalEnergy: { value: null, loading: true, error: null },
    totalPowerLoss: { value: null, loading: true, error: null },
    totalDTUs: { value: null, loading: true, error: null },
    zeroEnergyUsers: { value: null, loading: true, error: null },
    solarConsumers: { value: null, loading: true, error: null },
    totalSolarExport: { value: null, loading: true, error: null }
  });

  const [drilldownModal, setDrilldownModal] = useState({
    isOpen: false,
    kpiType: null,
    currentLevel: 'discom',
    data: null
  });

  useEffect(() => {
    // Only load KPIs if we have valid date filters
    // Check that dates are not empty strings and are valid dates
    if (filters && 
        filters.start_date && 
        filters.end_date && 
        filters.start_date.trim() !== '' && 
        filters.end_date.trim() !== '') {
      console.log('Loading KPIs with filters:', filters);
      loadKPIs();
    } else {
      console.log('KPIs not loaded - missing date filters:', filters);
    }
  }, [filters]);

  const loadKPIs = async () => {
      // Reset loading states
      setKpis(prev => ({
        totalEnergy: { ...prev.totalEnergy, loading: true, error: null },
        totalPowerLoss: { ...prev.totalPowerLoss, loading: true, error: null },
        totalDTUs: { ...prev.totalDTUs, loading: true, error: null },
        zeroEnergyUsers: { ...prev.zeroEnergyUsers, loading: true, error: null },
        solarConsumers: { ...prev.solarConsumers, loading: true, error: null },
        totalSolarExport: { ...prev.totalSolarExport, loading: true, error: null }
      }));

    // Load all KPIs in parallel
    try {
      const [energyRes, powerLossRes, dtusRes, zeroUsersRes, solarConsumersRes, solarExportRes] = await Promise.allSettled([
        getTotalEnergyConsumed(filters),
        getTotalPowerLoss(filters),
        getTotalDTUs(filters),
        getZeroEnergyUsers(filters),
        getSolarConsumers(filters),
        getTotalSolarExport(filters)
      ]);

      setKpis({
        totalEnergy: {
          value: energyRes.status === 'fulfilled' 
            ? (energyRes.value.total_energy_kwh ?? null)
            : null,
          loading: false,
          error: energyRes.status === 'rejected' 
            ? (energyRes.reason.response?.data?.detail || energyRes.reason.message || 'Failed to load')
            : null
        },
        totalPowerLoss: {
          value: powerLossRes.status === 'fulfilled' 
            ? (powerLossRes.value.total_power_loss_kwh ?? null)
            : null,
          loading: false,
          error: powerLossRes.status === 'rejected' 
            ? (powerLossRes.reason.response?.data?.detail || powerLossRes.reason.message || 'Failed to load')
            : null
        },
        totalDTUs: {
          value: dtusRes.status === 'fulfilled' 
            ? (dtusRes.value.total_dtus ?? null)
            : null,
          loading: false,
          error: dtusRes.status === 'rejected' 
            ? (dtusRes.reason.response?.data?.detail || dtusRes.reason.message || 'Failed to load')
            : null
        },
        zeroEnergyUsers: {
          value: zeroUsersRes.status === 'fulfilled' 
            ? (zeroUsersRes.value.zero_energy_users ?? null)
            : null,
          loading: false,
          error: zeroUsersRes.status === 'rejected' 
            ? (zeroUsersRes.reason.response?.data?.detail || zeroUsersRes.reason.message || 'Failed to load')
            : null
        },
        solarConsumers: {
          value: solarConsumersRes.status === 'fulfilled' 
            ? (solarConsumersRes.value.solar_consumers ?? null)
            : null,
          loading: false,
          error: solarConsumersRes.status === 'rejected' 
            ? (solarConsumersRes.reason.response?.data?.detail || solarConsumersRes.reason.message || 'Failed to load')
            : null
        },
        totalSolarExport: {
          value: solarExportRes.status === 'fulfilled' 
            ? (solarExportRes.value.total_solar_export_kwh ?? null)
            : null,
          loading: false,
          error: solarExportRes.status === 'rejected' 
            ? (solarExportRes.reason.response?.data?.detail || solarExportRes.reason.message || 'Failed to load')
            : null
        }
      });
    } catch (err) {
      console.error('Error loading KPIs:', err);
    }
  };

  const handleKPIClick = async (kpiType) => {
    // Determine current level based on filters
    let currentLevel = 'discom';
    if (filters.dtu_meter_no) {
      currentLevel = 'consumer';
    } else if (filters.feeder_meter_no) {
      currentLevel = 'dtu';
    } else if (filters.region_name) {
      currentLevel = 'feeder';
    } else if (filters.discom_name) {
      currentLevel = 'region';
    }

    // Get next level for breakdown
    const levels = ['discom', 'region', 'feeder', 'dtu', 'consumer'];
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    if (!nextLevel) {
      return; // Already at the deepest level
    }

    try {
      const { getKPIBreakdown } = await import('../services/dashboardApi');
      const response = await getKPIBreakdown(kpiType, nextLevel, filters);
      
      setDrilldownModal({
        isOpen: true,
        kpiType: kpiType,
        currentLevel: nextLevel,
        data: response
      });
    } catch (err) {
      console.error('Error loading KPI breakdown:', err);
    }
  };

  const handleDrilldown = async (nextLevel) => {
    try {
      const { getKPIBreakdown } = await import('../services/dashboardApi');
      const response = await getKPIBreakdown(drilldownModal.kpiType, nextLevel, filters);
      
      setDrilldownModal(prev => ({
        ...prev,
        currentLevel: nextLevel,
        data: response
      }));
    } catch (err) {
      console.error('Error loading drilldown:', err);
    }
  };

  return (
    <>
      <div className="kpi-section">
        <div onClick={() => handleKPIClick('total-energy-consumed')} style={{ cursor: 'pointer' }}>
          <KPICard
            title="Total Energy Consumed"
            value={kpis.totalEnergy.value}
            unit="kWh"
            icon="⚡"
            isLoading={kpis.totalEnergy.loading}
            error={kpis.totalEnergy.error}
          />
        </div>
        <div onClick={() => handleKPIClick('total-power-loss')} style={{ cursor: 'pointer' }}>
          <KPICard
            title="Total Power Loss"
            value={kpis.totalPowerLoss.value}
            unit="kWh"
            icon="📉"
            isLoading={kpis.totalPowerLoss.loading}
            error={kpis.totalPowerLoss.error}
          />
        </div>
        <div onClick={() => handleKPIClick('total-dtus')} style={{ cursor: 'pointer' }}>
          <KPICard
            title="Total DTUs"
            value={kpis.totalDTUs.value}
            unit=""
            icon="🏭"
            isLoading={kpis.totalDTUs.loading}
            error={kpis.totalDTUs.error}
          />
        </div>
        <div onClick={() => handleKPIClick('zero-energy-users')} style={{ cursor: 'pointer' }}>
          <KPICard
            title="Zero Energy Users"
            value={kpis.zeroEnergyUsers.value}
            unit=""
            icon="⚠️"
            isLoading={kpis.zeroEnergyUsers.loading}
            error={kpis.zeroEnergyUsers.error}
          />
        </div>
        <div onClick={() => handleKPIClick('solar-consumers')} style={{ cursor: 'pointer' }}>
          <KPICard
            title="Solar Consumers"
            value={kpis.solarConsumers.value}
            unit=""
            icon="☀️"
            isLoading={kpis.solarConsumers.loading}
            error={kpis.solarConsumers.error}
          />
        </div>
        <div onClick={() => handleKPIClick('total-solar-export')} style={{ cursor: 'pointer' }}>
          <KPICard
            title="Total Solar Export"
            value={kpis.totalSolarExport.value}
            unit="kWh"
            icon="🔋"
            isLoading={kpis.totalSolarExport.loading}
            error={kpis.totalSolarExport.error}
          />
        </div>
      </div>
      
      <KPIDrilldownModal
        isOpen={drilldownModal.isOpen}
        onClose={() => setDrilldownModal({ ...drilldownModal, isOpen: false })}
        kpiType={drilldownModal.kpiType}
        currentLevel={drilldownModal.currentLevel}
        data={drilldownModal.data}
        filters={filters}
        onDrilldown={handleDrilldown}
      />
    </>
  );
};

export default KPISection;

