/**
 * CollisionDetector - Static utility class for collision detection algorithms
 * 
 * Provides pure functions for detecting collisions between various shape types.
 * Follows zero-allocation patterns where possible using optional output parameters.
 */

import {
  CollisionShape,
  CollisionShapeType,
  CircleShape,
  RectangleShape,
  CollisionResult,
  Ray,
  RaycastResult,
  Collidable
} from '../../../types/collision.js';
import { Vec2 } from '../../../utils/Vec2.js';

export class CollisionDetector {
  /**
   * Main entry point for collision detection
   * Dispatches to appropriate shape-vs-shape method based on types
   * 
   * @param shapeA - First collision shape
   * @param shapeB - Second collision shape
   * @param out - Optional output parameter to reuse CollisionResult (zero-allocation)
   * @returns Collision result with collision data
   */
  static checkCollision(
    shapeA: CollisionShape,
    shapeB: CollisionShape,
    out?: CollisionResult
  ): CollisionResult {
    // Dispatch based on shape types
    if (shapeA.type === CollisionShapeType.Circle && shapeB.type === CollisionShapeType.Circle) {
      return this.circleVsCircle(shapeA as CircleShape, shapeB as CircleShape, out);
    } else if (shapeA.type === CollisionShapeType.Circle && shapeB.type === CollisionShapeType.Rectangle) {
      return this.circleVsRectangle(shapeA as CircleShape, shapeB as RectangleShape, out);
    } else if (shapeA.type === CollisionShapeType.Rectangle && shapeB.type === CollisionShapeType.Circle) {
      // Reverse order for circle vs rectangle
      const result = this.circleVsRectangle(shapeB as CircleShape, shapeA as RectangleShape, out);
      // Flip normal direction since we reversed the order
      result.normal.x = -result.normal.x;
      result.normal.y = -result.normal.y;
      return result;
    } else if (shapeA.type === CollisionShapeType.Rectangle && shapeB.type === CollisionShapeType.Rectangle) {
      return this.rectangleVsRectangle(shapeA as RectangleShape, shapeB as RectangleShape, out);
    }

    // Unsupported collision type - return no collision
    return out || {
      colliding: false,
      depth: 0,
      normal: new Vec2(0, 0),
      contactPoint: { x: 0, y: 0 }
    };
  }

  /**
   * Detect collision between two circles
   * 
   * Algorithm: Compare distance between centers to sum of radii
   * 
   * @param circleA - First circle
   * @param circleB - Second circle
   * @param out - Optional output parameter
   * @returns Collision result
   */
  static circleVsCircle(
    circleA: CircleShape,
    circleB: CircleShape,
    out?: CollisionResult
  ): CollisionResult {
    // Calculate distance between centers
    const dx = circleB.x - circleA.x;
    const dy = circleB.y - circleA.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = circleA.radius + circleB.radius;
    const radiusSumSquared = radiusSum * radiusSum;

    // Check if circles are overlapping
    const colliding = distanceSquared < radiusSumSquared;

    if (colliding) {
      const distance = Math.sqrt(distanceSquared);
      const depth = radiusSum - distance;

      // Calculate normal (from A to B)
      let normalX = 0;
      let normalY = 0;
      if (distance > 0.0001) {
        normalX = dx / distance;
        normalY = dy / distance;
      } else {
        // Circles are at same position, use arbitrary normal
        normalX = 1;
        normalY = 0;
      }

      // Contact point is between the circles
      const contactX = circleA.x + normalX * circleA.radius;
      const contactY = circleA.y + normalY * circleA.radius;

      if (out) {
        out.colliding = true;
        out.depth = depth;
        out.normal.x = normalX;
        out.normal.y = normalY;
        out.contactPoint.x = contactX;
        out.contactPoint.y = contactY;
        return out;
      }

      return {
        colliding: true,
        depth,
        normal: new Vec2(normalX, normalY),
        contactPoint: { x: contactX, y: contactY }
      };
    }

    // No collision
    if (out) {
      out.colliding = false;
      out.depth = 0;
      out.normal.x = 0;
      out.normal.y = 0;
      out.contactPoint.x = 0;
      out.contactPoint.y = 0;
      return out;
    }

    return {
      colliding: false,
      depth: 0,
      normal: new Vec2(0, 0),
      contactPoint: { x: 0, y: 0 }
    };
  }

  /**
   * Detect collision between circle and AABB (rectangle)
   * 
   * Algorithm: Find closest point on rectangle to circle center, check distance
   * 
   * @param circle - Circle shape
   * @param rect - Rectangle shape
   * @param out - Optional output parameter
   * @returns Collision result
   */
  static circleVsRectangle(
    circle: CircleShape,
    rect: RectangleShape,
    out?: CollisionResult
  ): CollisionResult {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate distance from circle center to closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = circle.radius * circle.radius;

    // Check if circle is colliding with rectangle
    const colliding = distanceSquared < radiusSquared;

    if (colliding) {
      const distance = Math.sqrt(distanceSquared);
      const depth = circle.radius - distance;

      // Calculate normal (from rectangle to circle)
      let normalX = 0;
      let normalY = 0;

      if (distance > 0.0001) {
        // Circle center is outside rectangle
        normalX = dx / distance;
        normalY = dy / distance;
      } else {
        // Circle center is inside rectangle - need to find closest edge
        // Calculate distances to each edge
        const distLeft = Math.abs(circle.x - rect.x);
        const distRight = Math.abs(circle.x - (rect.x + rect.width));
        const distTop = Math.abs(circle.y - rect.y);
        const distBottom = Math.abs(circle.y - (rect.y + rect.height));

        // Find closest edge
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist === distLeft) {
          normalX = -1;
          normalY = 0;
        } else if (minDist === distRight) {
          normalX = 1;
          normalY = 0;
        } else if (minDist === distTop) {
          normalX = 0;
          normalY = -1;
        } else {
          normalX = 0;
          normalY = 1;
        }
      }

      if (out) {
        out.colliding = true;
        out.depth = depth;
        out.normal.x = normalX;
        out.normal.y = normalY;
        out.contactPoint.x = closestX;
        out.contactPoint.y = closestY;
        return out;
      }

      return {
        colliding: true,
        depth,
        normal: new Vec2(normalX, normalY),
        contactPoint: { x: closestX, y: closestY }
      };
    }

    // No collision
    if (out) {
      out.colliding = false;
      out.depth = 0;
      out.normal.x = 0;
      out.normal.y = 0;
      out.contactPoint.x = 0;
      out.contactPoint.y = 0;
      return out;
    }

    return {
      colliding: false,
      depth: 0,
      normal: new Vec2(0, 0),
      contactPoint: { x: 0, y: 0 }
    };
  }

  /**
   * Detect collision between two AABBs (rectangles)
   * 
   * Algorithm: Check overlap on both axes
   * 
   * @param rectA - First rectangle
   * @param rectB - Second rectangle
   * @param out - Optional output parameter
   * @returns Collision result
   */
  static rectangleVsRectangle(
    rectA: RectangleShape,
    rectB: RectangleShape,
    out?: CollisionResult
  ): CollisionResult {
    // Calculate overlap on each axis
    const overlapX = Math.min(rectA.x + rectA.width, rectB.x + rectB.width) -
      Math.max(rectA.x, rectB.x);
    const overlapY = Math.min(rectA.y + rectA.height, rectB.y + rectB.height) -
      Math.max(rectA.y, rectB.y);

    // Check if rectangles are overlapping
    const colliding = overlapX > 0 && overlapY > 0;

    if (colliding) {
      // Determine collision axis (smallest overlap)
      const depth = Math.min(overlapX, overlapY);

      let normalX = 0;
      let normalY = 0;

      if (overlapX < overlapY) {
        // Collision on X axis
        normalX = (rectA.x + rectA.width / 2) < (rectB.x + rectB.width / 2) ? -1 : 1;
        normalY = 0;
      } else {
        // Collision on Y axis
        normalX = 0;
        normalY = (rectA.y + rectA.height / 2) < (rectB.y + rectB.height / 2) ? -1 : 1;
      }

      // Contact point is at the center of overlap region
      const contactX = Math.max(rectA.x, rectB.x) + overlapX / 2;
      const contactY = Math.max(rectA.y, rectB.y) + overlapY / 2;

      if (out) {
        out.colliding = true;
        out.depth = depth;
        out.normal.x = normalX;
        out.normal.y = normalY;
        out.contactPoint.x = contactX;
        out.contactPoint.y = contactY;
        return out;
      }

      return {
        colliding: true,
        depth,
        normal: new Vec2(normalX, normalY),
        contactPoint: { x: contactX, y: contactY }
      };
    }

    // No collision
    if (out) {
      out.colliding = false;
      out.depth = 0;
      out.normal.x = 0;
      out.normal.y = 0;
      out.contactPoint.x = 0;
      out.contactPoint.y = 0;
      return out;
    }

    return {
      colliding: false,
      depth: 0,
      normal: new Vec2(0, 0),
      contactPoint: { x: 0, y: 0 }
    };
  }

  /**
   * Helper to check if a point is inside a rectangle
   * 
   * @param x - Point X coordinate
   * @param y - Point Y coordinate
   * @param rect - Rectangle shape
   * @returns True if point is inside rectangle
   */
  static pointVsRectangle(x: number, y: number, rect: RectangleShape): boolean {
    return x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height;
  }

  // ==================== RAYCAST METHODS ====================

  /**
   * Cast a ray against multiple collidable entities
   * Returns the closest hit result
   * 
   * @param ray - Ray definition (origin, direction, maxDistance)
   * @param collidables - Array of collidable entities to check against
   * @param out - Optional output parameter to reuse RaycastResult (zero-allocation)
   * @returns Raycast result with closest hit information
   */
  static raycast(
    ray: Ray,
    collidables: Collidable[],
    out?: RaycastResult
  ): RaycastResult {
    let closestHit: RaycastResult | null = null;
    let closestDistance = Infinity;

    // Check ray against each collidable
    for (const collidable of collidables) {
      const shape = collidable.getCollisionShape();
      const hit = this.raycastShape(ray, shape);

      if (hit.hit && hit.distance < closestDistance) {
        closestDistance = hit.distance;
        closestHit = hit;
        closestHit.entity = collidable;
        closestHit.shape = shape;
      }
    }

    // Return result
    if (closestHit && out) {
      out.hit = closestHit.hit;
      out.distance = closestHit.distance;
      out.point.x = closestHit.point.x;
      out.point.y = closestHit.point.y;
      out.normal.x = closestHit.normal.x;
      out.normal.y = closestHit.normal.y;
      out.entity = closestHit.entity;
      out.shape = closestHit.shape;
      return out;
    }

    if (closestHit) {
      return closestHit;
    }

    // No hit
    if (out) {
      out.hit = false;
      out.distance = 0;
      out.point.x = 0;
      out.point.y = 0;
      out.normal.x = 0;
      out.normal.y = 0;
      out.entity = null;
      out.shape = null;
      return out;
    }

    return {
      hit: false,
      distance: 0,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      entity: null,
      shape: null
    };
  }

  /**
   * Cast a ray against a single collision shape
   * Dispatches to appropriate ray-vs-shape method
   * 
   * @param ray - Ray definition
   * @param shape - Collision shape to test against
   * @returns Raycast result (entity and shape will be null)
   */
  static raycastShape(ray: Ray, shape: CollisionShape): RaycastResult {
    if (shape.type === CollisionShapeType.Circle) {
      return this.rayVsCircle(ray, shape as CircleShape);
    } else if (shape.type === CollisionShapeType.Rectangle) {
      return this.rayVsRectangle(ray, shape as RectangleShape);
    }

    // Unsupported shape type
    return {
      hit: false,
      distance: 0,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      entity: null,
      shape: null
    };
  }

  /**
   * Ray vs Circle intersection test
   * 
   * Algorithm: Solve quadratic equation for ray-circle intersection
   * Based on: https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
   * 
   * @param ray - Ray definition
   * @param circle - Circle shape
   * @returns Raycast result
   */
  static rayVsCircle(ray: Ray, circle: CircleShape): RaycastResult {
    // Vector from ray origin to circle center
    const ocX = ray.origin.x - circle.x;
    const ocY = ray.origin.y - circle.y;

    // Quadratic equation coefficients
    // We're solving: |origin + t*direction - center|^2 = radius^2
    const a = ray.direction.x * ray.direction.x + ray.direction.y * ray.direction.y;
    const b = 2 * (ocX * ray.direction.x + ocY * ray.direction.y);
    const c = (ocX * ocX + ocY * ocY) - (circle.radius * circle.radius);

    const discriminant = b * b - 4 * a * c;

    // No intersection if discriminant is negative
    if (discriminant < 0) {
      return {
        hit: false,
        distance: 0,
        point: { x: 0, y: 0 },
        normal: { x: 0, y: 0 },
        entity: null,
        shape: null
      };
    }

    // Calculate intersection points
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    // We want the closest positive intersection
    let t = -1;
    if (t1 >= 0 && t2 >= 0) {
      t = Math.min(t1, t2);
    } else if (t1 >= 0) {
      t = t1;
    } else if (t2 >= 0) {
      t = t2;
    }

    // Check if intersection is within ray length and is positive
    if (t >= 0 && t <= ray.maxDistance) {
      // Calculate hit point
      const hitX = ray.origin.x + ray.direction.x * t;
      const hitY = ray.origin.y + ray.direction.y * t;

      // Calculate normal (from circle center to hit point)
      const normalX = (hitX - circle.x) / circle.radius;
      const normalY = (hitY - circle.y) / circle.radius;

      return {
        hit: true,
        distance: t,
        point: { x: hitX, y: hitY },
        normal: { x: normalX, y: normalY },
        entity: null,
        shape: null
      };
    }

    // No valid intersection
    return {
      hit: false,
      distance: 0,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      entity: null,
      shape: null
    };
  }

  /**
   * Ray vs AABB (rectangle) intersection test
   * 
   * Algorithm: Slab method - test ray against each pair of parallel planes
   * Based on: https://tavianator.com/2011/ray_box.html
   * 
   * @param ray - Ray definition
   * @param rect - Rectangle shape
   * @returns Raycast result
   */
  static rayVsRectangle(ray: Ray, rect: RectangleShape): RaycastResult {
    // Handle edge cases where ray is parallel to an axis
    const invDirX = ray.direction.x === 0 ? Infinity : 1 / ray.direction.x;
    const invDirY = ray.direction.y === 0 ? Infinity : 1 / ray.direction.y;

    // Calculate intersection distances for X slabs
    const tx1 = (rect.x - ray.origin.x) * invDirX;
    const tx2 = (rect.x + rect.width - ray.origin.x) * invDirX;

    let tmin = Math.min(tx1, tx2);
    let tmax = Math.max(tx1, tx2);

    // Calculate intersection distances for Y slabs
    const ty1 = (rect.y - ray.origin.y) * invDirY;
    const ty2 = (rect.y + rect.height - ray.origin.y) * invDirY;

    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));

    // Check if there's a valid intersection
    if (tmax < 0 || tmin > tmax || tmin > ray.maxDistance) {
      return {
        hit: false,
        distance: 0,
        point: { x: 0, y: 0 },
        normal: { x: 0, y: 0 },
        entity: null,
        shape: null
      };
    }

    // Use tmin as the intersection point (entry point)
    const t = tmin >= 0 ? tmin : tmax;

    if (t < 0 || t > ray.maxDistance) {
      return {
        hit: false,
        distance: 0,
        point: { x: 0, y: 0 },
        normal: { x: 0, y: 0 },
        entity: null,
        shape: null
      };
    }

    // Calculate hit point
    const hitX = ray.origin.x + ray.direction.x * t;
    const hitY = ray.origin.y + ray.direction.y * t;

    // Calculate normal based on which face was hit
    let normalX = 0;
    let normalY = 0;

    // Determine which face was hit by checking hit point position
    const epsilon = 0.0001;

    if (Math.abs(hitX - rect.x) < epsilon) {
      // Left face
      normalX = -1;
      normalY = 0;
    } else if (Math.abs(hitX - (rect.x + rect.width)) < epsilon) {
      // Right face
      normalX = 1;
      normalY = 0;
    } else if (Math.abs(hitY - rect.y) < epsilon) {
      // Top face
      normalX = 0;
      normalY = -1;
    } else if (Math.abs(hitY - (rect.y + rect.height)) < epsilon) {
      // Bottom face
      normalX = 0;
      normalY = 1;
    }

    return {
      hit: true,
      distance: t,
      point: { x: hitX, y: hitY },
      normal: { x: normalX, y: normalY },
      entity: null,
      shape: null
    };
  }
}
