import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDailyEventsVolume, getDetailView } from '../../services/dashboardApi';
import DrilldownModal from '../DrilldownModal';

// Color palette for event names (will cycle if more events than colors)
const EVENT_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#00ff00', // Green
  '#ff8800', // Orange
  '#0088ff', // Blue
  '#ff0088', // Pink
  '#88ff00', // Lime
  '#ff4444', // Red
  '#00ff88', // Mint
  '#8800ff', // Purple
  '#ffaa00', // Amber
  '#00aaff', // Sky Blue
  '#ff00aa', // Rose
  '#aaff00', // Chartreuse
];

const DailyEventsVolumeGraph = ({ filters, onDrilldown }) => {
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
      const response = await getDailyEventsVolume(filters);
      setData(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading daily events volume:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for stacked bar chart: group by month, create columns for each event name
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Get unique months and event names (top 5 + Others)
    const months = [...new Set(data.map(d => `${d.year}-${d.month}-${d.month_name}`))].sort();
    const eventNames = [...new Set(data.map(d => d.event_name))].sort();
    
    // Sort event names: top events first, then "Others" at the end
    const sortedEventNames = eventNames.sort((a, b) => {
      if (a === 'Others') return 1;
      if (b === 'Others') return -1;
      return a.localeCompare(b);
    });

    // Create chart data structure
    const transformed = months.map(monthKey => {
      const [year, month, monthName] = monthKey.split('-');
      const result = {
        month: `${monthName} ${year}`,
        monthKey: monthKey,
        year: parseInt(year),
        monthNum: parseInt(month)
      };

      // Add event count for each event name
      sortedEventNames.forEach(eventName => {
        const eventData = data.find(
          d => `${d.year}-${d.month}-${d.month_name}` === monthKey &&
               d.event_name === eventName
        );
        // Use event name as key (sanitize for object key)
        const key = eventName.replace(/[^a-zA-Z0-9]/g, '_');
        result[key] = eventData ? eventData.event_count : 0;
      });

      return result;
    });

    return transformed;
  }, [data]);

  // Get unique event names for creating Bar components (top 5 + Others)
  const eventNames = useMemo(() => {
    if (!data || data.length === 0) return [];
    const names = [...new Set(data.map(d => d.event_name))];
    // Sort: top events first, "Others" last
    return names.sort((a, b) => {
      if (a === 'Others') return 1;
      if (b === 'Others') return -1;
      return a.localeCompare(b);
    });
  }, [data]);

  const handleDataPointClick = async (clickedData) => {
    try {
      const dataPoint = clickedData.activePayload[0].payload;
      const detailResponse = await getDetailView({
        graph_type: 'daily-events-volume',
        data_point: {
          month: dataPoint.month,
          event_count: dataPoint.event_count
        },
        filters: filters,
        detail_level: 'event_name' // Start at event name level
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
        graph_type: 'daily-events-volume',
        data_point: {
          month: currentData.summary?.month || dataPoint.month,
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

  // Custom tooltip component - shows event names and counts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      // Filter out zero values and sort by value (descending)
      const sortedPayload = payload
        .filter(entry => entry.value > 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));
      
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
          {sortedPayload.map((entry, index) => (
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

  return (
    <>
      <div className="graph-container">
        <h3 className="graph-title">Daily Events Volume by Month</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData} 
            onClick={handleDataPointClick}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.2)" />
            <XAxis 
              dataKey="month" 
              stroke="#00ffff"
              tick={{ fill: '#00ffff', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              stroke="#00ffff"
              tick={{ fill: '#00ffff' }}
              label={{ value: 'Event Volume', angle: -90, position: 'insideLeft', fill: '#00ffff' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} active={!isModalOpen} />
            <Legend 
              wrapperStyle={{ color: '#00ffff', paddingTop: '20px' }}
              iconType="square"
            />
            
            {/* Render Bar for each event name */}
            {eventNames.map((eventName, index) => {
              const key = eventName.replace(/[^a-zA-Z0-9]/g, '_');
              return (
                <Bar
                  key={eventName}
                  dataKey={key}
                  stackId="a"
                  name={eventName}
                  fill={EVENT_COLORS[index % EVENT_COLORS.length]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <DrilldownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData?.data}
        title="Daily Events Volume - Details"
        currentLevel={modalData?.data?.metadata?.detail_level || 'event_name'}
        onDrilldown={handleDrilldown}
      />
    </>
  );
};

export default DailyEventsVolumeGraph;

