import './StatusIndicator.css';

/**
 * StatusIndicator Component
 * Shows current application status
 */
function StatusIndicator({ status, message }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return '⚪';
      case 'initializing':
        return '🔄';
      case 'listening':
        return '🎤';
      case 'detecting':
        return '🎵';
      case 'error':
        return '⚠️';
      default:
        return '⚪';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'listening':
      case 'detecting':
        return 'active';
      case 'error':
        return 'error';
      case 'initializing':
        return 'initializing';
      default:
        return 'idle';
    }
  };

  return (
    <div className={`status-indicator ${getStatusClass()}`}>
      <span className="status-icon">{getStatusIcon()}</span>
      <span className="status-message">{message || status}</span>
    </div>
  );
}

export default StatusIndicator;
