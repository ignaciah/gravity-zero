import * as THREE from 'three';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import { SceneManager } from '../engine/SceneManager';
import { AudioManager } from '../engine/AudioManager';
import { ObjectFactory } from '../objects/ObjectFactory';

export class MissionManager {
  private container: HTMLElement;
  private physics: PhysicsEngine;
  private sceneMgr: SceneManager;
  private audio: AudioManager;

  public activeMission: string = 'sandbox';
  private targetReceptacle: THREE.Mesh | null = null;
  private missionGoalCount: number = 0;
  private currentProgressCount: number = 0;

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
      <div class="sidebar-missions glass-panel cyber-corners">
        <div class="section-header">
          <span>MISSION SCENARIOS</span>
          <span class="preset-sub">CHALLENGES</span>
        </div>

        <div class="mission-card active" data-mission="sandbox">
          <div class="mission-title">🚀 Free Physics Sandbox</div>
          <div class="mission-desc">Unconstrained zero-G momentum testing. Spawn, drag, fling, and experiment with custom gravity vectors.</div>
        </div>

        <div class="mission-card" data-mission="repair">
          <div class="mission-title">⚡ Station Power Repair</div>
          <div class="mission-desc">Collect 4 floating Power Cells scattered in micro-gravity and drag them into the core containment ring.</div>
          <div class="mission-progress"><div id="bar-repair" class="mission-bar"></div></div>
        </div>

        <div class="mission-card" data-mission="debris">
          <div class="mission-title">🪨 Orbital Debris Cleanup</div>
          <div class="mission-desc">Clear 6 hazardous space junk fragments away from the station perimeter using kinetic impulses.</div>
          <div class="mission-progress"><div id="bar-debris" class="mission-bar"></div></div>
        </div>

        <div class="mission-card" data-mission="singularity">
          <div class="mission-title">🕳️ Singularity Anomaly</div>
          <div class="mission-desc">Initialize a central Black Hole gravity well and observe gravitational slingshot orbits.</div>
        </div>
      </div>
    `;
  }

  private bindEvents() {
    const cards = this.container.querySelectorAll<HTMLElement>('.mission-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const missionId = card.getAttribute('data-mission');
        if (missionId) {
          this.loadMission(missionId);
          this.audio.playClick();
        }
      });
    });
  }

  public loadMission(missionId: string) {
    this.activeMission = missionId;

    // Reset scene objects
    for (const b of this.physics.bodies) {
      if (!b.isStatic) {
        this.sceneMgr.scene.remove(b.mesh);
      }
    }
    this.physics.clearAllNonStatic();

    if (this.targetReceptacle) {
      this.sceneMgr.scene.remove(this.targetReceptacle);
      this.targetReceptacle = null;
    }

    if (missionId === 'repair') {
      this.physics.setGravityMode('ZEROG');
      this.missionGoalCount = 4;
      this.currentProgressCount = 0;

      // Spawn Receptacle Zone
      const recGeom = new THREE.TorusGeometry(3.0, 0.2, 16, 32);
      const recMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true });
      this.targetReceptacle = new THREE.Mesh(recGeom, recMat);
      this.targetReceptacle.rotation.x = Math.PI / 2;
      this.targetReceptacle.position.set(0, -5, 0);
      this.sceneMgr.scene.add(this.targetReceptacle);

      // Spawn 4 floating power cells
      const positions = [
        new THREE.Vector3(-12, 5, -10),
        new THREE.Vector3(14, 8, -5),
        new THREE.Vector3(-8, -2, 12),
        new THREE.Vector3(10, 12, 8)
      ];

      positions.forEach(pos => {
        const cell = ObjectFactory.createPowerCell(pos);
        this.sceneMgr.scene.add(cell.mesh);
        this.physics.addBody(cell);
      });

      this.updateProgressBar('bar-repair', 0);
    } else if (missionId === 'debris') {
      this.physics.setGravityMode('ZEROG');
      this.missionGoalCount = 6;
      this.currentProgressCount = 0;

      for (let i = 0; i < 6; i++) {
        const pos = new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 20
        );
        const junk = ObjectFactory.createSpaceDebris(pos, 4.0);
        this.sceneMgr.scene.add(junk.mesh);
        this.physics.addBody(junk);
      }

      this.updateProgressBar('bar-debris', 0);
    } else if (missionId === 'singularity') {
      this.physics.setGravityMode('SINGULARITY');
      const hole = ObjectFactory.createBlackHole(new THREE.Vector3(0, 0, 0));
      this.sceneMgr.scene.add(hole.mesh);
      this.physics.addBody(hole);

      // Orbiting test probes
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const dist = 12 + Math.random() * 4;
        const pos = new THREE.Vector3(Math.cos(angle) * dist, (Math.random() - 0.5) * 3, Math.sin(angle) * dist);
        const orb = ObjectFactory.createEnergyOrb(pos, 2.0);
        
        // Tangential orbital velocity
        const orbitSpeed = 10.0;
        orb.velocity.set(-Math.sin(angle) * orbitSpeed, 0, Math.cos(angle) * orbitSpeed);
        this.sceneMgr.scene.add(orb.mesh);
        this.physics.addBody(orb);
      }
    }
  }

  public update() {
    if (this.activeMission === 'repair' && this.targetReceptacle) {
      // Check distance of power cells to receptacle
      const cells = this.physics.bodies.filter(b => b.type === 'PowerCell');
      let insideCount = 0;

      cells.forEach(c => {
        const dist = c.position.distanceTo(this.targetReceptacle!.position);
        if (dist < 3.5) {
          insideCount++;
        }
      });

      if (insideCount !== this.currentProgressCount) {
        this.currentProgressCount = insideCount;
        const progressPct = (this.currentProgressCount / this.missionGoalCount) * 100;
        this.updateProgressBar('bar-repair', progressPct);

        if (this.currentProgressCount >= this.missionGoalCount) {
          this.audio.playSuccess();
        }
      }
    }
  }

  private updateProgressBar(id: string, pct: number) {
    const bar = document.getElementById(id);
    if (bar) {
      bar.style.width = `${pct}%`;
    }
  }
}
