/**
 * Fast BPM Detection Configuration
 * Optimized for sub-1-second first reading with progressive accuracy
 *
 * Strategy:
 * 1. Accept 2 onsets (1 interval) for instant first reading (~0.5-1s)
 * 2. ~40 Hz update rate for minimal latency
 * 3. Near-instant smoothing alpha (0.85) locks first value immediately
 * 4. Progressive refinement: alpha decreases from 0.85 → 0.2 over 10s
 * 5. Calibration reduced to 200ms
 */

export const FAST_BPM_CONFIG = {
  // Timing — sub-1-second first reading
  minBeatsForInitialDetection: 2,    // Show BPM after just 2 onsets (1 interval)
  initialWindowSize: 1.5,            // Analyze 1.5s window
  updateInterval: 25,                // Update every 25ms (~40 Hz)
  initialLockTime: 1000,             // Initial phase lasts 1 second
  transitionTime: 4000,              // Transition from fast→normal over 4 seconds

  // Early detection settings
  earlyConfidenceThreshold: 0.3,     // Very low bar for first reading
  earlyConsensusThreshold: 0.4,      // Consensus triggers early

  // Smoothing strategy (instant lock then progressive refinement)
  initialSmoothingFactor: 0.85,      // Near-instant lock on first BPM
  normalSmoothingFactor: 0.2,        // Slow, stable smoothing after 5s
  transitionSmoothingFactor: 0.35,   // Intermediate during transition

  // Adaptive threshold (for enhanced analyzer)
  initialSensitivity: 1.5,           // 50% more sensitive at start
  normalSensitivity: 1.0,            // Standard after stabilization
  minimalOutlierThreshold: 0.5,      // Very permissive initially
  normalOutlierThreshold: 0.3,       // Standard filtering after lock

  // History management (progressive growth)
  initialHistorySize: 2,             // Just 2 values for instant decision
  normalHistorySize: 20,             // Long history for stable accuracy

  // Validation
  allowDoubleTimeCorrection: true,   // Fix half/double-time immediately
  enablePeakTracking: true,          // Monitor energy peaks
};

export const FAST_BEAT_TRACKING = {
  windowSize: 1.5,                   // Short window for fast analysis
  minBeatsInWindow: 2,               // Just 2 onsets needed (1 interval)
  outlierThreshold: 0.5,             // Very permissive initially
};

/**
 * Fast BPM Smoother - Sub-1-second first reading with progressive accuracy
 *
 * Phase timeline:
 *   0-1s:   "initial"    — alpha=0.85, accept anything, instant lock
 *   1-5s:   "transition" — alpha ramps 0.85→0.2, history grows, accuracy improves
 *   5s+:    "stable"     — alpha=0.2, long history, high accuracy
 */
export class FastBPMSmoother {
  constructor(config = FAST_BPM_CONFIG) {
    this.config = config;
    this.currentBpm = 0;
    this.smoothedBpm = 0;
    this.bpmHistory = [];
    this.confidenceHistory = [];
    this.startTime = Date.now();
    this.lastUpdateTime = 0;
    this.consensusBuffer = [];
    this.hasConverged = false;
    this.convergenceTime = null;
    this.updateCount = 0;
  }

  /**
   * Get elapsed time since start
   */
  getElapsedTime() {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Get current smoothing phase
   * 0-1s: "initial", 1-5s: "transition", 5+s: "stable"
   */
  getPhase() {
    const elapsed = this.getElapsedTime();
    if (elapsed < this.config.initialLockTime / 1000) {
      return 'initial';
    }
    if (elapsed < (this.config.initialLockTime + this.config.transitionTime) / 1000) {
      return 'transition';
    }
    return 'stable';
  }

  /**
   * Get current smoothing factor — ramps down progressively
   */
  getSmoothingFactor() {
    const phase = this.getPhase();

    if (phase === 'initial') {
      return this.config.initialSmoothingFactor;
    }

    if (phase === 'transition') {
      const elapsed = this.getElapsedTime();
      const transitionStart = this.config.initialLockTime / 1000;
      const transitionEnd = (this.config.initialLockTime + this.config.transitionTime) / 1000;
      const progress = (elapsed - transitionStart) / (transitionEnd - transitionStart);

      // Smooth ramp from initial (0.85) → normal (0.2)
      return this.config.initialSmoothingFactor * (1 - progress) +
             this.config.normalSmoothingFactor * progress;
    }

    return this.config.normalSmoothingFactor;
  }

  /**
   * Get current confidence threshold — very low initially, rises over time
   */
  getConfidenceThreshold() {
    const phase = this.getPhase();

    if (phase === 'initial') {
      return this.config.earlyConfidenceThreshold; // 0.3
    }

    if (phase === 'transition') {
      const elapsed = this.getElapsedTime();
      const transitionStart = this.config.initialLockTime / 1000;
      const transitionEnd = (this.config.initialLockTime + this.config.transitionTime) / 1000;
      const progress = (elapsed - transitionStart) / (transitionEnd - transitionStart);
      // Ramp from 0.3 → 0.6
      return this.config.earlyConfidenceThreshold * (1 - progress) + 0.6 * progress;
    }

    return 0.6;
  }

  /**
   * Get progressive history size — grows over time for better accuracy
   */
  getMaxHistorySize() {
    const phase = this.getPhase();
    if (phase === 'initial') {
      return this.config.initialHistorySize; // 2
    }
    if (phase === 'transition') {
      const elapsed = this.getElapsedTime();
      const transitionStart = this.config.initialLockTime / 1000;
      const transitionEnd = (this.config.initialLockTime + this.config.transitionTime) / 1000;
      const progress = (elapsed - transitionStart) / (transitionEnd - transitionStart);
      // Ramp from 2 → 20
      return Math.round(
        this.config.initialHistorySize * (1 - progress) +
        this.config.normalHistorySize * progress
      );
    }
    return this.config.normalHistorySize; // 20
  }

  /**
   * Apply adaptive smoothing
   */
  smooth(newBpm, alpha = null) {
    if (alpha === null) {
      alpha = this.getSmoothingFactor();
    }

    if (this.smoothedBpm === 0) {
      this.smoothedBpm = newBpm;
    } else {
      this.smoothedBpm = alpha * newBpm + (1 - alpha) * this.smoothedBpm;
    }

    this.currentBpm = newBpm;
    this.updateCount++;
    return this.smoothedBpm;
  }

  /**
   * Add to history with progressive size management
   */
  addToHistory(bpm, confidence) {
    const maxHistory = this.getMaxHistorySize();

    this.bpmHistory.push(bpm);
    this.confidenceHistory.push(confidence);

    // Trim to progressive max
    while (this.bpmHistory.length > maxHistory) {
      this.bpmHistory.shift();
      this.confidenceHistory.shift();
    }

    // Track convergence — can happen as early as 0.5s
    if (!this.hasConverged) {
      const minForConvergence = this.getPhase() === 'initial' ? 2 : 3;
      if (this.bpmHistory.length >= minForConvergence) {
        const recent = this.bpmHistory.slice(-minForConvergence);
        const variance = this.calculateVariance(recent);
        const varianceThreshold = this.getPhase() === 'initial' ? 10 : 5;

        if (variance < varianceThreshold && confidence > this.getConfidenceThreshold()) {
          this.hasConverged = true;
          this.convergenceTime = this.getElapsedTime();
        }
      }
    }
  }

  /**
   * Check if BPM has converged
   */
  isConverged() {
    return this.hasConverged;
  }

  /**
   * Phase-based validation — very permissive initially for instant lock
   */
  processWithPhase(rawBpm, confidence) {
    const phase = this.getPhase();
    const threshold = this.getConfidenceThreshold();

    // In initial phase, accept almost anything for instant first reading
    if (phase === 'initial') {
      if (confidence >= threshold * 0.5 || this.updateCount === 0) {
        this.addToHistory(rawBpm, confidence);
        const smoothed = this.smooth(rawBpm);
        return {
          bpm: Math.round(smoothed * 10) / 10,
          confidence: this.getAverageConfidence(),
          phase,
          converged: this.hasConverged,
        };
      }
    } else {
      // Progressive validation after initial phase
      if (confidence >= threshold) {
        this.addToHistory(rawBpm, confidence);
        const smoothed = this.smooth(rawBpm);
        return {
          bpm: Math.round(smoothed * 10) / 10,
          confidence: this.getAverageConfidence(),
          phase,
          converged: this.hasConverged,
        };
      }
    }

    return {
      bpm: this.smoothedBpm,
      confidence: this.getAverageConfidence(),
      phase,
      converged: this.hasConverged,
      isValid: false,
    };
  }

  /**
   * Calculate variance in BPM values
   */
  calculateVariance(values) {
    if (values.length < 2) return Infinity;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Get average confidence
   */
  getAverageConfidence() {
    if (this.confidenceHistory.length === 0) return 0;
    const sum = this.confidenceHistory.reduce((a, b) => a + b, 0);
    return sum / this.confidenceHistory.length;
  }

  /**
   * Get current BPM
   */
  getCurrentBpm() {
    return Math.round(this.smoothedBpm * 10) / 10;
  }

  /**
   * Get convergence diagnostics
   */
  getDiagnostics() {
    return {
      elapsedTime: this.getElapsedTime().toFixed(2),
      phase: this.getPhase(),
      currentBpm: this.getCurrentBpm(),
      hasConverged: this.hasConverged,
      convergenceTime: this.convergenceTime ? this.convergenceTime.toFixed(2) : 'pending',
      historySize: this.bpmHistory.length,
      maxHistorySize: this.getMaxHistorySize(),
      averageConfidence: this.getAverageConfidence().toFixed(2),
      smoothingFactor: this.getSmoothingFactor().toFixed(3),
      confidenceThreshold: this.getConfidenceThreshold().toFixed(2),
      updateCount: this.updateCount,
    };
  }

  /**
   * Reset
   */
  reset() {
    this.currentBpm = 0;
    this.smoothedBpm = 0;
    this.bpmHistory = [];
    this.confidenceHistory = [];
    this.startTime = Date.now();
    this.lastUpdateTime = 0;
    this.hasConverged = false;
    this.convergenceTime = null;
    this.updateCount = 0;
  }
}

/**
 * Mode selector helper
 */
export function selectFastDetectionMode(targetTime = 1) {
  return FAST_BPM_CONFIG;
}

export default FastBPMSmoother;
