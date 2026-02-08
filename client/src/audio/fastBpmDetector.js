import audioContext from './audioContext.js';
import { AudioAnalyzer } from './audioAnalyzer.js';
import FastBPMSmoother, { FAST_BPM_CONFIG, FAST_BEAT_TRACKING } from './fastDetection.js';
import { intervalToBpm } from './constants.js';

/**
 * Fast BPM Detector
 * Optimized for 3-second BPM detection with adaptive onset detection
 *
 * Key features:
 * - Spectral flux-based beat detection with adaptive thresholds
 * - Phase-based smoothing (initial -> transition -> stable)
 * - Faster convergence: 3 beats minimum (vs 4 standard)
 * - Increased update frequency: 50ms (vs 100ms standard)
 * - Aggressive initial smoothing that tapers over time
 */
export class FastBPMDetector {
  constructor(options = {}) {
    const {
      config = FAST_BPM_CONFIG,
      targetConvergenceTime = 3,
    } = options;

    this.config = config;
    this.targetConvergenceTime = targetConvergenceTime;
    this.analyzer = new AudioAnalyzer();
    this.smoother = new FastBPMSmoother(config);
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastUpdateTime = 0;
    this.startTime = null;

    // Callbacks
    this.callbacks = {
      onBpmUpdate: null,
      onBeat: null,
      onError: null,
      onAudioLevel: null,
      onConvergence: null,
      onPhaseChange: null,
      onCalibrationComplete: null,
    };

    // State tracking
    this.currentPhase = 'initial';
    this.firstBpmDetected = false;
    this.firstBpmTime = null;
    this.hasCalledConvergence = false;

    // Calibration state — reduced to 200ms for faster first reading
    this.calibrationComplete = false;
    this.calibrationSamples = [];
    this.calibrationDuration = 200; // ms
  }

  /**
   * Initialize and start fast BPM detection
   */
  async start() {
    try {
      // Reset state for clean restart
      this.resetState();

      // Initialize audio context with reduced smoothing for faster onset response
      const result = await audioContext.initialize({
        autoGainControl: false,
        noiseSuppression: false,
        smoothingTimeConstant: 0.6, // Lower than default 0.8 for sharper transients
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize audio');
      }

      await audioContext.resume();

      this.isRunning = true;
      this.startTime = Date.now();
      this.detectLoop();

      return {
        success: true,
        sampleRate: result.sampleRate,
        mode: 'fast-detection',
        targetConvergenceTime: this.targetConvergenceTime,
      };
    } catch (error) {
      console.error('Error starting fast BPM detector:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reset all internal state for a clean restart
   */
  resetState() {
    this.analyzer.reset();
    this.smoother.reset();
    this.lastUpdateTime = 0;
    this.startTime = null;
    this.currentPhase = 'initial';
    this.firstBpmDetected = false;
    this.firstBpmTime = null;
    this.hasCalledConvergence = false;
    this.calibrationComplete = false;
    this.calibrationSamples = [];
  }

  /**
   * Main detection loop with optimized timing
   */
  detectLoop() {
    if (!this.isRunning) return;

    const currentTime = audioContext.getCurrentTime();

    // Get frequency spectrum
    const spectrum = audioContext.getFloatFrequencyData();

    if (spectrum) {
      // Run calibration during first 500ms
      if (!this.calibrationComplete) {
        this.runCalibration(spectrum);
      }

      // Detect onsets (beat events) using enhanced analyzer
      const isOnset = this.analyzer.detectOnset(spectrum, currentTime);

      if (isOnset && this.callbacks.onBeat) {
        this.callbacks.onBeat(currentTime);
      }

      // Calculate BPM at higher frequency for faster convergence
      const updateInterval = this.config.updateInterval / 1000;
      const timeSinceUpdate = currentTime - this.lastUpdateTime;

      if (timeSinceUpdate >= updateInterval) {
        this.calculateBPMFast(currentTime);
        this.lastUpdateTime = currentTime;
      }

      // Update audio level
      if (this.callbacks.onAudioLevel) {
        const level = audioContext.getAudioLevel();
        this.callbacks.onAudioLevel(level);
      }

      // Monitor phase changes
      this.checkPhaseTransition();
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
  }

  /**
   * Auto-calibration phase: measure environment and adapt parameters
   * Runs during the first 500ms of detection
   */
  runCalibration(spectrum) {
    const elapsed = Date.now() - this.startTime;

    // Collect energy samples from spectrum values
    const energy = spectrum.reduce((sum, val) => sum + Math.abs(val), 0) / spectrum.length;
    this.calibrationSamples.push(energy);

    if (elapsed >= this.calibrationDuration) {
      this.calibrationComplete = true;

      // Analyze collected samples
      const avgEnergy = this.calibrationSamples.reduce((a, b) => a + b, 0)
        / this.calibrationSamples.length;
      const maxEnergy = Math.max(...this.calibrationSamples);

      // Linear energy: 0.001 = very weak, 0.01 = moderate, 0.05+ = strong
      // Adapt based on signal strength
      if (avgEnergy < 0.003) {
        // Very weak signal (distant source): boost sensitivity, enable gain
        this.analyzer.setSensitivity(1.6);
        this.analyzer.setFrequencyFocus('kick');
        audioContext.setGain(2.5);
        audioContext.setSmoothingTimeConstant(0.5);

        // Re-initialize with auto-gain if signal is extremely weak
        if (avgEnergy < 0.001) {
          this.reinitializeWithAutoGain();
        }
      } else if (avgEnergy < 0.02) {
        // Moderate signal (medium distance): slight boost
        this.analyzer.setSensitivity(1.3);
        this.analyzer.setFrequencyFocus('drums');
        audioContext.setGain(1.5);
      } else {
        // Strong signal (close range): standard settings
        this.analyzer.setSensitivity(1.0);
        this.analyzer.setFrequencyFocus('drums');
        audioContext.setGain(1.0);
      }

      if (this.callbacks.onCalibrationComplete) {
        this.callbacks.onCalibrationComplete({
          avgEnergy,
          maxEnergy,
          sensitivity: this.analyzer.sensitivity,
          frequencyFocus: this.analyzer.frequencyFocus,
        });
      }
    }
  }

  /**
   * Re-initialize microphone with auto-gain for very weak signals
   */
  async reinitializeWithAutoGain() {
    try {
      const result = await audioContext.initialize({
        autoGainControl: true,
        noiseSuppression: true,
        smoothingTimeConstant: 0.5,
      });
      if (result.success) {
        await audioContext.resume();
        audioContext.setGain(2.5);
      }
    } catch (error) {
      console.warn('Failed to reinitialize with auto-gain:', error);
    }
  }

  /**
   * Fast BPM calculation with fewer beats required
   */
  calculateBPMFast(currentTime) {
    const phase = this.smoother.getPhase();

    // Dynamic window size based on phase
    const windowSize = phase === 'initial'
      ? this.config.initialWindowSize
      : FAST_BPM_CONFIG.initialWindowSize;

    // Get recent onsets
    const onsets = this.analyzer.getRecentOnsets(windowSize, currentTime);

    // In initial phase, accept just 2 onsets (1 interval) for instant reading
    const minBeats = phase === 'initial' ? 2 : FAST_BEAT_TRACKING.minBeatsInWindow;

    if (onsets.length < minBeats) {
      return;
    }

    // Calculate inter-onset intervals
    const intervals = this.analyzer.calculateIntervals(onsets);

    if (intervals.length < 1) return;

    // Filter outliers (skip filtering with < 3 intervals, more permissive in initial phase)
    let filteredIntervals = intervals;
    if (intervals.length >= 3) {
      const outlierThreshold = phase === 'initial'
        ? this.config.minimalOutlierThreshold
        : FAST_BEAT_TRACKING.outlierThreshold;
      filteredIntervals = this.analyzer.filterOutliers(intervals, outlierThreshold);
    }

    if (filteredIntervals.length < 1) return;

    // Find dominant interval
    const { interval, confidence } = this.analyzer.findDominantInterval(
      filteredIntervals
    );

    if (interval === 0) return;

    // Convert to BPM
    const rawBpm = intervalToBpm(interval);

    // Process through fast smoother with phase awareness
    const result = this.smoother.processWithPhase(rawBpm, confidence);

    // Track first detection
    if (!this.firstBpmDetected && result.bpm > 0) {
      this.firstBpmDetected = true;
      this.firstBpmTime = this.smoother.getElapsedTime();
    }

    // Callback
    if (this.callbacks.onBpmUpdate && result.bpm > 0) {
      this.callbacks.onBpmUpdate({
        bpm: result.bpm,
        confidence: result.confidence,
        phase: result.phase,
        converged: result.converged,
        elapsedTime: this.smoother.getElapsedTime(),
        timestamp: currentTime,
      });
    }

    // Convergence callback
    if (result.converged && !this.hasCalledConvergence) {
      this.hasCalledConvergence = true;
      if (this.callbacks.onConvergence) {
        this.callbacks.onConvergence({
          bpm: result.bpm,
          confidence: result.confidence,
          convergenceTime: this.smoother.convergenceTime,
          estimatedAccuracy: this.estimateAccuracy(result.confidence),
        });
      }
    }
  }

  /**
   * Estimate accuracy based on confidence
   */
  estimateAccuracy(confidence) {
    if (confidence >= 0.9) return '±1 BPM';
    if (confidence >= 0.8) return '±1-2 BPM';
    if (confidence >= 0.7) return '±2-3 BPM';
    if (confidence >= 0.6) return '±3-4 BPM';
    if (confidence >= 0.5) return '±4-5 BPM';
    return '±5-10 BPM';
  }

  /**
   * Check for phase transitions and notify
   */
  checkPhaseTransition() {
    const newPhase = this.smoother.getPhase();
    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;

      // Reduce sensitivity as we stabilize
      if (newPhase === 'stable') {
        this.analyzer.setSensitivity(
          this.config.normalSensitivity || 1.0
        );
      }

      if (this.callbacks.onPhaseChange) {
        this.callbacks.onPhaseChange({
          phase: this.currentPhase,
          elapsedTime: this.smoother.getElapsedTime(),
        });
      }
    }
  }

  /**
   * Stop detection and release resources
   */
  stop() {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    audioContext.stop();
    this.analyzer.reset();
    this.smoother.reset();
    this.lastUpdateTime = 0;
  }

  // --- Callback registration ---

  onBpmUpdate(callback) {
    this.callbacks.onBpmUpdate = callback;
  }

  onBeat(callback) {
    this.callbacks.onBeat = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  onAudioLevel(callback) {
    this.callbacks.onAudioLevel = callback;
  }

  onConvergence(callback) {
    this.callbacks.onConvergence = callback;
  }

  onPhaseChange(callback) {
    this.callbacks.onPhaseChange = callback;
  }

  onCalibrationComplete(callback) {
    this.callbacks.onCalibrationComplete = callback;
  }

  // --- Getters ---

  getStats() {
    return {
      ...this.smoother.getDiagnostics(),
      analyzer: this.analyzer.getStats(),
      calibrationComplete: this.calibrationComplete,
    };
  }

  getPhase() {
    return this.smoother.getPhase();
  }

  isConverged() {
    return this.smoother.isConverged();
  }

  getConvergenceTime() {
    return this.smoother.convergenceTime;
  }

  getFirstDetectionTime() {
    return this.firstBpmTime;
  }

  getCurrentBPM() {
    return this.smoother.getCurrentBpm();
  }

  getCurrentConfidence() {
    return this.smoother.getAverageConfidence();
  }

  isActive() {
    return this.isRunning;
  }

  getBPMHistory() {
    return [...this.smoother.bpmHistory];
  }
}

export default FastBPMDetector;
