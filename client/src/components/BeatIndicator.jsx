import { useState, useEffect } from 'react';
import './BeatIndicator.css';

/**
 * BeatIndicator Component
 * Visual metronome that flashes on each detected beat
 */
function BeatIndicator({ isActive, onBeat }) {
  const [isBeat, setIsBeat] = useState(false);

  useEffect(() => {
    if (!onBeat) return;

    const handleBeat = () => {
      setIsBeat(true);
      setTimeout(() => setIsBeat(false), 100);
    };

    onBeat(handleBeat);
  }, [onBeat]);

  return (
    <div className={`beat-indicator ${isBeat ? 'active' : ''} ${!isActive ? 'inactive' : ''}`}>
      <div className="beat-pulse"></div>
      <div className="beat-label">BEAT</div>
    </div>
  );
}

export default BeatIndicator;
