import React, { useRef, useEffect } from 'react';
import './DrilldownModal.css';

const DrilldownModal = ({ isOpen, onClose, data, title, currentLevel, onDrilldown }) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Focus the modal content for accessibility
      if (contentRef.current) {
        contentRef.current.focus();
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on content
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleDataPointClick = (dataPoint, nextLevel) => {
    if (onDrilldown && nextLevel) {
      onDrilldown(dataPoint, nextLevel);
    }
  };

  const getNextLevel = (current) => {
    // For events-by-weekday, the hierarchy is: event_type -> event_name -> discom -> feeder -> dtu
    // DTU is the final level, so no further drilldown
    if (current === 'event_type') {
      return 'event_name';
    } else if (current === 'event_name') {
      return 'discom';
    } else if (current === 'discom') {
      return 'feeder';
    } else if (current === 'feeder') {
      return 'dtu';
    } else if (current === 'dtu') {
      return null; // DTU is the final level, no further drilldown
    }
    
    // For top-events, the hierarchy is: discom -> region -> feeder -> dtu
    if (current === 'discom') {
      return 'region';
    } else if (current === 'region') {
      return 'feeder';
    } else if (current === 'feeder') {
      return 'dtu';
    } else if (current === 'dtu') {
      return null; // DTU is the final level, no further drilldown
    }
    
    // Default hierarchy for other graph types
    const levels = ['discom', 'region', 'feeder', 'dtu', 'consumer'];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const renderDataTable = () => {
    if (!data || !data.detailed_data || data.detailed_data.length === 0) {
      return <p>No detailed data available</p>;
    }

    const nextLevel = getNextLevel(currentLevel);

    return (
      <div className="drilldown-table-container">
        <table className="drilldown-table">
          <thead>
            <tr>
              {Object.keys(data.detailed_data[0]).map((key) => (
                <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
              {nextLevel && <th>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {data.detailed_data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, idx) => (
                  <td key={idx}>{value}</td>
                ))}
                {nextLevel && (
                  <td>
                    <button
                      className="drilldown-btn"
                      onClick={() => handleDataPointClick(row, nextLevel)}
                      title={`Drill Down to ${nextLevel.toUpperCase()}`}
                    >
                      &gt;
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div 
      className="drilldown-modal-overlay" 
      ref={overlayRef}
      onClick={handleOverlayClick}
      onMouseDown={(e) => {
        // Prevent closing on mouse down events
        if (e.target === overlayRef.current) {
          e.preventDefault();
        }
      }}
    >
      <div 
        className="drilldown-modal-content" 
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="drilldown-modal-header">
          <h2>{title || 'Drilldown Details'}</h2>
          <button className="drilldown-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="drilldown-modal-body">
          {data?.summary && (
            <div className="drilldown-summary">
              <h3>Summary</h3>
              <div className="summary-grid">
                {Object.entries(data.summary).map(([key, value]) => (
                  <div key={key} className="summary-item">
                    <span className="summary-label">{key.replace(/_/g, ' ')}:</span>
                    <span className="summary-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {renderDataTable()}
        </div>
        
        <div className="drilldown-modal-footer">
          <div className="drilldown-breadcrumb">
            {currentLevel && (
              <>
                <span className="breadcrumb-level">{currentLevel.toUpperCase()}</span>
                {getNextLevel(currentLevel) && (
                  <>
                    <span className="breadcrumb-arrow">→</span>
                    <span className="breadcrumb-level">{getNextLevel(currentLevel)?.toUpperCase()}</span>
                  </>
                )}
              </>
            )}
          </div>
          <button className="drilldown-modal-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DrilldownModal;

