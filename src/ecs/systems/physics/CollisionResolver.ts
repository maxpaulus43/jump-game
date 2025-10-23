/**
 * CollisionResolver - Static utility class for collision response and physics resolution
 * 
 * Handles applying impulses, resolving penetration, and calculating bounce effects.
 * Works with Collidable entities to apply collision responses.
 */

import { Vec2 } from '../../../utils/Vec2.js';
import type { Collidable, CollisionResult } from '../../../types/index.js';

export class CollisionResolver {
  /**
   * Resolve collision between two entities
   * 
   * Applies collision response including velocity changes and position correction.
   * 
   * @param entityA - First collidable entity
   * @param entityB - Second collidable entity
   * @param result - Collision detection result
   */
  static resolveCollision(
    entityA: Collidable,
    entityB: Collidable,
    result: CollisionResult
  ): void {
    if (!result.colliding) {
      return;
    }

    // Let entities handle their own collision response
    // This allows for custom behavior per entity type
    entityA.onCollision(entityB, result);

    // Create inverted result for entity B
    const invertedResult: CollisionResult = {
      colliding: result.colliding,
      depth: result.depth,
      normal: result.normal.clone().multiply(-1),
      contactPoint: result.contactPoint
    };
    entityB.onCollision(entityA, invertedResult);
  }

  /**
   * Calculate bounce velocity after collision
   * 
   * Uses reflection formula: v' = v - (1 + e) * (v · n) * n
   * where v is velocity, n is normal, e is restitution (bounciness)
   * 
   * @param velocity - Current velocity vector
   * @param normal - Collision normal vector
   * @param restitution - Bounciness coefficient (0-1)
   * @returns New velocity vector after bounce
   */
  static calculateBounce(
    velocity: Vec2,
    normal: Vec2,
    restitution: number
  ): Vec2 {
    // Calculate dot product: v · n
    const velocityDotNormal = velocity.dot(normal);

    // Only apply bounce if moving into the surface
    if (velocityDotNormal >= 0) {
      return velocity.clone();
    }

    // Calculate reflection: v' = v - (1 + e) * (v · n) * n
    const bounceVelocity = velocity.clone();
    const impulse = (1 + restitution) * velocityDotNormal;

    bounceVelocity.x -= impulse * normal.x;
    bounceVelocity.y -= impulse * normal.y;

    return bounceVelocity;
  }

  /**
   * Apply impulse to entity velocity
   * 
   * Used for collision response with forces
   * 
   * @param velocity - Current velocity to modify (will be mutated)
   * @param impulse - Impulse vector to apply
   */
  static applyImpulse(velocity: Vec2, impulse: Vec2): void {
    velocity.add(impulse);
  }

  /**
   * Calculate relative velocity between two entities
   * 
   * Useful for determining collision severity and response
   * 
   * @param velocityA - Velocity of first entity
   * @param velocityB - Velocity of second entity
   * @returns Relative velocity (A relative to B)
   */
  static calculateRelativeVelocity(velocityA: Vec2, velocityB: Vec2): Vec2 {
    return Vec2.subtract(velocityA, velocityB);
  }

  /**
   * Calculate closing velocity along collision normal
   * 
   * Returns how fast objects are approaching along the collision axis
   * Negative values indicate objects moving apart
   * 
   * @param velocityA - Velocity of first entity
   * @param velocityB - Velocity of second entity
   * @param normal - Collision normal vector
   * @returns Closing velocity (negative if separating)
   */
  static calculateClosingVelocity(
    velocityA: Vec2,
    velocityB: Vec2,
    normal: Vec2
  ): number {
    const relativeVelocity = this.calculateRelativeVelocity(velocityA, velocityB);
    return relativeVelocity.dot(normal);
  }
}
