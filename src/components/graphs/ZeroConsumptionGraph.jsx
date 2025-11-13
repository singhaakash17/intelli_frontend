import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getZeroConsumptionTrend, getDetailView } from '../../services/dashboardApi';
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

const ZeroConsumptionGraph = ({ filters, onDrilldown }) => {
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
      const response = await getZeroConsumptionTrend({
        ...filters,
        drilldown_level: currentLevel
      });
      setData(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading zero consumption trend:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for chart: group by date, create columns for each month's trendline
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Get unique dates and months
    const dates = [...new Set(data.map(d => d.date))].sort();
    const months = [...new Set(data.map(d => `${d.year}-${d.month}-${d.month_name}`))].sort();
    
    // Calculate monthly averages (same for all days in a month)
    const monthlyAverages = {};
    months.forEach(monthKey => {
      const [year, month, monthName] = monthKey.split('-');
      const monthData = data.filter(
        d => d.year === parseInt(year) && d.month === parseInt(month)
      );
      if (monthData.length > 0) {
        const avg = monthData[0].monthly_avg || 0;
        monthlyAverages[monthKey] = avg;
      }
    });
    
    // Get overall average (same for all dates)
    const overallAvg = data.length > 0 ? (data[0].overall_avg || 0) : 0;
    
    // Create chart data structure
    const transformed = dates.map(date => {
      const dateData = data.find(d => d.date === date);
      const result = {
        date: date,
        dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        consumerCount: dateData ? dateData.consumer_count : 0,
        overallAvg: overallAvg
      };

      // Add monthly average for each month (for trendlines - same value for all days in that month)
      months.forEach(monthKey => {
        const [year, month, monthName] = monthKey.split('-');
        const dateObj = new Date(date);
        const isInMonth = dateObj.getFullYear() === parseInt(year) && 
                         (dateObj.getMonth() + 1) === parseInt(month);
        
        const key = `${monthName}_${year}`;
        // Only show monthly average for dates in that month
        result[key] = isInMonth ? (monthlyAverages[monthKey] || null) : null;
      });

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
        graph_type: 'zero-consumption-trend',
        data_point: {
          date: dataPoint.date,
          consumer_count: dataPoint.consumerCount
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
    const levels = ['discom', 'region', 'feeder', 'dtu', 'consumer'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : null;
  };

  const handleDrilldown = async (dataPoint, nextLevel) => {
    try {
      const currentData = modalData?.data || {};
      const detailResponse = await getDetailView({
        graph_type: 'zero-consumption-trend',
        data_point: {
          date: currentData.summary?.date || dataPoint.date,
          consumer_count: currentData.summary?.consumer_count || dataPoint.consumer_count,
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
          padding: '10px',
          minWidth: '200px'
        }}>
          <p style={{ color: '#00ffff', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '3px 0', fontSize: '12px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: entry.color, marginRight: '8px', verticalAlign: 'middle' }}></span>
              {`${entry.name}: ${entry.value?.toFixed(0) || '0'} consumers`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="graph-loading">Loading...</div>;
  if (error) return <div className="graph-error">Error: {error}</div>;
  
  // Ensure data is an array before mapping
  if (!Array.isArray(data)) {
    console.warn('ZeroConsumptionGraph: data is not an array:', data);
    return <div className="graph-error">Error: Invalid data format</div>;
  }

  return (
    <>
      <div className="graph-container">
        <h3 className="graph-title">Daily Trend of Zero Consumption Users</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={chartData} 
            onClick={handleDataPointClick}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.2)" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#00ffff"
              tick={{ fill: '#00ffff', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              stroke="#00ffff"
              tick={{ fill: '#00ffff' }}
              label={{ value: 'Consumer Count', angle: -90, position: 'insideLeft', fill: '#00ffff' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} active={!isModalOpen} />
            <Legend 
              wrapperStyle={{ color: '#00ffff', paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Daily consumer count line */}
            <Line
              type="monotone"
              dataKey="consumerCount"
              name="Daily Count"
              stroke="#00ffff"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            
            {/* Render Line for each month's trendline */}
            {months.map((month, index) => (
              <Line
                key={month.key}
                type="monotone"
                dataKey={month.key}
                name={month.label}
                stroke={MONTH_COLORS[index % MONTH_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
            
            {/* Overall Average Line */}
            <Line
              type="monotone"
              dataKey="overallAvg"
              name="Overall Average"
              stroke={MONTH_COLORS[MONTH_COLORS.length - 1]}
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
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
        title={`Zero Consumption Trend - ${currentLevel.toUpperCase()} Level`}
        currentLevel={currentLevel}
        onDrilldown={handleDrilldown}
      />
    </>
  );
};

export default ZeroConsumptionGraph;

