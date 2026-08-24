import * as THREE from 'three';
import { PhysicsEngine, type PhysicsBody } from './PhysicsEngine';
import { AudioManager } from './AudioManager';

export class TractorBeam {
  private camera: THREE.PerspectiveCamera;
  private physics: PhysicsEngine;
  private audio: AudioManager;
  private scene: THREE.Scene;

  public hoveredBody: PhysicsBody | null = null;
  public lockedBody: PhysicsBody | null = null;
  public targetDistance: number = 10;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mousePos: THREE.Vector2 = new THREE.Vector2(0, 0);

  private beamLine: THREE.Line | null = null;
  private beamMaterial: THREE.LineBasicMaterial;

  constructor(camera: THREE.PerspectiveCamera, physics: PhysicsEngine, audio: AudioManager, scene: THREE.Scene) {
    this.camera = camera;
    this.physics = physics;
    this.audio = audio;
    this.scene = scene;

    // Create Tractor Beam energy line geometry
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -10)
    ]);
    this.beamMaterial = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    this.beamLine = new THREE.Line(geom, this.beamMaterial);
    this.beamLine.visible = false;
    this.scene.add(this.beamLine);

    this.setupInputListeners();
  }

  private setupInputListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('wheel', (e) => {
      if (this.lockedBody) {
        this.targetDistance += e.deltaY * 0.01;
        this.targetDistance = Math.max(3, Math.min(30, this.targetDistance));
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target instanceof HTMLCanvasElement) {
        if (e.button === 0) { // Left click: grab object
          if (this.hoveredBody && !this.hoveredBody.isStatic) {
            this.lockedBody = this.hoveredBody;
            this.targetDistance = this.camera.position.distanceTo(this.lockedBody.position);
            this.audio.setTractorActive(true);
          }
        } else if (e.button === 2) { // Right click: blast/fling object forward
          this.flingCurrentObject();
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.lockedBody) {
        this.lockedBody = null;
        this.audio.setTractorActive(false);
        if (this.beamLine) this.beamLine.visible = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public flingCurrentObject() {
    const target = this.lockedBody || this.hoveredBody;
    if (target && !target.isStatic) {
      const flingDir = new THREE.Vector3();
      this.camera.getWorldDirection(flingDir);
      target.velocity.addScaledVector(flingDir, 25 / Math.sqrt(target.mass));
      target.angularVelocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ));
      this.audio.playFling();

      if (this.lockedBody) {
        this.lockedBody = null;
        this.audio.setTractorActive(false);
        if (this.beamLine) this.beamLine.visible = false;
      }
    }
  }

  public update() {
    // 1. Raycast to detect hovered object
    this.raycaster.setFromCamera(this.mousePos, this.camera);
    const validMeshes = this.physics.bodies
      .filter(b => !b.isStatic)
      .map(b => b.mesh);

    const intersects = this.raycaster.intersectObjects(validMeshes, true);

    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && !topObj.userData.physicsBody && topObj.parent) {
        topObj = topObj.parent;
      }
      if (topObj && topObj.userData.physicsBody) {
        this.hoveredBody = topObj.userData.physicsBody;
      } else {
        this.hoveredBody = null;
      }
    } else {
      this.hoveredBody = null;
    }

    // 2. Physics & Beam update for locked object
    if (this.lockedBody && this.beamLine) {
      const targetPoint = this.camera.position.clone().add(
        this.raycaster.ray.direction.clone().multiplyScalar(this.targetDistance)
      );

      // Spring damper force
      const force = new THREE.Vector3().subVectors(targetPoint, this.lockedBody.position);
      const dist = force.length();

      // Pull toward reticle position
      this.lockedBody.velocity.lerp(force.clone().multiplyScalar(8), 0.2);
      this.lockedBody.angularVelocity.multiplyScalar(0.92); // Damp spin while held

      // Update beam visual
      this.beamLine.visible = true;
      const rayOrigin = this.camera.position.clone().add(new THREE.Vector3(0, -0.3, -0.5).applyQuaternion(this.camera.quaternion));
      const points = [rayOrigin, this.lockedBody.position.clone()];
      this.beamLine.geometry.setFromPoints(points);
      (this.beamLine.material as THREE.LineBasicMaterial).opacity = Math.min(1.0, 0.4 + dist * 0.1);
    } else if (this.beamLine) {
      this.beamLine.visible = false;
    }
  }
}
