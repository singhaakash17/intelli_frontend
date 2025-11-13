import React from 'react';
import './KPIGlossary.css';

const KPIGlossary = () => {

  const kpiDefinitions = [
    {
      id: 'total-energy-consumed',
      name: 'Total Energy Consumed',
      icon: '⚡',
      unit: 'kWh',
      description: 'The total amount of electrical energy consumed across all meters in the selected time period.',
      calculation: 'Sum of all WhImport values from FactBlockLoad table',
      formula: 'Σ(WhImport) / 1000',
      useCase: 'Measures overall energy demand and consumption patterns. Helps in capacity planning and demand forecasting.',
      interpretation: 'Higher values indicate greater energy consumption. Compare across different time periods or regions to identify consumption trends.',
      category: 'Consumption'
    },
    {
      id: 'total-power-loss',
      name: 'Total Power Loss',
      icon: '📉',
      unit: 'kWh',
      description: 'The difference between energy supplied at DTU level and energy consumed at consumer level, representing transmission and distribution losses.',
      calculation: 'DTU Consumption - Consumer Consumption',
      formula: 'Σ(WhImport_DTU) - Σ(WhImport_Consumer)',
      useCase: 'Identifies revenue leakage due to technical losses, theft, or meter malfunctions. Critical for revenue protection.',
      interpretation: 'Higher values indicate significant losses. Industry standard is 5-7%. Values above 10% require immediate investigation.',
      category: 'Loss Analysis'
    },
    {
      id: 'total-dtus',
      name: 'Total DTUs',
      icon: '🏭',
      unit: 'Count',
      description: 'The total number of distinct Distribution Transformer Units (DTUs) in the selected scope.',
      calculation: 'Count of distinct DTU meter numbers',
      formula: 'COUNT(DISTINCT DTUMeterNo)',
      useCase: 'Infrastructure monitoring and capacity assessment. Helps understand the scale of the distribution network.',
      interpretation: 'Represents the number of distribution points. Useful for calculating per-DTU metrics and identifying coverage areas.',
      category: 'Infrastructure'
    },
    {
      id: 'zero-energy-users',
      name: 'Zero Energy Users',
      icon: '⚠️',
      unit: 'Count',
      description: 'The number of consumers who have recorded zero energy consumption during the selected period.',
      calculation: 'Count of consumers with sum of WhImport = 0',
      formula: 'COUNT(DISTINCT ConsumerKey WHERE Σ(WhImport) = 0)',
      useCase: 'Identifies potential meter malfunctions, disconnected services, or revenue loss. Critical for revenue protection.',
      interpretation: 'High numbers may indicate meter issues, disconnected services, or potential theft. Investigate if percentage exceeds 15% of total consumers.',
      category: 'Anomaly Detection'
    },
    {
      id: 'solar-consumers',
      name: 'Solar Consumers',
      icon: '☀️',
      unit: 'Count',
      description: 'The number of consumers who have solar generation capacity and are exporting energy back to the grid.',
      calculation: 'Count of consumers with WhExport > 0',
      formula: 'COUNT(DISTINCT ConsumerKey WHERE WhExport > 0)',
      useCase: 'Tracks renewable energy adoption and grid support. Important for net metering and solar incentive programs.',
      interpretation: 'Higher numbers indicate greater solar adoption. Monitor growth trends to assess renewable energy penetration.',
      category: 'Renewable Energy'
    },
    {
      id: 'total-solar-export',
      name: 'Total Solar Export',
      icon: '🔋',
      unit: 'kWh',
      description: 'The total amount of solar energy exported back to the grid by all solar consumers.',
      calculation: 'Sum of all WhExport values where WhExport > 0',
      formula: 'Σ(WhExport WHERE WhExport > 0) / 1000',
      useCase: 'Measures renewable energy contribution to the grid. Important for grid balancing and renewable energy credits.',
      interpretation: 'Higher values indicate greater solar generation. Compare with consumption to assess net energy flow.',
      category: 'Renewable Energy'
    },
    {
      id: 'average-current',
      name: 'Average Current',
      icon: '🔌',
      unit: 'Amperes (A)',
      description: 'The average electrical current flowing through the system, calculated from the three-phase current readings.',
      calculation: 'Average of (CurrentIR + CurrentIY + CurrentIB) / 3',
      formula: 'AVG((CurrentIR + CurrentIY + CurrentIB) / 3)',
      useCase: 'System health monitoring and load balancing. Helps identify overload conditions and phase imbalances.',
      interpretation: 'Normal values depend on system capacity. Sudden spikes may indicate faults or overload conditions.',
      category: 'System Health'
    },
    {
      id: 'average-voltage',
      name: 'Average Voltage',
      icon: '⚡',
      unit: 'Volts (V)',
      description: 'The average voltage level across the three phases, indicating system voltage stability.',
      calculation: 'Average of (VoltageVRN + VoltageVYN + VoltageVBN) / 3',
      formula: 'AVG((VoltageVRN + VoltageVYN + VoltageVBN) / 3)',
      useCase: 'Voltage regulation monitoring. Critical for equipment protection and power quality assessment.',
      interpretation: 'Should be within ±5% of nominal voltage (typically 230V). Deviations indicate voltage regulation issues.',
      category: 'System Health'
    }
  ];

  const categories = ['All', 'Consumption', 'Loss Analysis', 'Infrastructure', 'Anomaly Detection', 'Renewable Energy', 'System Health'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredKPIs = selectedCategory === 'All' 
    ? kpiDefinitions 
    : kpiDefinitions.filter(kpi => kpi.category === selectedCategory);

  return (
    <div className="kpi-glossary-container">
      <div className="glossary-filters">
        {categories.map(category => (
          <button
            key={category}
            className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="kpi-glossary-table-wrapper">
        <table className="kpi-glossary-table">
          <thead>
            <tr>
              <th>KPI Name</th>
              <th>KPI Categories</th>
              <th>KPI Description</th>
              <th>KPI Formula</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {filteredKPIs.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-results-cell">
                  No KPIs found in the selected category.
                </td>
              </tr>
            ) : (
              filteredKPIs.map(kpi => (
                <tr key={kpi.id}>
                  <td className="kpi-name-cell">
                    <strong>{kpi.name}</strong>
                    <span className="kpi-unit-badge">{kpi.unit}</span>
                  </td>
                  <td className="kpi-category-cell">{kpi.category}</td>
                  <td className="kpi-description-cell">{kpi.description}</td>
                  <td className="kpi-formula-cell">
                    <code>{kpi.formula}</code>
                  </td>
                  <td className="kpi-interpretation-cell">{kpi.interpretation}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KPIGlossary;

