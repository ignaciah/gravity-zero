import * as THREE from 'three';
import { PhysicsEngine, type GravityMode } from '../engine/PhysicsEngine';
import { SceneManager } from '../engine/SceneManager';
import { AudioManager } from '../engine/AudioManager';
import { ObjectFactory } from '../objects/ObjectFactory';

export class ControlPanel {
  private container: HTMLElement;
  private physics: PhysicsEngine;
  private sceneMgr: SceneManager;
  private audio: AudioManager;

  constructor(container: HTMLElement, physics: PhysicsEngine, sceneMgr: SceneManager, audio: AudioManager) {
    this.container = container;
    this.physics = physics;
    this.sceneMgr = sceneMgr;
    this.audio = audio;

    this.renderDOM();
    this.bindEvents();
  }

  private renderDOM() {
    this.container.innerHTML = `
      <div class="sidebar-controls glass-panel cyber-corners">
        <!-- Gravity Selector -->
        <div class="section-header">
          <span>GRAVITY MATRIX</span>
          <span class="preset-sub">0G / VECTOR</span>
        </div>

        <div class="gravity-presets">
          <button class="btn-preset active" data-mode="ZEROG">
            <span>0G SPACE</span>
            <span class="preset-sub">0.0 m/s²</span>
          </button>
          <button class="btn-preset" data-mode="MICROG">
            <span>MICRO-G</span>
            <span class="preset-sub">0.5 m/s²</span>
          </button>
          <button class="btn-preset" data-mode="LUNAR">
            <span>LUNAR</span>
            <span class="preset-sub">1.62 m/s²</span>
          </button>
          <button class="btn-preset" data-mode="MARTIAN">
            <span>MARTIAN</span>
            <span class="preset-sub">3.72 m/s²</span>
          </button>
          <button class="btn-preset" data-mode="EARTH">
            <span>EARTH</span>
            <span class="preset-sub">9.81 m/s²</span>
          </button>
          <button class="btn-preset singularity" data-mode="SINGULARITY">
            <span>BLACK HOLE</span>
            <span class="preset-sub">PULL ATTR</span>
          </button>
        </div>

        <!-- Object Spawner -->
        <div class="section-header" style="margin-top: 12px;">
          <span>SPAWN OBJECTS</span>
        </div>

        <div class="spawner-grid">
          <button class="btn-spawn" data-spawn="crate">
            📦 Cargo Crate
          </button>
          <button class="btn-spawn" data-spawn="orb">
            🔮 Energy Orb
          </button>
          <button class="btn-spawn" data-spawn="satellite">
            🛰️ Satellite
          </button>
          <button class="btn-spawn" data-spawn="debris">
            🪨 Space Junk
          </button>
          <button class="btn-spawn" data-spawn="powercell">
            ⚡ Power Cell
          </button>
          <button class="btn-spawn" data-spawn="blackhole">
            🕳️ Singularity
          </button>
        </div>

        <!-- Physics Parameters Sliders -->
        <div class="section-header" style="margin-top: 12px;">
          <span>PHYSICS PARAMETERS</span>
        </div>

        <div class="slider-group">
          <div class="slider-label">
            <span>BOUNCINESS (RESTITUTION)</span>
            <span id="val-bounciness" class="slider-val">80%</span>
          </div>
          <input type="range" id="slider-bounciness" min="0" max="100" value="80">
        </div>

        <div class="slider-group">
          <div class="slider-label">
            <span>SPACE DRAG (FRICTION)</span>
            <span id="val-drag" class="slider-val">MIN</span>
          </div>
          <input type="range" id="slider-drag" min="0" max="50" value="1">
        </div>

        <div class="slider-group">
          <div class="slider-label">
            <span>TIME DILATION</span>
            <span id="val-time" class="slider-val">1.0x</span>
          </div>
          <input type="range" id="slider-time" min="10" max="200" value="100">
        </div>

        <!-- Actions -->
        <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-toggle-flight" class="btn-action">
            ✈️ FLIGHT MODE (OFF)
          </button>
          <button id="btn-clear-objects" class="btn-action btn-danger">
            🗑️ CLEAR ALL OBJECTS
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents() {
    // Gravity preset buttons
    const presetBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-preset');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode') as GravityMode;
        this.physics.setGravityMode(mode);
        this.audio.playClick();
      });
    });

    // Object Spawner buttons
    const spawnBtns = this.container.querySelectorAll<HTMLButtonElement>('.btn-spawn');
    spawnBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const itemType = btn.getAttribute('data-spawn');
        this.spawnItem(itemType);
        this.audio.playSpawn();
      });
    });

    // Sliders
    const bouncinessSlider = this.container.querySelector<HTMLInputElement>('#slider-bounciness')!;
    const bouncinessVal = this.container.querySelector<HTMLElement>('#val-bounciness')!;
    bouncinessSlider.addEventListener('input', () => {
      const val = parseInt(bouncinessSlider.value);
      this.physics.restitutionMultiplier = val / 100;
      bouncinessVal.textContent = `${val}%`;
    });

    const dragSlider = this.container.querySelector<HTMLInputElement>('#slider-drag')!;
    const dragVal = this.container.querySelector<HTMLElement>('#val-drag')!;
    dragSlider.addEventListener('input', () => {
      const val = parseInt(dragSlider.value);
      this.physics.linearDrag = val * 0.001;
      dragVal.textContent = val === 0 ? 'ZERO (VACUUM)' : `${val}`;
    });

    const timeSlider = this.container.querySelector<HTMLInputElement>('#slider-time')!;
    const timeVal = this.container.querySelector<HTMLElement>('#val-time')!;
    timeSlider.addEventListener('input', () => {
      const val = parseInt(timeSlider.value);
      this.physics.timeScale = val / 100;
      timeVal.textContent = `${(val / 100).toFixed(1)}x`;
    });

    // Flight toggle button
    const flightBtn = this.container.querySelector<HTMLButtonElement>('#btn-toggle-flight')!;
    flightBtn.addEventListener('click', () => {
      this.sceneMgr.isFlightControlActive = !this.sceneMgr.isFlightControlActive;
      if (this.sceneMgr.isFlightControlActive) {
        flightBtn.textContent = '✈️ FLIGHT MODE (ON)';
        flightBtn.style.borderColor = 'var(--green-success)';
        flightBtn.style.color = 'var(--green-success)';
        this.sceneMgr.renderer.domElement.requestPointerLock();
      } else {
        flightBtn.textContent = '✈️ FLIGHT MODE (OFF)';
        flightBtn.style.borderColor = 'var(--cyan-primary)';
        flightBtn.style.color = 'var(--text-bright)';
        document.exitPointerLock();
      }
      this.audio.playClick();
    });

    // Clear objects button
    const clearBtn = this.container.querySelector<HTMLButtonElement>('#btn-clear-objects')!;
    clearBtn.addEventListener('click', () => {
      for (const b of this.physics.bodies) {
        if (!b.isStatic) {
          this.sceneMgr.scene.remove(b.mesh);
        }
      }
      this.physics.clearAllNonStatic();
      this.audio.playClick();
    });
  }

  private spawnItem(type: string | null) {
    const camDir = new THREE.Vector3();
    this.sceneMgr.camera.getWorldDirection(camDir);
    const spawnPos = this.sceneMgr.camera.position.clone().add(camDir.multiplyScalar(8));

    let body;
    switch (type) {
      case 'crate':
        body = ObjectFactory.createCargoCrate(spawnPos);
        break;
      case 'orb':
        body = ObjectFactory.createEnergyOrb(spawnPos);
        break;
      case 'satellite':
        body = ObjectFactory.createSatellite(spawnPos);
        break;
      case 'debris':
        body = ObjectFactory.createSpaceDebris(spawnPos);
        break;
      case 'powercell':
        body = ObjectFactory.createPowerCell(spawnPos);
        break;
      case 'blackhole':
        body = ObjectFactory.createBlackHole(spawnPos);
        break;
      default:
        body = ObjectFactory.createCargoCrate(spawnPos);
    }

    this.sceneMgr.scene.add(body.mesh);
    this.physics.addBody(body);
  }
}
