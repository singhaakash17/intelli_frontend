import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getEventsByWeekday, getDetailView } from '../../services/dashboardApi';
import DrilldownModal from '../DrilldownModal';

const EventsByWeekdayGraph = ({ filters, onDrilldown }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (filters && filters.start_date && filters.end_date) {
      loadData();
    }
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventsByWeekday(filters);
      setData(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading events by weekday:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataPointClick = async (clickedData) => {
    try {
      const dataPoint = clickedData.activePayload[0].payload;
      const detailResponse = await getDetailView({
        graph_type: 'events-by-weekday',
        data_point: {
          weekday: dataPoint.weekday,
          critical_count: dataPoint.critical,
          non_critical_count: dataPoint.nonCritical,
          total_count: dataPoint.total
        },
        filters: filters,
        detail_level: 'event_type' // Start with event type (Critical/Non-Critical)
      });
      
      setModalData(detailResponse);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error loading detail view:', err);
    }
  };

  const handleDrilldown = async (dataPoint, nextLevel) => {
    try {
      const currentData = modalData?.data || {};
      const detailResponse = await getDetailView({
        graph_type: 'events-by-weekday',
        data_point: {
          weekday: currentData.summary?.weekday || dataPoint.weekday,
          event_type: dataPoint.event_type || currentData.summary?.event_type,
          event_name: dataPoint.event_name || currentData.summary?.event_name,
          ...dataPoint
        },
        filters: filters,
        detail_level: nextLevel
      });
      
      setModalData(detailResponse);
    } catch (err) {
      console.error('Error loading drilldown:', err);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(0, 255, 255, 0.5)',
          borderRadius: '5px',
          padding: '10px',
          minWidth: '200px'
        }}>
          <p style={{ color: '#00ffff', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '3px 0', fontSize: '12px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: entry.color, marginRight: '8px', verticalAlign: 'middle' }}></span>
              {`${entry.name}: ${entry.value || 0}`}
            </p>
          ))}
          <p style={{ 
            color: '#00ffff', 
            marginTop: '8px', 
            fontWeight: 'bold', 
            borderTop: '1px solid rgba(0, 255, 255, 0.3)', 
            paddingTop: '8px',
            fontSize: '13px'
          }}>
            Total: {total}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="graph-loading">Loading...</div>;
  if (error) return <div className="graph-error">Error: {error}</div>;

  // Map data to chart format, maintaining weekday order
  const chartData = data.map(item => ({
    weekday: item.weekday,
    critical: item.critical_count || 0,
    nonCritical: item.non_critical_count || 0,
    total: (item.critical_count || 0) + (item.non_critical_count || 0)
  }));

  return (
    <>
      <div className="graph-container">
        <h3 className="graph-title">Events Volume vs Weekday Name</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData} 
            onClick={handleDataPointClick}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.2)" />
            <XAxis 
              dataKey="weekday" 
              stroke="#00ffff"
              tick={{ fill: '#00ffff', fontSize: 12 }}
            />
            <YAxis 
              stroke="#00ffff"
              tick={{ fill: '#00ffff' }}
              label={{ value: 'Count of Events', angle: -90, position: 'insideLeft', fill: '#00ffff' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} active={!isModalOpen} />
            <Legend 
              wrapperStyle={{ color: '#00ffff', paddingTop: '20px' }}
              iconType="square"
            />
            <Bar dataKey="critical" stackId="a" fill="#ff4444" name="Critical" />
            <Bar dataKey="nonCritical" stackId="a" fill="#00ffff" name="Non-Critical" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <DrilldownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData?.data}
        title={`Events by Weekday - ${modalData?.data?.summary?.weekday || ''}`}
        currentLevel={modalData?.data?.metadata?.detail_level || 'event_type'}
        onDrilldown={handleDrilldown}
      />
    </>
  );
};

export default EventsByWeekdayGraph;

