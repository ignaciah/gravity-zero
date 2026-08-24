import * as THREE from 'three';

export type GravityMode = 'ZEROG' | 'MICROG' | 'LUNAR' | 'MARTIAN' | 'EARTH' | 'SINGULARITY';

export interface PhysicsBody {
  id: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  mass: number;
  radius: number;
  restitution: number;
  isStatic: boolean;
  isSingularity?: boolean;
  type: string;
}

export class PhysicsEngine {
  public bodies: PhysicsBody[] = [];
  public gravityMode: GravityMode = 'ZEROG';
  public customGravityVector: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public restitutionMultiplier: number = 0.8;
  public linearDrag: number = 0.001; // minimal drag in space
  public timeScale: number = 1.0;
  public containmentRadius: number = 35; // Space station containment volume boundary

  private onImpactCallback?: (speed: number) => void;

  constructor() {
    this.setGravityMode('ZEROG');
  }

  public setOnImpactCallback(cb: (speed: number) => void) {
    this.onImpactCallback = cb;
  }

  public setGravityMode(mode: GravityMode) {
    this.gravityMode = mode;
    switch (mode) {
      case 'ZEROG':
        this.customGravityVector.set(0, 0, 0);
        break;
      case 'MICROG':
        this.customGravityVector.set(0, -0.5, 0);
        break;
      case 'LUNAR':
        this.customGravityVector.set(0, -1.62, 0);
        break;
      case 'MARTIAN':
        this.customGravityVector.set(0, -3.72, 0);
        break;
      case 'EARTH':
        this.customGravityVector.set(0, -9.81, 0);
        break;
      case 'SINGULARITY':
        this.customGravityVector.set(0, 0, 0);
        break;
    }
  }

  public addBody(body: PhysicsBody) {
    this.bodies.push(body);
  }

  public removeBody(id: string) {
    const idx = this.bodies.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.bodies.splice(idx, 1);
    }
  }

  public clearAllNonStatic() {
    this.bodies = this.bodies.filter(b => b.isStatic);
  }

  public update(dt: number) {
    const effectiveDt = Math.min(dt, 0.05) * this.timeScale;
    if (effectiveDt <= 0) return;

    // 1. Find Black Hole Singularities if present
    const singularities = this.bodies.filter(b => b.isSingularity);

    // 2. Apply forces & integrate positions
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b.isStatic) continue;

      // Gravity force
      if (this.gravityMode === 'SINGULARITY' || singularities.length > 0) {
        const center = singularities.length > 0 ? singularities[0].position : new THREE.Vector3(0, 0, 0);
        const dir = new THREE.Vector3().subVectors(center, b.position);
        const distSq = Math.max(dir.lengthSq(), 4);
        dir.normalize();
        const gForce = 1500 / distSq; // Inverse square attraction
        b.velocity.addScaledVector(dir, gForce * effectiveDt);
      } else {
        b.velocity.addScaledVector(this.customGravityVector, effectiveDt);
      }

      // Drag / damping
      b.velocity.multiplyScalar(Math.max(0, 1 - this.linearDrag * effectiveDt * 60));
      b.angularVelocity.multiplyScalar(Math.max(0, 1 - (this.linearDrag + 0.002) * effectiveDt * 60));

      // Euler integration
      b.position.addScaledVector(b.velocity, effectiveDt);
      b.mesh.position.copy(b.position);

      // Rotation integration
      if (b.angularVelocity.lengthSq() > 0.00001) {
        const rotDelta = new THREE.Quaternion()
          .setFromAxisAngle(b.angularVelocity.clone().normalize(), b.angularVelocity.length() * effectiveDt);
        b.mesh.quaternion.multiplyQuaternions(rotDelta, b.mesh.quaternion);
      }

      // Containment boundary (Station deck)
      this.applyContainmentBoundary(b);
    }

    // 3. Collision Resolution
    this.resolveCollisions();
  }

  private applyContainmentBoundary(b: PhysicsBody) {
    const distFromOrigin = b.position.length();
    if (distFromOrigin + b.radius > this.containmentRadius) {
      const normal = b.position.clone().normalize().negate();
      const overlap = (distFromOrigin + b.radius) - this.containmentRadius;
      b.position.addScaledVector(normal, -overlap);
      b.mesh.position.copy(b.position);

      const dot = b.velocity.dot(normal);
      if (dot < 0) {
        const bounceVel = normal.multiplyScalar(-1.8 * dot * this.restitutionMultiplier * b.restitution);
        b.velocity.add(bounceVel);

        // Sound trigger
        if (Math.abs(dot) > 1.5 && this.onImpactCallback) {
          this.onImpactCallback(Math.abs(dot));
        }
      }
    }
  }

  private resolveCollisions() {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const b1 = this.bodies[i];
        const b2 = this.bodies[j];

        if (b1.isStatic && b2.isStatic) continue;

        const delta = new THREE.Vector3().subVectors(b2.position, b1.position);
        const dist = delta.length();
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0.0001) {
          const normal = delta.clone().divideScalar(dist);
          const overlap = minDist - dist;

          // Positional correction
          const totalMass = (b1.isStatic ? 0 : 1 / b1.mass) + (b2.isStatic ? 0 : 1 / b2.mass);
          if (totalMass === 0) continue;

          if (!b1.isStatic) {
            b1.position.addScaledVector(normal, -overlap * ((1 / b1.mass) / totalMass));
            b1.mesh.position.copy(b1.position);
          }
          if (!b2.isStatic) {
            b2.position.addScaledVector(normal, overlap * ((1 / b2.mass) / totalMass));
            b2.mesh.position.copy(b2.position);
          }

          // Elastic collision impulse
          const relativeVel = new THREE.Vector3().subVectors(b2.velocity, b1.velocity);
          const velAlongNormal = relativeVel.dot(normal);

          if (velAlongNormal < 0) {
            const e = Math.min(b1.restitution, b2.restitution) * this.restitutionMultiplier;
            const impulseMagnitude = -(1 + e) * velAlongNormal / totalMass;
            const impulse = normal.clone().multiplyScalar(impulseMagnitude);

            if (!b1.isStatic) {
              b1.velocity.addScaledVector(impulse, -1 / b1.mass);
              // Add slight angular spin on impact
              b1.angularVelocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * impulseMagnitude * 0.1,
                (Math.random() - 0.5) * impulseMagnitude * 0.1,
                (Math.random() - 0.5) * impulseMagnitude * 0.1
              ));
            }
            if (!b2.isStatic) {
              b2.velocity.addScaledVector(impulse, 1 / b2.mass);
              b2.angularVelocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * impulseMagnitude * 0.1,
                (Math.random() - 0.5) * impulseMagnitude * 0.1,
                (Math.random() - 0.5) * impulseMagnitude * 0.1
              ));
            }

            // Sound feedback
            if (Math.abs(velAlongNormal) > 1.0 && this.onImpactCallback) {
              this.onImpactCallback(Math.abs(velAlongNormal));
            }
          }
        }
      }
    }
  }

  public getTelemetryStats() {
    let totalKineticEnergy = 0;
    const totalMomentum = new THREE.Vector3(0, 0, 0);

    for (const b of this.bodies) {
      if (b.isStatic) continue;
      const speedSq = b.velocity.lengthSq();
      totalKineticEnergy += 0.5 * b.mass * speedSq;
      totalMomentum.addScaledVector(b.velocity, b.mass);
    }

    return {
      activeCount: this.bodies.filter(b => !b.isStatic).length,
      kineticEnergy: totalKineticEnergy.toFixed(1),
      momentumMagnitude: totalMomentum.length().toFixed(1)
    };
  }
}
