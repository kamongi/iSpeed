import { AUDIO_CONFIG } from './constants.js';

/**
 * Audio Context Manager
 * Handles microphone access and Web Audio API setup
 * Supports stop/restart cycles and adaptive microphone configuration
 */
class AudioContextManager {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.stream = null;
    this.gainNode = null;
  }

  /**
   * Initialize audio context and request microphone access
   * @param {Object} options - Configuration options
   * @param {boolean} options.autoGainControl - Enable browser auto-gain (default false)
   * @param {boolean} options.noiseSuppression - Enable noise suppression (default false)
   * @param {number} options.smoothingTimeConstant - Override analyser smoothing (default from config)
   */
  async initialize(options = {}) {
    const {
      autoGainControl = false,
      noiseSuppression = false,
      smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant,
    } = options;

    try {
      // Clean up any previous context before re-initializing
      this.stop();

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression,
          autoGainControl,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.sampleRate,
      });

      // Create microphone source
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = AUDIO_CONFIG.fftSize;
      this.analyser.smoothingTimeConstant = smoothingTimeConstant;
      this.analyser.minDecibels = AUDIO_CONFIG.minDecibels;
      this.analyser.maxDecibels = AUDIO_CONFIG.maxDecibels;

      // Create gain node for signal amplification
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // Connect: microphone -> gain -> analyser
      this.microphone.connect(this.gainNode);
      this.gainNode.connect(this.analyser);

      return {
        success: true,
        sampleRate: this.audioContext.sampleRate,
        bufferSize: this.analyser.fftSize,
      };
    } catch (error) {
      console.error('Error initializing audio:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Set gain level (useful for amplifying weak signals)
   * @param {number} value - Gain value (1.0 = unity, >1 = amplify)
   */
  setGain(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(value, 10));
    }
  }

  /**
   * Update analyser smoothing constant at runtime
   * @param {number} value - Smoothing value (0-1)
   */
  setSmoothingTimeConstant(value) {
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = Math.max(0, Math.min(value, 1));
    }
  }

  /**
   * Get frequency data from analyser
   */
  getFrequencyData() {
    if (!this.analyser) return null;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get time domain data from analyser
   */
  getTimeDomainData() {
    if (!this.analyser) return null;

    const dataArray = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Get float frequency data (more precise for analysis)
   */
  getFloatFrequencyData() {
    if (!this.analyser) return null;

    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Calculate current audio level (RMS)
   * @returns {number} RMS level (0-1)
   */
  getAudioLevel() {
    const timeDomainData = this.getTimeDomainData();
    if (!timeDomainData) return 0;

    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const normalized = (timeDomainData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / timeDomainData.length);
    return rms;
  }

  /**
   * Get audio level in decibels
   * @returns {number} Level in dB (typically -60 to 0)
   */
  getAudioLevelDb() {
    const rms = this.getAudioLevel();
    if (rms === 0) return -Infinity;
    return 20 * Math.log10(rms);
  }

  /**
   * Get current time in audio context
   */
  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  /**
   * Resume audio context if suspended (required by some browsers)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Stop audio processing and release resources
   * Safe to call multiple times; supports re-initialization after stop
   */
  stop() {
    try {
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }

      if (this.microphone) {
        this.microphone.disconnect();
        this.microphone = null;
      }

      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.audioContext = null;
      this.analyser = null;
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  /**
   * Check if audio context is initialized and running
   */
  isInitialized() {
    return this.audioContext !== null && this.stream !== null;
  }

  /**
   * Get audio context state
   */
  getState() {
    return this.audioContext ? this.audioContext.state : 'closed';
  }

  /**
   * Get frequency bin count from analyser
   */
  getFrequencyBinCount() {
    return this.analyser ? this.analyser.frequencyBinCount : 0;
  }
}

// Export singleton instance
export default new AudioContextManager();
