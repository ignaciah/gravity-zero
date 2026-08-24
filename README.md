# Gravity Zero 🚀🌌

An interactive 3D WebGL space physics sandbox and tractor-beam simulator built with **Three.js**, **TypeScript**, **Vite**, and the **Web Audio API**.

---

## 🌟 Overview

**Gravity Zero** allows users to navigate a zero-gravity space environment, manipulate floating orbital objects (cargo crates, energy orbs, satellites, space debris) using a powerful tractor beam, adjust dynamic gravity fields, and complete physics-based orbital missions.

---

## ✨ Features

- **🛸 3D WebGL Space Environment**: Immersive space environment rendered with Three.js.
- **⚡ Tractor Beam (Grav-Gun)**: Lock onto objects using raycasting, pull or push them in 3D space, and launch them with kinetic fling mechanics (**F key**).
- **⚛️ Physics Engine**: 6-DOF physics simulation with mass properties, velocity vectors, damping, and collision handling.
- **📊 Real-Time HUD Overlay**: Live flight telemetry displaying spatial coordinates, velocity vectors, target distance, and mass readouts.
- **🎯 Mission System**: Challenge modes requiring players to collect space debris, stabilize satellite orbits, or construct cargo stations under customized gravity fields.
- **🔊 Web Audio Engine**: Synthesized audio feedback for collisions, tractor beam activation, and spatial audio cues.
- **🐳 Container Ready**: Complete setup with Dockerfile and Nginx server configuration for lightweight production deployments.

---

## 🛠️ Tech Stack

- **Frontend Core**: TypeScript, HTML5 Canvas
- **3D Graphics**: Three.js
- **Build Tool**: Vite
- **Audio Engine**: Web Audio API
- **Deployment**: Docker, Nginx

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

### Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ignaciah/gravity-zero.git
   cd gravity-zero
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🎮 Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Lock / Release Tractor Beam** | Left Mouse Click on Target Object |
| **Kinetic Fling** | Press `F` while holding target |
| **Camera & Flight Navigation** | Drag / WASD Navigation |
| **Audio Mute/Unmute** | Click 🔊 / 🔇 HUD Button |

---

## 🐳 Docker Deployment

You can containerize and serve **Gravity Zero** using Docker:

```bash
# Build the Docker image
docker build -t gravity-zero .

# Run the container on port 8080
docker run -d -p 8080:80 gravity-zero
```

Access the app at `http://localhost:8080`.

---

## 📄 License

MIT License. Feel free to use and modify for your own projects!
