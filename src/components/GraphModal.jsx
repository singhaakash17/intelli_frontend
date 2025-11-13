import React, { useRef, useEffect } from 'react';
import './GraphModal.css';

const GraphModal = ({ isOpen, onClose, title, children }) => {
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

  return (
    <div 
      className="graph-modal-overlay" 
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
        className="graph-modal-content" 
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="graph-modal-header">
          <h2>{title || 'Graph Details'}</h2>
          <button className="graph-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="graph-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GraphModal;

