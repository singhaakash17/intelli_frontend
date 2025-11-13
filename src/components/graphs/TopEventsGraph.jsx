import React, { useState, useEffect, useMemo } from 'react';
import { getTopEvents, getDetailView } from '../../services/dashboardApi';
import DrilldownModal from '../DrilldownModal';
import './TopEventsGraph.css';

const TopEventsGraph = ({ filters, onDrilldown }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventType, setEventType] = useState('Critical');
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('discom');

  useEffect(() => {
    if (filters && filters.start_date && filters.end_date) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, eventType]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTopEvents({
        ...filters,
        event_type: eventType === 'All' ? undefined : eventType,
        limit: 100 // Increased limit to get more events for word cloud
      });
      // normalizeGraphResponse should extract the data array
      const eventsData = response.data || [];
      setData(eventsData);
      
      // Log for debugging
      console.log('TopEventsGraph: Loaded', eventsData.length, 'events');
      if (eventsData.length === 0) {
        console.warn('TopEventsGraph: No events returned from API');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading top events:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate font sizes and positions for word cloud
  const wordCloudData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sorted = [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
    const maxCount = sorted[0]?.count || 1;
    const minCount = sorted[sorted.length - 1]?.count || 1;
    
    // Handle case where all counts are the same (avoid division by zero)
    const countRange = maxCount - minCount;
    
    // Create word cloud with random rotations and better distribution
    // Reduced font sizes to fit better in container
    return sorted.map((item, index) => {
      const count = item.count || 0;
      // Calculate font size: min 12px, max 48px based on count (reduced from 16-72)
      let fontSize = 12;
      if (countRange > 0) {
        fontSize = Math.max(12, Math.min(48, 12 + ((count - minCount) / countRange) * 36));
      } else {
        // If all counts are the same, use a medium size
        fontSize = 24;
      }
      
      // Determine color based on event type (check if it contains "Critical" but not "Non-Critical")
      const eventTypeUpper = (item.event_type || '').toUpperCase();
      const isCritical = eventTypeUpper.includes('CRITICAL') && !eventTypeUpper.includes('NON-CRITICAL');
      
      // Add random rotation for cloud effect (-15 to +15 degrees)
      // Use index to create consistent rotation per word
      const rotation = (index % 7) * 5 - 15; // -15, -10, -5, 0, 5, 10, 15, then repeat
      
      // Calculate percentage
      const percentage = countRange > 0 && maxCount > 0 
        ? ((count / maxCount) * 100).toFixed(1) 
        : '0.0';
      
      return {
        text: item.event_name || 'Unknown',
        count: count,
        fontSize: fontSize,
        color: isCritical ? '#ff4444' : '#00ffff',
        event_type: item.event_type,
        event_code: item.event_code,
        rotation: rotation,
        percentage: percentage
      };
    });
  }, [data]);

  const handleWordClick = async (wordData) => {
    try {
      const detailResponse = await getDetailView({
        graph_type: 'top-events',
        data_point: {
          event_name: wordData.text,
          event_code: wordData.event_code,
          count: wordData.count
        },
        filters: filters,
        detail_level: 'discom' // Start drilldown at DISCOM level
      });
      
      setModalData(detailResponse);
      setCurrentLevel('discom');
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error loading detail view:', err);
    }
  };

  const handleDrilldown = async (dataPoint, nextLevel) => {
    try {
      const currentData = modalData?.data || {};
      const detailResponse = await getDetailView({
        graph_type: 'top-events',
        data_point: {
          event_name: currentData.summary?.event_name || dataPoint.event_name,
          event_code: currentData.summary?.event_code || dataPoint.event_code,
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

  const getNextLevel = (current) => {
    const levels = ['discom', 'region', 'feeder', 'dtu'];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  if (loading) return <div className="graph-loading">Loading...</div>;
  if (error) return <div className="graph-error">Error: {error}</div>;

  // Render word cloud content
  const renderWordCloud = () => {
    if (wordCloudData.length === 0) {
      return (
        <div className="graph-error" style={{ padding: '20px', textAlign: 'center' }}>
          No events found for the selected filters and date range.
        </div>
      );
    }
    return (
      <div className="word-cloud-container">
        {wordCloudData.map((word, index) => (
          <span
            key={`${word.text}-${index}`}
            className="word-cloud-word"
            style={{
              fontSize: `${word.fontSize}px`,
              color: word.color,
              fontWeight: word.count > 100 ? 'bold' : word.count > 50 ? '600' : 'normal',
              transform: `rotate(${word.rotation}deg)`,
              display: 'inline-block'
            }}
            onClick={() => handleWordClick(word)}
            title={`${word.text}: ${word.count} occurrences (${word.percentage || 0}%)`}
          >
            {word.text}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="graph-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 className="graph-title" style={{ margin: 0 }}>Top Occurring Events</h3>
          <div className="graph-filter-container-top-right">
            <select 
              className="event-type-filter"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="All">All Events</option>
              <option value="Critical">Critical</option>
              <option value="Non-Critical">Non-Critical</option>
            </select>
          </div>
        </div>
        {renderWordCloud()}
      </div>
      
      <DrilldownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData?.data}
        title={`Top Events - ${modalData?.data?.summary?.event_name || ''}`}
        currentLevel={currentLevel}
        onDrilldown={handleDrilldown}
      />
    </>
  );
};

export default TopEventsGraph;

