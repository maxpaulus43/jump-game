import type { Vector2D } from '../types/index.js';

/**
 * Utility class for 2D vector mathematics
 * All methods are static and pure (no side effects)
 */
export class Vector2DUtils {
  /**
   * Add two vectors
   */
  static add(a: Vector2D, b: Vector2D): Vector2D {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }

  /**
   * Subtract vector b from vector a
   */
  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }

  /**
   * Multiply vector by scalar value
   */
  static multiply(v: Vector2D, scalar: number): Vector2D {
    return {
      x: v.x * scalar,
      y: v.y * scalar
    };
  }

  /**
   * Calculate the magnitude (length) of a vector
   */
  static magnitude(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  /**
   * Normalize a vector to unit length
   * Returns zero vector if magnitude is zero
   */
  static normalize(v: Vector2D): Vector2D {
    const mag = Vector2DUtils.magnitude(v);
    if (mag === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: v.x / mag,
      y: v.y / mag
    };
  }

  /**
   * Calculate distance between two points
   */
  static distance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate dot product of two vectors
   */
  static dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * Create a zero vector
   */
  static zero(): Vector2D {
    return { x: 0, y: 0 };
  }

  /**
   * Create a vector from angle (in radians)
   */
  static fromAngle(angle: number, length: number = 1): Vector2D {
    return {
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length
    };
  }
}
