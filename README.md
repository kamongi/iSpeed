# iSpeed

**Real-time BPM Detection for grandMA3 Lighting Control**

iSpeed is a Progressive Web App that analyzes live audio from your phone's microphone to detect beats per minute (BPM) in real-time. Designed for lighting specialists working with grandMA3 consoles in live venues.

---

## 🎵 Features

- 📱 Mobile browser-based Progressive Web App (no installation required)
- 🎤 Real-time BPM detection from phone microphone
- 📊 Visual BPM display with confidence metrics
- 💓 Beat indicator with pulse animation
- 📈 Audio level meter
- 🎯 Manual integration with grandMA3 console
- 🌙 Dark theme optimized for venue environments
- ⚡ Low latency (~200-300ms)
- 🔒 100% local processing (no data transmission)

---

## 🚀 Quick Start

### Development

**Prerequisites:**
- Node.js 18+ or latest LTS
- Modern browser with microphone access
- HTTPS support (localhost works for development)

**Setup:**
```bash
# Clone repository
git clone https://github.com/kamongi/iSpeed.git
cd iSpeed

# Install dependencies
cd client
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
# Allow microphone access when prompted
```

### Production Build

```bash
cd client
npm run build

# Deploy dist/ folder to any static hosting service
# (Netlify, Vercel, GitHub Pages, etc.)
```

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design and technical details
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guide and development conventions

---

## 🎯 Performance

| Metric | Target |
|--------|--------|
| **BPM Accuracy** | ± 2 BPM |
| **Latency** | < 500ms |
| **BPM Range** | 60-200 BPM |
| **Update Rate** | 10 Hz |
| **CPU Usage** | < 20% |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Audio:** Web Audio API
- **BPM Detection:** Custom onset detection algorithm
- **UI:** CSS3 with dark theme
- **PWA:** Service Worker (offline support)

### Browser Support
- ✅ Chrome/Edge (recommended)
- ✅ Safari (iOS 14+)
- ✅ Firefox
- ⚠️ Requires HTTPS or localhost

---

## 🏗️ Project Structure

```
iSpeed/
├── client/                  # Frontend PWA application
│   ├── src/
│   │   ├── audio/          # BPM detection engine
│   │   ├── components/     # UI components
│   │   ├── App.jsx         # Main application
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   ├── package.json
│   └── vite.config.js
├── tests/                   # Test suites
├── docs/                    # Documentation
├── ARCHITECTURE.md          # System architecture
├── CLAUDE.md                # Developer guide
└── README.md                # This file
```

---

## 🧪 Testing

```bash
# Frontend tests
cd client
npm test
npm run test:coverage
```

### Testing Tips

**Best Results:**
- Test with steady-tempo electronic music (house, techno)
- Position microphone 1-2 feet from speaker
- Minimize background noise
- Wait 3-5 seconds for BPM to stabilize

**Supported Genres:**
- ✅ Electronic (house, techno, trance)
- ✅ Pop/Rock (steady tempo)
- ✅ Hip-hop (strong beat patterns)
- ⚠️ Jazz/Complex rhythms (may have lower accuracy)

---

## 🎛️ grandMA3 Integration

### Manual Integration Workflow

1. **Start iSpeed** on your mobile device
2. **Allow microphone access** when prompted
3. **Position phone** near audio source (speakers or mixing board)
4. **Wait for BPM** to stabilize (3-5 seconds)
5. **Note the BPM value** displayed on screen
6. **On grandMA3 console:**
   - Open Speed Masters
   - Calculate multiplier: `(Detected BPM / 120)`
   - Adjust Speed Master to match ratio
7. **Observe** lighting effects sync with music

### BPM to Speed Master Mapping

```
BPM 60  → Speed Master 0.5
BPM 90  → Speed Master 0.75
BPM 120 → Speed Master 1.0 (baseline)
BPM 128 → Speed Master 1.067
BPM 140 → Speed Master 1.167
BPM 160 → Speed Master 1.333
```

---

## 🤝 Contributing

We welcome contributions! Please see development guidelines in [CLAUDE.md](./CLAUDE.md).

### Development Workflow
1. Create feature branch: `git checkout -b feature/<name>`
2. Make changes following coding conventions
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request with clear description

---

## 📋 Roadmap

### ✅ Current (v1.0)
- [x] Real-time BPM detection
- [x] Mobile-responsive PWA
- [x] Dark theme UI
- [x] Confidence metrics
- [x] Beat visualization
- [x] Audio level meter

### 🔮 Future Enhancements
- [ ] Tap tempo feature (manual BPM input)
- [ ] BPM history graph
- [ ] Settings panel (sensitivity, range)
- [ ] Landscape mode optimization
- [ ] Haptic feedback on beat
- [ ] Multiple detection algorithms
- [ ] Genre detection
- [ ] Export BPM log

---

## 📄 License

ISC License - See LICENSE file for details

---

## 👥 Contact

**Project:** iSpeed - BPM Detection for Lighting Control  
**Repository:** [kamongi/iSpeed](https://github.com/kamongi/iSpeed)  
**Target Users:** Lighting specialists using grandMA3 consoles

---

## 🙏 Acknowledgments

- **grandMA3** by MA Lighting Technology
- **Web Audio API** community and documentation
- Lighting professionals who provided feedback and requirements

---

## 🔒 Privacy & Security

- ✅ **No data collection:** All processing happens locally
- ✅ **No audio recording:** Audio is never stored or transmitted
- ✅ **No external servers:** 100% client-side application
- ✅ **Microphone access:** Required only for real-time detection
- ✅ **Open source:** Code is transparent and auditable

---

**Built with ❤️ for the live event lighting community**

*Last Updated: 2026-02-07 | v1.0.0*
