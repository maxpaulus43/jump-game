/**
 * PhysicsSystem.ts
 * 
 * Physics system orchestrates physics simulation
 * Handles collision detection, resolution, and physics integration
 */

import { Vec2 } from '../../utils/Vec2.js';
import type { Entity } from '../../types/world.js';
import { Collidable } from '../../types/collision.js';
import { PhysicsConfig, PhysicsResult, CollisionPair } from '../../types/physics.js';
import { CollisionDetector } from './CollisionDetector.js';
import { CollisionResolver } from './CollisionResolver.js';

/**
 * PhysicsSystem handles all physics simulation
 * Coordinates collision detection and resolution
 */
export class PhysicsSystem {
  private config: PhysicsConfig;

  /**
   * Create a new physics system
   * 
   * @param config - Physics configuration
   */
  constructor(config: PhysicsConfig) {
    this.config = config;
  }

  /**
   * Update physics for all entities
   * 
   * @param _dt - Delta time in seconds (unused for now)
   * @param _physicalEntities - Entities that participate in physics (unused for now)
   * @param collidables - Entities that can collide
   * @returns Physics result with collision information
   */
  update(
    _dt: number,
    _physicalEntities: Entity[],
    collidables: Collidable[]
  ): PhysicsResult {
    const result: PhysicsResult = {
      collisions: []
    };

    // Detect and resolve collisions
    if (this.config.enableCollisions) {
      result.collisions = this.detectAndResolveCollisions(collidables);
    }

    return result;
  }

  /**
   * Detect collisions between all collidable entities
   * 
   * @param collidables - Array of collidable entities
   * @returns Array of collision pairs
   */
  private detectCollisions(collidables: Collidable[]): CollisionPair[] {
    const collisions: CollisionPair[] = [];

    // Check all pairs of collidables
    for (let i = 0; i < collidables.length; i++) {
      for (let j = i + 1; j < collidables.length; j++) {
        const entityA = collidables[i];
        const entityB = collidables[j];

        const shapeA = entityA.getCollisionShape();
        const shapeB = entityB.getCollisionShape();

        const collisionResult = CollisionDetector.checkCollision(shapeA, shapeB);

        if (collisionResult.colliding) {
          collisions.push({
            entityA,
            entityB,
            result: collisionResult
          });
        }
      }
    }

    return collisions;
  }

  /**
   * Resolve all collisions
   * 
   * @param collisions - Array of collision pairs to resolve
   */
  private resolveCollisions(collisions: CollisionPair[]): void {
    for (const collision of collisions) {
      CollisionResolver.resolveCollision(
        collision.entityA,
        collision.entityB,
        collision.result
      );
    }
  }

  /**
   * Detect and resolve all collisions
   * 
   * @param collidables - Array of collidable entities
   * @returns Array of collision pairs that were detected
   */
  private detectAndResolveCollisions(collidables: Collidable[]): CollisionPair[] {
    const collisions = this.detectCollisions(collidables);
    this.resolveCollisions(collisions);
    return collisions;
  }

  /**
   * Set gravity vector
   * 
   * @param gravity - New gravity vector
   */
  setGravity(gravity: Vec2): void {
    this.config.gravity = gravity.clone();
  }

  /**
   * Get current gravity vector
   * 
   * @returns Gravity vector (cloned for safety)
   */
  getGravity(): Vec2 {
    return this.config.gravity.clone();
  }

  /**
   * Enable or disable collision detection
   * 
   * @param enabled - Whether collisions should be enabled
   */
  setCollisionsEnabled(enabled: boolean): void {
    this.config.enableCollisions = enabled;
  }

  /**
   * Check if collisions are enabled
   * 
   * @returns True if collisions are enabled
   */
  areCollisionsEnabled(): boolean {
    return this.config.enableCollisions;
  }
}
