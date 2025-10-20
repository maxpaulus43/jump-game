/**
 * Collision Detection Type Definitions
 * 
 * Defines all types needed for the collision detection system including
 * collision shapes, detection results, materials, and the Collidable interface.
 */

/**
 * Types of collision shapes supported
 */
export enum CollisionShapeType {
  Circle = 'circle',
  Rectangle = 'rectangle'
}

/**
 * Base interface for all collision shapes
 */
export interface CollisionShape {
  type: CollisionShapeType;
}

/**
 * Circle collision shape
 */
export interface CircleShape extends CollisionShape {
  type: CollisionShapeType.Circle;
  /** Center position X */
  x: number;
  /** Center position Y */
  y: number;
  /** Radius */
  radius: number;
}

/**
 * Axis-Aligned Bounding Box (rectangle) collision shape
 */
export interface RectangleShape extends CollisionShape {
  type: CollisionShapeType.Rectangle;
  /** Top-left X position */
  x: number;
  /** Top-left Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  /** Whether a collision occurred */
  colliding: boolean;
  /** Penetration depth (how much objects overlap) */
  depth: number;
  /** Normal vector pointing from shape A to shape B (direction to resolve collision) */
  normal: { x: number; y: number };
  /** Contact point (where collision occurred) */
  contactPoint: { x: number; y: number };
}

/**
 * Material properties for collision response
 */
export interface CollisionMaterial {
  /** Bounciness coefficient (0 = no bounce, 1 = perfect bounce) */
  restitution: number;
  /** Friction coefficient (0 = no friction, 1 = full friction) */
  friction: number;
}

/**
 * Interface for entities that can collide
 */
export interface Collidable {
  /** Get the collision shape for this entity */
  getCollisionShape(): CollisionShape;
  /** Get collision material properties */
  getCollisionMaterial(): CollisionMaterial;
  /** Handle collision response */
  onCollision(other: Collidable, result: CollisionResult): void;
}
