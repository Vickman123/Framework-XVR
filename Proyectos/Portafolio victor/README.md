# Victor Carreño — 3D Interactive Portfolio Facility

An explorable 3D WebGL and WebXR personal portfolio for **Victor Carreño**, built with **TypeScript**, **Three.js**, **Vite**, and Victor's custom **VXR Framework** (`github:Vickman123/Framework-XVR`).

Instead of a conventional 2D webpage, visitors physically explore a dark, futuristic technology laboratory inspired by *Doom 3*, *Half-Life*, aerospace control decks, and *Apple/Vercel* minimalism.

---

## 🏛️ Facility Architecture

```
                          [ ROOM 01 — PROFESSIONAL ]
                       (PC PUMA / UNAM, 300K+ Metrics,
                           Enterprise IT Timeline)
                                     ▲
                                     │ (North Airlock)
                                     │
[ ROOM 04 — LAB ] ◀────── [ CENTRAL OPERATIONS HUB ] ──────▶ [ ROOM 02 — TECHNOLOGY ]
 (UPIICSA, Certifications,     (Welcome Core, Navigation,       (VXR Framework Centerpiece,
  IoT Bench & Archive)             Exit Dossier)                Flagship Project Stations)
                                     │
                                     │ (South Airlock)
                                     ▼
                          [ ROOM 03 — INNOVATION ]
                        (Space Tech Labs, AEM, 3D
                         Earth Globe & Satellites)
```

### 1. Central Operations Hub (`[0, 0, 0]`)
- Octagonal command nexus with illuminated directional guide rings.
- **Executive Welcome Terminal**: Holographic profile of Victor Carreño, title, and facility overview.
- **Automated Pneumatic Airlocks**: 4 sliding doors opening dynamically upon approach.
- **Exit & Fast Travel Terminal**: Instant waypoint navigation and contact dossier.

### 2. Room 01 — Professional & IT Operations (North Wing)
- **Theme**: Enterprise IT Operations & Network Operations Center (NOC).
- **Physical 3D Metrics Screens**:
  - `300K+ USERS IMPACTED` — UNAM campus community served.
  - `72+ ACADEMIC ENTITIES` — Faculties, preparatory schools, and institutes.
  - `6,000+ DEVICES MANAGED` — Mobile workstations, equipment fleet, access nodes.
  - `20+ ENTITIES COORDINATED` — Inter-institutional technical divisions unified under ITIL standards.
- **Interactive Career Timeline**: 2022 (IBM/Microsoft), 2023 (Agencia Espacial Mexicana), 2024 (Space Tech Labs), 2025 (Dr. Rodolfo Neri Vela), 2026 (PC PUMA / UNAM).
- **Enterprise Server Racks**: Diagnostic LED blinks, hardware chassis, and high-availability architecture panels.

### 3. Room 02 — Technology & Developer Lab (East Wing)
- **Visual Centerpiece**: The **VXR Framework Core** — a 3D rotating engine gyroscope with crystalline core and live architecture diagram:
  `Application` → `XRApp` → `XRScene / XRRenderer / XRSession / XRAssetManager` → `Three.js + WebXR`
- **3 Flagship Project Stations** with 3D animated wireframe holograms:
  - **Virus Purge**: Immersive WebXR spatial shooter simulation.
  - **XR Model Viewer (Visor XR)**: Industrial spatial computing and 3D CAD/GLTF inspection tool.
  - **PC PUMA Operator Simulator**: 3D operational training and device handover simulator.
- **Capability Matrix Wall**: Interactive chips for TypeScript, Three.js, React, Vue, Node.js, Python, Cloud, and ITIL.

### 4. Room 03 — Innovation & Aerospace Lab (South Wing)
- **Visual Centerpiece**: A rotating **3D Earth Globe** with atmospheric glow and orbiting satellites along realistic orbital inclination trajectories.
- **Space Tech Stations**:
  - **Space Tech Labs**: Aerospace software, orbital mechanics simulations, and student engineering initiatives.
  - **Agencia Espacial Mexicana (AEM)**: Systems analysis and the ENMICE digital aerospace mission platform.
  - **GeoGPT & Emerging AI**: Spatial AI prototype integrating natural language queries with 3D geospatial meshes.

### 5. Room 04 — Experimental Lab & Archive (West Wing)
- **Education Station**: Licenciatura en Ciencias de la Informática (UPIICSA - IPN, 2020–2024).
- **Hardware Workbench**: Microcontrollers (ESP32, Arduino), IoT sensors, and real-time telemetry streaming.
- **Certifications Terminal**: IBM Chatbot AI, Cisco Cybersecurity, Google/Microsoft Cloud Engineering, Alibaba Cloud.
- **Professional Evolution Archive**: Retrospective timeline illustrating the evolution from student engineer to enterprise IT lead and spatial computing framework creator.

### 6. Exit Terminal & Dossier
- Accessible at the hub nexus or via the top-right HUD button:
  - LinkedIn: [linkedin.com/in/victorcarg](https://www.linkedin.com/in/victorcarg/)
  - GitHub: [github.com/Vickman123](https://github.com/Vickman123)
  - Direct Email Contact
  - `[RETURN TO HUB]` fast travel action.

---

## 🎮 Interaction & Controls

### Desktop Controls
- **`WASD` / `Arrow Keys`**: Walk forward, backward, and strafe
- **`Shift`**: Sprint
- **`Mouse Movement`**: 360° Free look (Pointer Lock)
- **`Key [ E ]`**: Inspect target station / open 2D dossier panel
- **`ESC`**: Unlock mouse pointer / close active modal
- **`Click Canvas`**: Re-lock pointer and engage first-person view

### Mobile / Tablet Controls
- **Virtual Joystick** (Bottom-left): Touch and drag to move
- **Touch Drag** (Right screen half): Look around in 360°
- **`[INTERACT]` Button** (Bottom-right): Appears illuminated when near an interactive station
- **HUD Buttons**: Fast travel map and contact dossier accessible with a single tap

### WebXR (Meta Quest 2 / 3 / Pro, PCVR)
- **Enter VR**: Click the `ENTER VR` button on screen or inside headset browser
- **Left Thumbstick**: Smooth physical locomotion
- **Right Thumbstick**: Snap turning
- **Controller Laser**: Point at any 3D screen or hologram
- **Index Trigger**: Click to interact and open dossiers

---

## 🛠️ Tech Stack & Architecture

- **Language**: TypeScript (strict mode)
- **3D Engine**: Three.js (r186)
- **Spatial Framework**: [VXR Framework](https://github.com/Vickman123/Framework-XVR)
- **Bundler & Dev Server**: Vite 8
- **Audio**: Procedural Web Audio API sound synthesizer (zero audio asset latency)
- **Materials**: Custom PBR shaders and dynamic procedural CanvasTextures
- **Deployment**: GitHub Pages via automated GitHub Actions

```
src/
├── core/
│   ├── AudioSystem.ts         # Procedural Web Audio API sound generator
│   └── Engine.ts              # Master orchestrator connecting scene, renderer, and loop
├── data/
│   └── portfolioData.ts       # Central typed repository of Victor's projects & metrics
├── interaction/
│   ├── DoorSystem.ts          # Automated pneumatic sliding airlocks
│   └── InteractionSystem.ts   # Raycaster targeting, crosshair state, and [E] triggers
├── player/
│   └── PlayerController.ts    # First-person WASD/look + room collision clamping
├── projects/
│   └── ProjectCard3D.ts       # Physical 3D terminal station with wireframe holograms
├── rooms/
│   ├── CentralHub.ts          # Octagonal rotunda & welcome terminal
│   ├── RoomProfessional.ts    # Room 01: IT Operations & UNAM metrics
│   ├── RoomTechnology.ts      # Room 02: VXR Framework Core & flagship projects
│   ├── RoomInnovation.ts      # Room 03: Space Lab & 3D Earth globe
│   └── RoomLab.ts             # Room 04: UPIICSA, certifications & archive
├── ui/
│   ├── HUD.ts                 # Dynamic corner HUD & zone detector
│   ├── MobileControls.ts      # Virtual touch joystick
│   └── ModalManager.ts        # Apple/Vercel minimalist frosted glass panels
├── world/
│   ├── Lighting.ts            # Studio practical spotlights & ambient contrast
│   ├── Materials.ts           # Procedural canvas textures & PBR materials
│   └── WorldManager.ts        # Connects all rooms, corridors, and collision checks
└── main.ts                    # Bootstrap entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/Vickman123/portafolio-victor.git
cd portafolio-victor

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
```
The optimized static bundle will be generated in `dist/`.

---

## 🌐 Deploy to GitHub Pages

This project is pre-configured with a continuous deployment workflow in `.github/workflows/deploy.yml`:
1. Push your repository to GitHub (`main` branch).
2. Go to your repository on GitHub: **Settings** → **Pages**.
3. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. Every push to `main` will automatically build and publish the 3D portfolio!

Alternatively, you can test the production build locally:
```bash
npm run preview
```

---

## 👤 Author

**Victor Carreño**
- **LinkedIn**: [linkedin.com/in/victorcarg](https://www.linkedin.com/in/victorcarg/)
- **GitHub**: [github.com/Vickman123](https://github.com/Vickman123)
- **VXR Framework**: [github.com/Vickman123/Framework-XVR](https://github.com/Vickman123/Framework-XVR)

---

## 📄 License
MIT License.
