import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

const ChartRenderer = ({ chartData }) => {
  if (!chartData) {
    console.log('ChartRenderer: No chartData provided');
    return null;
  }

  // Validate chart data structure
  if (!chartData.type || !chartData.data || !Array.isArray(chartData.data)) {
    console.error('ChartRenderer: Invalid chart data structure', chartData);
    return null;
  }

  const { type, title, data, xKey = 'name', yKey = 'value', description } = chartData;
  
  // Validate data array
  if (data.length === 0) {
    console.warn('ChartRenderer: Empty data array');
    return null;
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey={yKey} fill="#8884d8" stroke="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  const chart = renderChart();
  
  if (!chart) {
    console.error('ChartRenderer: Failed to render chart of type:', type);
    return null;
  }

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {title && (
        <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#333', fontSize: '1em' }}>
          {title}
        </h4>
      )}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        {chart}
      </div>
      {description && (
        <p style={{ 
          marginTop: '8px', 
          marginBottom: 0, 
          fontSize: '0.9em', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default ChartRenderer;

