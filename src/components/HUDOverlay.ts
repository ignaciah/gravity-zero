import { PhysicsEngine } from '../engine/PhysicsEngine';
import { TractorBeam } from '../engine/TractorBeam';

export class HUDOverlay {
  private container: HTMLElement;
  private physics: PhysicsEngine;
  private tractor: TractorBeam;

  private velEl!: HTMLElement;
  private countEl!: HTMLElement;
  private keEl!: HTMLElement;
  private modeEl!: HTMLElement;
  private crosshairEl!: HTMLElement;

  constructor(container: HTMLElement, physics: PhysicsEngine, tractor: TractorBeam) {
    this.container = container;
    this.physics = physics;
    this.tractor = tractor;

    this.renderDOM();
  }

  private renderDOM() {
    this.container.innerHTML = `
      <!-- Crosshair Reticle -->
      <div id="hud-crosshair" class="hud-crosshair">
        <div class="reticle-ring">
          <div class="reticle-dot"></div>
        </div>
      </div>

      <!-- Telemetry Bar -->
      <div class="hud-telemetry glass-panel cyber-corners">
        <div class="telemetry-item">
          <span class="telemetry-label">MODE</span>
          <span id="hud-gravity-mode" class="telemetry-value">0G ZERO</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">MOMENTUM</span>
          <span id="hud-velocity" class="telemetry-value">0.0 kg m/s</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">BODIES</span>
          <span id="hud-body-count" class="telemetry-value">0</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">ENERGY</span>
          <span id="hud-kinetic-energy" class="telemetry-value">0.0 J</span>
        </div>
      </div>
    `;

    this.velEl = document.getElementById('hud-velocity')!;
    this.countEl = document.getElementById('hud-body-count')!;
    this.keEl = document.getElementById('hud-kinetic-energy')!;
    this.modeEl = document.getElementById('hud-gravity-mode')!;
    this.crosshairEl = document.getElementById('hud-crosshair')!;
  }

  public update() {
    const stats = this.physics.getTelemetryStats();
    this.countEl.textContent = stats.activeCount.toString();
    this.keEl.textContent = `${stats.kineticEnergy} J`;
    this.velEl.textContent = `${stats.momentumMagnitude} p`;
    this.modeEl.textContent = this.physics.gravityMode;

    // Crosshair state
    if (this.tractor.lockedBody) {
      this.crosshairEl.className = 'hud-crosshair locked';
    } else if (this.tractor.hoveredBody) {
      this.crosshairEl.className = 'hud-crosshair hover';
    } else {
      this.crosshairEl.className = 'hud-crosshair';
    }
  }
}
