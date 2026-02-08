import { ONSET_DETECTION } from './constants.js';

/**
 * Audio Analyzer
 * Performs spectral analysis and onset detection for beat tracking
 */
export class AudioAnalyzer {
  constructor() {
    this.previousSpectrum = null;
    this.spectralFluxHistory = [];
    this.onsetTimes = [];
    this.lastOnsetTime = 0;
  }

  /**
   * Calculate spectral flux (measure of spectral change)
   * Used for onset detection
   * @param {Float32Array} spectrum - Current frequency spectrum
   * @returns {number} Spectral flux value
   */
  calculateSpectralFlux(spectrum) {
    if (!this.previousSpectrum) {
      this.previousSpectrum = new Float32Array(spectrum);
      return 0;
    }

    let flux = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const diff = spectrum[i] - this.previousSpectrum[i];
      // Only sum positive differences (increases in energy)
      flux += Math.max(0, diff);
    }

    // Update previous spectrum
    this.previousSpectrum = new Float32Array(spectrum);

    return flux;
  }

  /**
   * Detect onsets (beats) in the audio signal
   * @param {Float32Array} spectrum - Frequency spectrum
   * @param {number} currentTime - Current audio context time
   * @returns {boolean} True if onset detected
   */
  detectOnset(spectrum, currentTime) {
    const flux = this.calculateSpectralFlux(spectrum);

    // Add to history
    this.spectralFluxHistory.push(flux);
    if (this.spectralFluxHistory.length > 50) {
      this.spectralFluxHistory.shift();
    }

    // Calculate adaptive threshold (mean + threshold factor)
    const mean = this.spectralFluxHistory.reduce((a, b) => a + b, 0) / this.spectralFluxHistory.length;
    const threshold = mean * ONSET_DETECTION.threshold;

    // Check if current flux exceeds threshold
    const isOnset = flux > threshold;

    // Ensure minimum time between onsets
    const timeSinceLastOnset = currentTime - this.lastOnsetTime;
    if (isOnset && timeSinceLastOnset >= ONSET_DETECTION.minInterval) {
      this.onsetTimes.push(currentTime);
      this.lastOnsetTime = currentTime;

      // Keep only recent onsets (last 10 seconds)
      this.onsetTimes = this.onsetTimes.filter(
        (time) => currentTime - time < 10
      );

      return true;
    }

    return false;
  }

  /**
   * Get recent onset times
   * @param {number} windowSize - Time window in seconds
   * @param {number} currentTime - Current time
   * @returns {Array<number>} Onset times within window
   */
  getRecentOnsets(windowSize, currentTime) {
    return this.onsetTimes.filter(
      (time) => currentTime - time <= windowSize
    );
  }

  /**
   * Calculate inter-onset intervals (IOI)
   * @param {Array<number>} onsetTimes - Array of onset times
   * @returns {Array<number>} Intervals between onsets
   */
  calculateIntervals(onsetTimes) {
    const intervals = [];
    for (let i = 1; i < onsetTimes.length; i++) {
      intervals.push(onsetTimes[i] - onsetTimes[i - 1]);
    }
    return intervals;
  }

  /**
   * Find most common interval using histogram binning
   * @param {Array<number>} intervals - Inter-onset intervals
   * @returns {Object} { interval, confidence }
   */
  findDominantInterval(intervals) {
    if (intervals.length < 3) {
      return { interval: 0, confidence: 0 };
    }

    // Create histogram bins for BPM range (60-200 BPM)
    // Bin size: 2 BPM
    const bins = new Map();
    const binSize = 2 / 60; // 2 BPM in interval units

    intervals.forEach((interval) => {
      // Convert to BPM and back to normalize
      const bpm = 60 / interval;
      if (bpm >= 60 && bpm <= 200) {
        const binKey = Math.round(bpm / 2) * 2; // Round to nearest 2 BPM
        bins.set(binKey, (bins.get(binKey) || 0) + 1);
      }

      // Also check double-time and half-time
      const doubleBpm = bpm * 2;
      if (doubleBpm >= 60 && doubleBpm <= 200) {
        const binKey = Math.round(doubleBpm / 2) * 2;
        bins.set(binKey, (bins.get(binKey) || 0) + 0.5);
      }

      const halfBpm = bpm / 2;
      if (halfBpm >= 60 && halfBpm <= 200) {
        const binKey = Math.round(halfBpm / 2) * 2;
        bins.set(binKey, (bins.get(binKey) || 0) + 0.5);
      }
    });

    // Find bin with most counts
    let maxCount = 0;
    let dominantBpm = 0;

    bins.forEach((count, bpm) => {
      if (count > maxCount) {
        maxCount = count;
        dominantBpm = bpm;
      }
    });

    if (dominantBpm === 0) {
      return { interval: 0, confidence: 0 };
    }

    const dominantInterval = 60 / dominantBpm;
    const confidence = maxCount / intervals.length;

    return { interval: dominantInterval, confidence };
  }

  /**
   * Filter outlier intervals
   * @param {Array<number>} intervals - Inter-onset intervals
   * @param {number} threshold - Outlier threshold (0-1)
   * @returns {Array<number>} Filtered intervals
   */
  filterOutliers(intervals, threshold = 0.3) {
    if (intervals.length < 3) return intervals;

    const median = this.calculateMedian(intervals);
    return intervals.filter((interval) => {
      const deviation = Math.abs(interval - median) / median;
      return deviation <= threshold;
    });
  }

  /**
   * Calculate median of array
   * @param {Array<number>} arr - Array of numbers
   * @returns {number} Median value
   */
  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate mean of array
   * @param {Array<number>} arr - Array of numbers
   * @returns {number} Mean value
   */
  calculateMean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Calculate standard deviation
   * @param {Array<number>} arr - Array of numbers
   * @returns {number} Standard deviation
   */
  calculateStdDev(arr) {
    const mean = this.calculateMean(arr);
    const squareDiffs = arr.map((value) => Math.pow(value - mean, 2));
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Reset analyzer state
   */
  reset() {
    this.previousSpectrum = null;
    this.spectralFluxHistory = [];
    this.onsetTimes = [];
    this.lastOnsetTime = 0;
  }
}

export default AudioAnalyzer;
