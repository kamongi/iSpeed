// Vitest setup file
// Mock Web Audio API for testing
class MockAnalyserNode {
  constructor() {
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
    this.smoothingTimeConstant = 0.8;
    this.minDecibels = -90;
    this.maxDecibels = -10;
  }
  connect() {}
  disconnect() {}
  getByteFrequencyData(array) {
    array.fill(0);
  }
  getByteTimeDomainData(array) {
    array.fill(128);
  }
  getFloatFrequencyData(array) {
    array.fill(-100);
  }
}

class MockMediaStreamSource {
  connect() {}
  disconnect() {}
}

class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.state = 'running';
    this.currentTime = 0;
  }
  createAnalyser() {
    return new MockAnalyserNode();
  }
  createMediaStreamSource() {
    return new MockMediaStreamSource();
  }
  createScriptProcessor() {
    return { connect() {}, disconnect() {}, onaudioprocess: null };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Provide global mocks
if (typeof globalThis.AudioContext === 'undefined') {
  globalThis.AudioContext = MockAudioContext;
}
if (typeof globalThis.webkitAudioContext === 'undefined') {
  globalThis.webkitAudioContext = MockAudioContext;
}

// Mock navigator.mediaDevices
if (!globalThis.navigator?.mediaDevices) {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      ...globalThis.navigator,
      mediaDevices: {
        getUserMedia: () =>
          Promise.resolve({
            getTracks: () => [{ stop() {} }],
          }),
      },
    },
    writable: true,
  });
}
