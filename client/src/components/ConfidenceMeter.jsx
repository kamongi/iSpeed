import './ConfidenceMeter.css';

/**
 * ConfidenceMeter Component
 * Displays BPM detection confidence as a progress bar
 */
function ConfidenceMeter({ confidence }) {
  const percentage = Math.round(confidence * 100);

  const getConfidenceLevel = () => {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.75) return 'medium';
    if (confidence >= 0.6) return 'low';
    return 'none';
  };

  const level = getConfidenceLevel();

  return (
    <div className="confidence-meter">
      <div className="confidence-header">
        <span className="confidence-label">Confidence</span>
        <span className="confidence-percentage">{percentage}%</span>
      </div>
      <div className="confidence-bar-container">
        <div
          className={`confidence-bar ${level}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="confidence-bar-glow"></div>
        </div>
      </div>
      <div className="confidence-indicator">
        <span className={`indicator-dot ${level}`}></span>
        <span className="indicator-text">
          {level === 'high' && 'Excellent'}
          {level === 'medium' && 'Good'}
          {level === 'low' && 'Fair'}
          {level === 'none' && 'Detecting...'}
        </span>
      </div>
    </div>
  );
}

export default ConfidenceMeter;
