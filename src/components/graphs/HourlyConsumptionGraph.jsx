import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHourlyConsumption, getDetailView } from '../../services/dashboardApi';
import DrilldownModal from '../DrilldownModal';

// Color palette for months (12 colors + 1 for average)
const MONTH_COLORS = [
  '#00ffff', // Cyan - January
  '#ff00ff', // Magenta - February
  '#ffff00', // Yellow - March
  '#00ff00', // Green - April
  '#ff8800', // Orange - May
  '#0088ff', // Blue - June
  '#ff0088', // Pink - July
  '#88ff00', // Lime - August
  '#ff0088', // Rose - September
  '#0088ff', // Sky Blue - October
  '#ff8800', // Amber - November
  '#00ff88', // Mint - December
  '#ffffff'  // White - Overall Average
];

const HourlyConsumptionGraph = ({ filters, onDrilldown }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('discom');

  useEffect(() => {
    if (filters && filters.start_date && filters.end_date) {
      loadData();
    }
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHourlyConsumption({
        ...filters,
        drilldown_level: currentLevel
      });
      setData(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      console.error('Error loading hourly consumption:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for chart: group by interval, create columns for each month
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Return empty intervals if no data
      const intervalLabels = [
        '12 AM - 2 AM', '2 AM - 4 AM', '4 AM - 6 AM', '6 AM - 8 AM',
        '8 AM - 10 AM', '10 AM - 12 PM', '12 PM - 2 PM', '2 PM - 4 PM',
        '4 PM - 6 PM', '6 PM - 8 PM', '8 PM - 10 PM', '10 PM - 12 AM'
      ];
      return intervalLabels.map((label, i) => ({
        interval: i * 2,
        intervalLabel: label
      }));
    }

    // Get unique intervals and months
    const intervals = [...new Set(data.map(d => d.hour_interval))].sort((a, b) => a - b);
    const months = [...new Set(data.map(d => `${d.year}-${d.month}-${d.month_name}`))].sort();
    
    // Create chart data structure
    const transformed = intervals.map(interval => {
      const intervalData = data.find(d => d.hour_interval === interval);
      const result = {
        interval: interval,
        intervalLabel: intervalData?.interval_label || 
          (interval === 0 ? '12 AM - 2 AM' :
           interval === 2 ? '2 AM - 4 AM' :
           interval === 4 ? '4 AM - 6 AM' :
           interval === 6 ? '6 AM - 8 AM' :
           interval === 8 ? '8 AM - 10 AM' :
           interval === 10 ? '10 AM - 12 PM' :
           interval === 12 ? '12 PM - 2 PM' :
           interval === 14 ? '2 PM - 4 PM' :
           interval === 16 ? '4 PM - 6 PM' :
           interval === 18 ? '6 PM - 8 PM' :
           interval === 20 ? '8 PM - 10 PM' :
           interval === 22 ? '10 PM - 12 AM' : `${interval} AM - ${interval + 2} AM`)
      };

      // Add consumption for each month
      months.forEach(monthKey => {
        const [year, month, monthName] = monthKey.split('-');
        const monthData = data.find(
          d => d.hour_interval === interval && 
               d.year === parseInt(year) && 
               d.month === parseInt(month)
        );
        const key = `${monthName}_${year}`;
        result[key] = monthData ? parseFloat(monthData.consumption_kwh || 0) : null;
      });

      // Add overall average (same for all months in the interval)
      const overallData = data.find(d => d.hour_interval === interval);
      result['Overall Average'] = overallData ? parseFloat(overallData.overall_avg_kwh || 0) : null;

      return result;
    });

    return transformed;
  }, [data]);

  // Get unique months for creating Line components
  const months = useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueMonths = [...new Set(data.map(d => `${d.year}-${d.month}-${d.month_name}`))].sort();
    return uniqueMonths.map(monthKey => {
      const [year, month, monthName] = monthKey.split('-');
      return {
        key: `${monthName}_${year}`,
        label: `${monthName} ${year}`,
        year: parseInt(year),
        month: parseInt(month)
      };
    });
  }, [data]);

  const handleDataPointClick = async (clickedData) => {
    try {
      const dataPoint = clickedData.activePayload[0].payload;
      const detailResponse = await getDetailView({
        graph_type: 'hourly-consumption',
        data_point: {
          hour_interval: dataPoint.interval,
          consumption_kwh: dataPoint.consumption_kwh
        },
        filters: filters,
        detail_level: 'discom' // Start at DISCOM level
      });
      
      setModalData(detailResponse);
      setCurrentLevel('discom');
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error loading detail view:', err);
    }
  };

  const getNextLevel = (current) => {
    const levels = ['discom', 'region', 'feeder', 'dtu'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : null;
  };

  const handleDrilldown = async (dataPoint, nextLevel) => {
    try {
      const currentData = modalData?.data || {};
      const detailResponse = await getDetailView({
        graph_type: 'hourly-consumption',
        data_point: {
          hour_interval: currentData.summary?.hour_interval || dataPoint.hour_interval,
          consumption_kwh: currentData.summary?.consumption_kwh || dataPoint.consumption_kwh,
          ...dataPoint
        },
        filters: filters,
        detail_level: nextLevel
      });
      
      setModalData(detailResponse);
      setCurrentLevel(nextLevel);
    } catch (err) {
      console.error('Error loading drilldown:', err);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(0, 255, 255, 0.5)',
          borderRadius: '5px',
          padding: '10px'
        }}>
          <p style={{ color: '#00ffff', marginBottom: '5px', fontWeight: 'bold' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
              {`${entry.name}: ${entry.value?.toFixed(2) || '0.00'} kWh`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="graph-loading">Loading...</div>;
  
  if (error && data.length === 0) {
    return (
      <div className="graph-container">
        <h3 className="graph-title">Hourly Consumption</h3>
        <div className="graph-error">Error: {error}</div>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: '10px' }}>
          Please ensure the backend API is running and accessible.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="graph-container">
        <h3 className="graph-title">Hourly Consumption (2-Hour Intervals)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} onClick={handleDataPointClick} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.2)" />
            <XAxis 
              dataKey="intervalLabel" 
              stroke="#00ffff"
              tick={{ fill: '#00ffff', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              stroke="#00ffff"
              tick={{ fill: '#00ffff' }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#00ffff' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} active={!isModalOpen} />
            <Legend 
              wrapperStyle={{ color: '#00ffff', paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Render Line for each month */}
            {months.map((month, index) => (
              <Line
                key={month.key}
                type="monotone"
                dataKey={month.key}
                name={month.label}
                stroke={MONTH_COLORS[index % MONTH_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
            
            {/* Overall Average Line */}
            <Line
              type="monotone"
              dataKey="Overall Average"
              name="Overall Average"
              stroke={MONTH_COLORS[MONTH_COLORS.length - 1]}
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <DrilldownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData?.data}
        title={`Hourly Consumption - ${currentLevel.toUpperCase()} Level`}
        currentLevel={currentLevel}
        onDrilldown={handleDrilldown}
      />
    </>
  );
};

export default HourlyConsumptionGraph;

