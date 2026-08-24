import * as THREE from 'three';
import type { PhysicsBody } from '../engine/PhysicsEngine';

export class ObjectFactory {
  private static idCounter = 0;

  private static generateId(prefix: string): string {
    return `${prefix}_${++this.idCounter}_${Math.random().toString(36).substr(2, 4)}`;
  }

  public static createCargoCrate(pos: THREE.Vector3, mass: number = 5.0, size: number = 1.5): PhysicsBody {
    const group = new THREE.Group();
    
    // Main Box
    const geom = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
      bumpScale: 0.05
    });
    const boxMesh = new THREE.Mesh(geom, mat);
    group.add(boxMesh);

    // Glowing Frame Edges
    const edgesGeom = new THREE.EdgesGeometry(geom);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edgesGeom, edgesMat);
    group.add(wireframe);

    // Corner reinforcement brackets
    const bracketGeom = new THREE.BoxGeometry(size * 1.02, size * 0.2, size * 0.2);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
    const b1 = new THREE.Mesh(bracketGeom, bracketMat);
    group.add(b1);

    group.position.copy(pos);

    const body: PhysicsBody = {
      id: this.generateId('crate'),
      mesh: group,
      position: pos.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      mass: mass,
      radius: size * 0.86,
      restitution: 0.75,
      isStatic: false,
      type: 'Crate'
    };

    group.userData.physicsBody = body;
    return body;
  }

  public static createEnergyOrb(pos: THREE.Vector3, mass: number = 2.0, radius: number = 0.9): PhysicsBody {
    const group = new THREE.Group();

    // Emissive Core Sphere
    const coreGeom = new THREE.SphereGeometry(radius * 0.6, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Outer Translucent Shield
    const shieldGeom = new THREE.SphereGeometry(radius, 32, 32);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.5,
      wireframe: true
    });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    group.add(shield);

    group.position.copy(pos);

    const body: PhysicsBody = {
      id: this.generateId('orb'),
      mesh: group,
      position: pos.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4),
      mass: mass,
      radius: radius,
      restitution: 0.95,
      isStatic: false,
      type: 'EnergyOrb'
    };

    group.userData.physicsBody = body;
    return body;
  }

  public static createSatellite(pos: THREE.Vector3, mass: number = 8.0): PhysicsBody {
    const group = new THREE.Group();

    // Body Cylinder
    const bodyGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.6, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(mainBody);

    // Solar Panel Wings
    const wingGeom = new THREE.BoxGeometry(4.0, 0.05, 1.0);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.3 });
    const wings = new THREE.Mesh(wingGeom, wingMat);
    group.add(wings);

    // Antenna dish
    const dishGeom = new THREE.ConeGeometry(0.5, 0.4, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 1.0, roughness: 0.1 });
    const dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.y = 1.0;
    dish.rotation.x = Math.PI;
    group.add(dish);

    group.position.copy(pos);

    const body: PhysicsBody = {
      id: this.generateId('satellite'),
      mesh: group,
      position: pos.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5),
      mass: mass,
      radius: 2.1,
      restitution: 0.65,
      isStatic: false,
      type: 'Satellite'
    };

    group.userData.physicsBody = body;
    return body;
  }

  public static createBlackHole(pos: THREE.Vector3): PhysicsBody {
    const group = new THREE.Group();

    // Dark Event Horizon Sphere
    const holeGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const hole = new THREE.Mesh(holeGeom, holeMat);
    group.add(hole);

    // Glowing Purple Accretion Ring
    const ringGeom = new THREE.RingGeometry(1.8, 3.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    group.position.copy(pos);

    const body: PhysicsBody = {
      id: this.generateId('blackhole'),
      mesh: group,
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 1.5, 0),
      mass: 5000.0,
      radius: 2.0,
      restitution: 0.0,
      isStatic: true,
      isSingularity: true,
      type: 'Singularity'
    };

    group.userData.physicsBody = body;
    return body;
  }

  public static createSpaceDebris(pos: THREE.Vector3, mass: number = 3.0): PhysicsBody {
    const group = new THREE.Group();

    const geom = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.4, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      metalness: 0.3
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    group.position.copy(pos);

    const body: PhysicsBody = {
      id: this.generateId('debris'),
      mesh: group,
      position: pos.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
      mass: mass,
      radius: 1.0,
      restitution: 0.8,
      isStatic: false,
      type: 'SpaceDebris'
    };

    group.userData.physicsBody = body;
    return body;
  }

  public static createPowerCell(pos: THREE.Vector3): PhysicsBody {
    const group = new THREE.Group();

    const geom = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    group.position.copy(pos);

    const body: PhysicsBody = {
      id: this.generateId('powercell'),
      mesh: group,
      position: pos.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0),
      angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      mass: 4.0,
      radius: 0.7,
      restitution: 0.8,
      isStatic: false,
      type: 'PowerCell'
    };

    group.userData.physicsBody = body;
    return body;
  }
}
