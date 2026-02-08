// Audio processing constants for BPM detection

export const AUDIO_CONFIG = {
  sampleRate: 44100,
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
};

export const BPM_CONFIG = {
  minBpm: 60,
  maxBpm: 200,
  updateInterval: 100, // ms - how often to update BPM (10 Hz)
  smoothingFactor: 0.3, // Exponential moving average factor
  confidenceThreshold: 0.6, // Minimum confidence to display BPM
  historySize: 10, // Number of recent BPM values to keep for validation
};

export const ONSET_DETECTION = {
  threshold: 1.3, // Onset detection threshold (spectral flux)
  bufferSize: 2048,
  hopSize: 512,
  minInterval: 0.1, // Minimum time between onsets (seconds)
};

export const BEAT_TRACKING = {
  windowSize: 4, // Number of seconds to analyze for beat intervals
  minBeatsInWindow: 4, // Minimum beats needed for BPM calculation
  outlierThreshold: 0.3, // Reject intervals that differ by more than 30%
};

export const UI_CONFIG = {
  beatFlashDuration: 100, // ms - how long the beat indicator flashes
  confidenceLow: 0.6,
  confidenceMedium: 0.75,
  confidenceHigh: 0.9,
};

// Helper functions
export const bpmToInterval = (bpm) => 60 / bpm; // Returns interval in seconds
export const intervalToBpm = (interval) => 60 / interval; // Returns BPM

export const validateBpm = (bpm) => {
  return bpm >= BPM_CONFIG.minBpm && bpm <= BPM_CONFIG.maxBpm;
};

export const getConfidenceLevel = (confidence) => {
  if (confidence >= UI_CONFIG.confidenceHigh) return 'high';
  if (confidence >= UI_CONFIG.confidenceMedium) return 'medium';
  if (confidence >= UI_CONFIG.confidenceLow) return 'low';
  return 'none';
};
