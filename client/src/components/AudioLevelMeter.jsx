import './AudioLevelMeter.css';

/**
 * AudioLevelMeter Component
 * Displays real-time audio input level
 */
function AudioLevelMeter({ level }) {
  const percentage = Math.min(Math.round(level * 100), 100);
  const bars = 20;
  const activeBars = Math.round((percentage / 100) * bars);

  const getBarClass = (index) => {
    if (index >= activeBars) return 'bar';
    if (index >= bars * 0.8) return 'bar active red';
    if (index >= bars * 0.6) return 'bar active yellow';
    return 'bar active green';
  };

  return (
    <div className="audio-level-meter">
      <div className="level-label">
        <span>AUDIO LEVEL</span>
        <span className="level-value">{percentage}%</span>
      </div>
      <div className="level-bars">
        {Array.from({ length: bars }, (_, i) => (
          <div key={i} className={getBarClass(i)}></div>
        ))}
      </div>
    </div>
  );
}

export default AudioLevelMeter;
