import * as THREE from 'three';
import { AudioManager } from './AudioManager';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private audio: AudioManager;

  // 6-DOF Camera movement state
  public isFlightControlActive: boolean = false;
  private cameraVelocity: THREE.Vector3 = new THREE.Vector3();
  private keysPressed: { [key: string]: boolean } = {};
  private pitch: number = 0;
  private yaw: number = 0;

  private earthMesh: THREE.Mesh | null = null;
  private starParticles: THREE.Points | null = null;

  constructor(container: HTMLElement, audio: AudioManager) {
    this.audio = audio;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.008);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Setup Lighting & Environment
    this.setupLighting();
    this.setupEnvironment();
    this.setupFlightInput();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x1e293b, 1.5);
    this.scene.add(ambient);

    // Key Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(50, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    // Cyan Neon Fill Light
    const cyanLight = new THREE.PointLight(0x00f0ff, 3, 40);
    cyanLight.position.set(0, 15, 0);
    this.scene.add(cyanLight);

    // Magenta Accent Light
    const magentaLight = new THREE.PointLight(0xff0077, 2, 30);
    magentaLight.position.set(0, -15, 0);
    this.scene.add(magentaLight);
  }

  private setupEnvironment() {
    // 1. Starfield
    const starCount = 4000;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;

      const isBlue = Math.random() > 0.7;
      starColors[i * 3] = isBlue ? 0.4 : 1.0;
      starColors[i * 3 + 1] = isBlue ? 0.8 : 0.9;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    this.starParticles = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starParticles);

    // 2. Earth Horizon Sphere in distant background
    const earthGeom = new THREE.SphereGeometry(120, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.7,
      metalness: 0.1
    });
    this.earthMesh = new THREE.Mesh(earthGeom, earthMat);
    this.earthMesh.position.set(0, -145, -80);
    this.scene.add(this.earthMesh);

    // Atmosphere Glow Ring
    const atmosphereGeom = new THREE.SphereGeometry(122, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.25
    });
    const atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    atmosphere.position.copy(this.earthMesh.position);
    this.scene.add(atmosphere);

    // 3. Space Station Circular Containment Platform
    const floorGeom = new THREE.CylinderGeometry(30, 30, 0.5, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
      wireframe: false
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -15;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Glowing Neon Ring on Deck
    const ringGeom = new THREE.RingGeometry(25, 26, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -14.7;
    this.scene.add(ring);

    // Perimeter Containment Beams
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 29;
      const z = Math.sin(angle) * 29;

      const beamGeom = new THREE.CylinderGeometry(0.3, 0.3, 30, 8);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
      const pillar = new THREE.Mesh(beamGeom, beamMat);
      pillar.position.set(x, 0, z);
      this.scene.add(pillar);
    }
  }

  private setupFlightInput() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });

    // Mouse Pointer Lock / Rotation
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.renderer.domElement) {
        this.yaw -= e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
      }
    });

    this.renderer.domElement.addEventListener('click', () => {
      if (this.isFlightControlActive && document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock();
      }
    });
  }

  public update(dt: number) {
    // Slowly rotate background Earth
    if (this.earthMesh) {
      this.earthMesh.rotation.y += dt * 0.02;
    }

    // 6-DOF Flight Controls
    if (this.isFlightControlActive) {
      const moveSpeed = 15.0;
      const moveDir = new THREE.Vector3(0, 0, 0);

      if (this.keysPressed['KeyW']) moveDir.z -= 1;
      if (this.keysPressed['KeyS']) moveDir.z += 1;
      if (this.keysPressed['KeyA']) moveDir.x -= 1;
      if (this.keysPressed['KeyD']) moveDir.x += 1;
      if (this.keysPressed['KeyE']) moveDir.y += 1;
      if (this.keysPressed['KeyQ']) moveDir.y -= 1;

      const isThrusterActive = moveDir.lengthSq() > 0;
      this.audio.setThrusterActive(isThrusterActive);

      if (isThrusterActive) {
        moveDir.normalize();
        moveDir.applyQuaternion(this.camera.quaternion);
        this.cameraVelocity.lerp(moveDir.multiplyScalar(moveSpeed), 0.1);
      } else {
        this.cameraVelocity.multiplyScalar(0.92); // Space drag damping
      }

      this.camera.position.addScaledVector(this.cameraVelocity, dt);
    }
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
