import { useState, useEffect, useRef, useCallback } from 'react';
import FastBPMDetector from './audio/fastBpmDetector.js';
import audioContext from './audio/audioContext.js';
import BeatIndicator from './components/BeatIndicator.jsx';
import ConfidenceMeter from './components/ConfidenceMeter.jsx';
import AudioLevelMeter from './components/AudioLevelMeter.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import './App.css';

function App() {
  const [bpm, setBpm] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('Ready to start');
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [convergenceTime, setConvergenceTime] = useState(null);

  const detectorRef = useRef(null);
  const beatCallbackRef = useRef(null);

  // Create detector on mount, clean up on unmount
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
        detectorRef.current = null;
      }
    };
  }, []);

  // Handle iOS AudioContext interruption (e.g. phone call, Siri)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && detectorRef.current?.isActive()) {
        // Page became visible again - try to resume audio context
        audioContext.resume().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const startDetection = useCallback(async () => {
    try {
      setStatus('initializing');
      setStatusMessage('Requesting microphone access...');
      setError(null);
      setConvergenceTime(null);
      setPhase('initial');

      // Create a fresh detector for each session
      const detector = new FastBPMDetector();
      detectorRef.current = detector;

      // Register callbacks before starting
      detector.onBpmUpdate((data) => {
        if (data.bpm > 0) {
          setBpm(data.bpm);
          setConfidence(data.confidence);
          setPhase(data.phase || 'stable');

          let phaseLabel = '';
          if (data.phase === 'initial') {
            phaseLabel = ' (INITIAL - converging...)';
          } else if (data.phase === 'transition') {
            phaseLabel = ' (verifying...)';
          } else if (data.converged) {
            phaseLabel = ' ✓';
          }

          setStatus('detecting');
          setStatusMessage(`${Math.round(data.bpm)} BPM${phaseLabel}`);
        }
      });

      detector.onConvergence((data) => {
        setConvergenceTime(data.convergenceTime);
        setStatus('converged');
        setStatusMessage(
          `BPM Locked: ${Math.round(data.bpm)} BPM ✓ (${data.convergenceTime.toFixed(1)}s)`
        );
      });

      detector.onPhaseChange((data) => {
        setPhase(data.phase);
      });

      detector.onBeat((timestamp) => {
        if (beatCallbackRef.current) {
          beatCallbackRef.current(timestamp);
        }
      });

      detector.onAudioLevel((level) => {
        setAudioLevel(level);
      });

      detector.onError((err) => {
        setError(err.message);
        setStatus('error');
        setStatusMessage(err.message);
      });

      const result = await detector.start();

      if (result.success) {
        setIsDetecting(true);
        setStatus('listening');
        setStatusMessage('Calibrating & listening for beats...');
      } else {
        throw new Error(result.error || 'Failed to start detection');
      }
    } catch (err) {
      console.error('Error starting detection:', err);
      setError(err.message);
      setStatus('error');
      setStatusMessage('Failed to access microphone');

      if (err.message.includes('Permission denied') || err.message.includes('denied')) {
        alert(
          'Microphone access denied. Please allow microphone access in your browser settings and try again.'
        );
      } else {
        alert(`Error: ${err.message}`);
      }
    }
  }, []);

  const stopDetection = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current = null;
    }
    setIsDetecting(false);
    setBpm(0);
    setConfidence(0);
    setAudioLevel(0);
    setStatus('idle');
    setStatusMessage('Detection stopped');
    setError(null);
    setConvergenceTime(null);
    setPhase('idle');
  }, []);

  const registerBeatCallback = useCallback((callback) => {
    beatCallbackRef.current = callback;
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>iSpeed</h1>
        <p className="tagline">Real-time BPM Detection</p>
        <StatusIndicator status={status} message={statusMessage} />
      </header>

      <main className="app-main">
        <div className="bpm-section">
          <div className="bpm-display">
            <div className="bpm-value">{bpm > 0 ? Math.round(bpm) : '--'}</div>
            <div className="bpm-label">BPM</div>
            {bpm > 0 && (
              <div className="bpm-decimal">.{Math.round((bpm % 1) * 10)}</div>
            )}
          </div>

          <BeatIndicator
            isActive={isDetecting}
            onBeat={registerBeatCallback}
          />
        </div>

        <div className="meters-section">
          <ConfidenceMeter confidence={confidence} />
          {isDetecting && <AudioLevelMeter level={audioLevel} />}
        </div>

        <div className="controls">
          {!isDetecting ? (
            <button
              className="btn btn-primary"
              onClick={startDetection}
              disabled={status === 'initializing'}
            >
              {status === 'initializing' ? 'Initializing...' : 'Start Detection'}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={stopDetection}>
              Stop Detection
            </button>
          )}
        </div>

        <div className="info">
          {!isDetecting && !error && (
            <div className="info-card">
              <h3>How to use:</h3>
              <ol>
                <li>Click "Start Detection" to begin</li>
                <li>Allow microphone access when prompted</li>
                <li>Play music or start your audio source</li>
                <li>View real-time BPM on screen</li>
                <li>Manually adjust grandMA3 speed to match BPM</li>
              </ol>
            </div>
          )}

          {isDetecting && bpm > 0 && (
            <div className="info-card tips">
              <h3>Detection Active:</h3>
              <ul>
                <li>Phase: <strong>{phase.toUpperCase()}</strong></li>
                {convergenceTime && <li>Converged in {convergenceTime.toFixed(1)}s</li>}
                <li>Auto-adapts to your distance from speakers</li>
                <li>Works best with steady-tempo music</li>
              </ul>
            </div>
          )}

          {!isDetecting && !error && (
            <div className="info-card tips">
              <h3>Features:</h3>
              <ul>
                <li>3-second convergence time</li>
                <li>Supports 60-200 BPM range</li>
                <li>Auto-calibrates for distance and noise</li>
                <li>Adapts to varying audio quality</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="info-card error-card">
              <h3>Error:</h3>
              <p>{error}</p>
              <p className="error-help">
                Make sure your browser has microphone permissions enabled for this site.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>iSpeed v1.0 - Real-time BPM Detection</p>
        <p className="footer-note">
          Manual grandMA3 Integration
        </p>
      </footer>
    </div>
  );
}

export default App;
