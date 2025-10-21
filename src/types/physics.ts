/**
 * physics.ts
 * 
 * Type definitions for physics system
 */

import { Vec2 } from '../utils/Vec2.js';
import { Collidable, CollisionResult } from './collision.js';

/**
 * Physics system configuration
 */
export interface PhysicsConfig {
  /**
   * Gravity vector (typically pointing down)
   */
  gravity: Vec2;
  
  /**
   * Enable collision detection and resolution
   */
  enableCollisions: boolean;
}

/**
 * Result of physics update containing collision information
 */
export interface PhysicsResult {
  /**
   * All collisions detected this frame
   */
  collisions: CollisionPair[];
}

/**
 * A pair of entities that collided
 */
export interface CollisionPair {
  /**
   * First entity in collision
   */
  entityA: Collidable;
  
  /**
   * Second entity in collision
   */
  entityB: Collidable;
  
  /**
   * Collision result data
   */
  result: CollisionResult;
}
