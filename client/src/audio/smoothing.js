import { BPM_CONFIG, validateBpm, intervalToBpm } from './constants.js';

/**
 * BPM Smoother
 * Applies temporal smoothing and validation to BPM values
 */
export class BPMSmoother {
  constructor() {
    this.currentBpm = 0;
    this.smoothedBpm = 0;
    this.bpmHistory = [];
    this.confidenceHistory = [];
    this.lastUpdateTime = 0;
  }

  /**
   * Apply exponential moving average smoothing
   * @param {number} newBpm - New BPM value
   * @param {number} alpha - Smoothing factor (0-1), default from config
   * @returns {number} Smoothed BPM
   */
  smooth(newBpm, alpha = BPM_CONFIG.smoothingFactor) {
    if (!validateBpm(newBpm)) {
      return this.smoothedBpm;
    }

    if (this.smoothedBpm === 0) {
      this.smoothedBpm = newBpm;
    } else {
      this.smoothedBpm = alpha * newBpm + (1 - alpha) * this.smoothedBpm;
    }

    this.currentBpm = newBpm;
    return this.smoothedBpm;
  }

  /**
   * Add BPM value to history
   * @param {number} bpm - BPM value
   * @param {number} confidence - Confidence score (0-1)
   */
  addToHistory(bpm, confidence) {
    this.bpmHistory.push(bpm);
    this.confidenceHistory.push(confidence);

    // Keep only recent history
    if (this.bpmHistory.length > BPM_CONFIG.historySize) {
      this.bpmHistory.shift();
      this.confidenceHistory.shift();
    }
  }

  /**
   * Check for double-time or half-time errors
   * @param {number} bpm - Candidate BPM value
   * @returns {number} Corrected BPM
   */
  correctDoubleTime(bpm) {
    if (this.bpmHistory.length < 3) {
      return bpm;
    }

    const recentAvg = this.getAverageBpm();
    if (recentAvg === 0) return bpm;

    // Check if BPM is approximately double
    if (Math.abs(bpm - recentAvg * 2) < 5) {
      return bpm / 2;
    }

    // Check if BPM is approximately half
    if (Math.abs(bpm - recentAvg / 2) < 5) {
      return bpm * 2;
    }

    return bpm;
  }

  /**
   * Validate BPM against recent history
   * Reject values that deviate significantly from recent trend
   * @param {number} bpm - Candidate BPM value
   * @param {number} threshold - Maximum allowed deviation (default 2 std dev)
   * @returns {boolean} True if BPM is valid
   */
  validateAgainstHistory(bpm, threshold = 2) {
    if (this.bpmHistory.length < 3) {
      return validateBpm(bpm);
    }

    const mean = this.getAverageBpm();
    const stdDev = this.getStdDev();

    // If no variation in history, use absolute threshold
    if (stdDev < 2) {
      return Math.abs(bpm - mean) < 20;
    }

    // Check if within threshold standard deviations
    const deviation = Math.abs(bpm - mean);
    return deviation <= threshold * stdDev;
  }

  /**
   * Get average BPM from history
   * @returns {number} Average BPM
   */
  getAverageBpm() {
    if (this.bpmHistory.length === 0) return 0;
    const sum = this.bpmHistory.reduce((a, b) => a + b, 0);
    return sum / this.bpmHistory.length;
  }

  /**
   * Get weighted average (more recent values weighted higher)
   * @returns {number} Weighted average BPM
   */
  getWeightedAverageBpm() {
    if (this.bpmHistory.length === 0) return 0;

    let weightedSum = 0;
    let weightSum = 0;

    this.bpmHistory.forEach((bpm, index) => {
      const weight = index + 1; // More recent = higher weight
      weightedSum += bpm * weight;
      weightSum += weight;
    });

    return weightedSum / weightSum;
  }

  /**
   * Get standard deviation of BPM history
   * @returns {number} Standard deviation
   */
  getStdDev() {
    if (this.bpmHistory.length < 2) return 0;

    const mean = this.getAverageBpm();
    const squareDiffs = this.bpmHistory.map((bpm) =>
      Math.pow(bpm - mean, 2)
    );
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Get average confidence from recent history
   * @returns {number} Average confidence (0-1)
   */
  getAverageConfidence() {
    if (this.confidenceHistory.length === 0) return 0;
    const sum = this.confidenceHistory.reduce((a, b) => a + b, 0);
    return sum / this.confidenceHistory.length;
  }

  /**
   * Process new BPM value with full pipeline
   * @param {number} rawBpm - Raw BPM from detection
   * @param {number} confidence - Detection confidence
   * @returns {Object} { bpm, confidence, isValid }
   */
  process(rawBpm, confidence) {
    // Validate basic range
    if (!validateBpm(rawBpm)) {
      return {
        bpm: this.smoothedBpm,
        confidence: this.getAverageConfidence(),
        isValid: false,
      };
    }

    // Correct double-time/half-time
    const correctedBpm = this.correctDoubleTime(rawBpm);

    // Validate against history
    const isValid = this.validateAgainstHistory(correctedBpm);

    if (isValid && confidence >= BPM_CONFIG.confidenceThreshold) {
      // Add to history
      this.addToHistory(correctedBpm, confidence);

      // Apply smoothing
      const smoothedBpm = this.smooth(correctedBpm);

      return {
        bpm: Math.round(smoothedBpm * 10) / 10, // Round to 1 decimal
        confidence: this.getAverageConfidence(),
        isValid: true,
      };
    }

    // Return previous smoothed value if new value is invalid
    return {
      bpm: this.smoothedBpm,
      confidence: this.getAverageConfidence(),
      isValid: false,
    };
  }

  /**
   * Get current smoothed BPM
   * @returns {number} Current BPM
   */
  getCurrentBpm() {
    return Math.round(this.smoothedBpm * 10) / 10;
  }

  /**
   * Reset smoother state
   */
  reset() {
    this.currentBpm = 0;
    this.smoothedBpm = 0;
    this.bpmHistory = [];
    this.confidenceHistory = [];
    this.lastUpdateTime = 0;
  }
}

export default BPMSmoother;
