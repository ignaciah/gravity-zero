import './style.css';
import { AudioManager } from './engine/AudioManager';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { SceneManager } from './engine/SceneManager';
import { TractorBeam } from './engine/TractorBeam';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlPanel } from './components/ControlPanel';
import { MissionManager } from './components/MissionManager';
import { ObjectFactory } from './objects/ObjectFactory';
import * as THREE from 'three';

class GravityZeroApp {
  private audio: AudioManager;
  private physics: PhysicsEngine;
  private sceneMgr: SceneManager;
  private tractor: TractorBeam;
  private hud: HUDOverlay;
  private missionMgr: MissionManager;

  private clock: THREE.Clock;

  constructor() {
    this.clock = new THREE.Clock();

    // 1. Audio Engine
    this.audio = new AudioManager();

    // 2. Physics Engine
    this.physics = new PhysicsEngine();
    this.physics.setOnImpactCallback((speed) => {
      this.audio.playImpact(speed);
    });

    // 3. 3D WebGL Scene Manager
    const canvasContainer = document.getElementById('webgl-canvas')!;
    this.sceneMgr = new SceneManager(canvasContainer, this.audio);

    // 4. Tractor Beam (Grav-Gun) Raycaster
    this.tractor = new TractorBeam(this.sceneMgr.camera, this.physics, this.audio, this.sceneMgr.scene);

    // 5. UI Components
    const hudContainer = document.getElementById('hud-overlay-container')!;
    this.hud = new HUDOverlay(hudContainer, this.physics, this.tractor);

    const controlsContainer = document.getElementById('controls-sidebar-container')!;
    new ControlPanel(controlsContainer, this.physics, this.sceneMgr, this.audio);

    const missionsContainer = document.getElementById('missions-sidebar-container')!;
    this.missionMgr = new MissionManager(missionsContainer, this.physics, this.sceneMgr, this.audio);

    // Audio Toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        audioBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Keyboard shortcut for Fling (F key)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF') {
        this.tractor.flingCurrentObject();
      }
    });

    // Initial Sandbox Setup
    this.populateInitialSandbox();

    // Start Simulation Loop
    this.animate();
  }

  private populateInitialSandbox() {
    // Spawn initial floating 3D objects
    const initialObjects = [
      ObjectFactory.createCargoCrate(new THREE.Vector3(-4, 2, -6), 5.0, 1.6),
      ObjectFactory.createCargoCrate(new THREE.Vector3(4, 0, -8), 4.0, 1.4),
      ObjectFactory.createEnergyOrb(new THREE.Vector3(0, 3, -10), 2.0, 1.0),
      ObjectFactory.createEnergyOrb(new THREE.Vector3(-6, -2, -5), 2.5, 1.2),
      ObjectFactory.createSatellite(new THREE.Vector3(6, 4, -12), 10.0),
      ObjectFactory.createSpaceDebris(new THREE.Vector3(-2, -4, -7), 3.5),
      ObjectFactory.createSpaceDebris(new THREE.Vector3(5, -3, -9), 4.5)
    ];

    initialObjects.forEach(obj => {
      this.sceneMgr.scene.add(obj.mesh);
      this.physics.addBody(obj);
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const dt = this.clock.getDelta();

    // 1. Update Physics Simulation
    this.physics.update(dt);

    // 2. Update Tractor Beam Raycasting & Lock Forces
    this.tractor.update();

    // 3. Update Camera 6-DOF Flight Controller
    this.sceneMgr.update(dt);

    // 4. Update HUD Telemetry Display
    this.hud.update();

    // 5. Update Active Mission Checks
    this.missionMgr.update();

    // 6. Render 3D Scene
    this.sceneMgr.render();
  };
}

// Initialize Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new GravityZeroApp();
});
