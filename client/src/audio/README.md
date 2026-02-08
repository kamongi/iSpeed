# Audio Processing & BPM Detection

This directory contains the core BPM detection algorithms and audio processing code.

## Files (to be implemented)

- `audioContext.js` - Web Audio API setup and management
- `bpmDetector.js` - Main BPM detection algorithm
- `audioAnalyzer.js` - Audio analysis utilities (FFT, onset detection)
- `smoothing.js` - BPM smoothing and validation
- `constants.js` - Audio processing constants

## BPM Detection Strategy

### Implementation
- Web Audio API for audio capture
- Spectral flux-based onset detection
- Temporal smoothing with exponential moving average
- Real-time BPM display with confidence metrics

### Libraries to Evaluate
- `aubio.js` - JavaScript port of aubio
- `music-tempo` - Lightweight BPM detection
- `web-audio-beat-detector` - Browser-based detection
- Custom implementation using AnalyserNode

## Performance Requirements
- Latency: < 500ms
- Accuracy: ± 2 BPM
- Update rate: 4-10 Hz
- CPU usage: Minimal (use Web Workers if needed)
