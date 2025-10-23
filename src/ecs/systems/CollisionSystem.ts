import { System } from './System.js';
import type { World } from '../World.js';
import { Transform } from '../components/Transform.js';
import { Velocity } from '../components/Velocity.js';
import { CircleCollider } from '../components/CircleCollider.js';
import { RectCollider, type CollidableSides } from '../components/RectCollider.js';
import { PlayerController } from '../components/PlayerController.js';
import { CollisionDetector } from './physics/CollisionDetector.js';
import { CircleShape, RectangleShape, CollisionShapeType } from '../../types/collision.js';

/**
 * CollisionSystem detects and resolves entity collisions
 * 
 * Handles circle-circle and circle-rect collisions
 * Applies collision response (position correction, velocity changes)
 */
export class CollisionSystem extends System {
  readonly name = 'CollisionSystem';

  update(_dt: number, world: World): void {
    // Get all entities with collision shapes
    const circles = world.query({
      with: [Transform.type, Velocity.type, CircleCollider.type]
    });

    const rects = world.query({
      with: [Transform.type, RectCollider.type]
    });

    // Check circle-rect collisions (player vs platforms)
    for (const circleEntity of circles) {
      const circleTransform = world.getComponent(circleEntity, Transform.type)!;
      const circleVelocity = world.getComponent(circleEntity, Velocity.type)!;
      const circleCollider = world.getComponent(circleEntity, CircleCollider.type)!;

      // Create collision shape for circle
      const circleShape: CircleShape = {
        type: CollisionShapeType.Circle,
        x: circleTransform.x,
        y: circleTransform.y,
        radius: circleCollider.radius
      };

      for (const rectEntity of rects) {
        const rectTransform = world.getComponent(rectEntity, Transform.type)!;
        const rectCollider = world.getComponent(rectEntity, RectCollider.type)!;

        // Create collision shape for rectangle
        const rectShape: RectangleShape = {
          type: CollisionShapeType.Rectangle,
          x: rectTransform.x,
          y: rectTransform.y,
          width: rectCollider.width,
          height: rectCollider.height
        };

        // Detect collision
        const result = CollisionDetector.circleVsRectangle(circleShape, rectShape);

        if (result.colliding) {
          // Determine which side of the rectangle was hit based on collision normal
          let hitSide: keyof CollidableSides;
          if (result.normal.y < -0.7) {
            hitSide = 'top';  // Normal points up, circle hit top of rect
          } else if (result.normal.y > 0.7) {
            hitSide = 'bottom';  // Normal points down, circle hit bottom of rect
          } else if (result.normal.x < 0) {
            hitSide = 'left';  // Normal points left, circle hit left side of rect
          } else {
            hitSide = 'right';  // Normal points right, circle hit right side of rect
          }

          // Check if this side is collidable - skip collision if not
          if (!rectCollider.isCollidable(hitSide)) {
            continue;
          }

          // Apply bounce/friction based on collision normal
          const normalDotVelocity =
            circleVelocity.x * result.normal.x +
            circleVelocity.y * result.normal.y;

          // Only apply response if moving into the surface
          if (normalDotVelocity < 0) {
            // Resolve collision by pushing circle out of rectangle
            circleTransform.x += result.normal.x * result.depth;
            circleTransform.y += result.normal.y * result.depth;

            // Remove velocity component along normal (stop penetration)
            circleVelocity.x -= result.normal.x * normalDotVelocity;
            circleVelocity.y -= result.normal.y * normalDotVelocity;

            // Apply friction for vertical collisions (platforms)
            if (Math.abs(result.normal.y) > 0.7) {
              // This is a horizontal platform (top or bottom)
              circleVelocity.x *= 0.9; // Friction
            }

            // Check if this is a player landing on a platform
            const playerController = world.getComponent(circleEntity, PlayerController.type);
            if (playerController && result.normal.y < -0.7) {
              // Landing on top of platform (normal points up)
              // Only set grounded if velocity is moving against the platform (downward)
              // This prevents being grounded while jumping upward through platforms
              if (circleVelocity.y >= -50) { // Small threshold for "nearly stationary"
                playerController.isGrounded = true;
              }
            }
          }
        }
      }
    }

    // Circle-circle collisions (player vs player, if multiple players exist)
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const entityA = circles[i];
        const entityB = circles[j];

        const transformA = world.getComponent(entityA, Transform.type)!;
        const velocityA = world.getComponent(entityA, Velocity.type)!;
        const colliderA = world.getComponent(entityA, CircleCollider.type)!;

        const transformB = world.getComponent(entityB, Transform.type)!;
        const velocityB = world.getComponent(entityB, Velocity.type)!;
        const colliderB = world.getComponent(entityB, CircleCollider.type)!;

        // Create collision shapes
        const shapeA: CircleShape = {
          type: CollisionShapeType.Circle,
          x: transformA.x,
          y: transformA.y,
          radius: colliderA.radius
        };

        const shapeB: CircleShape = {
          type: CollisionShapeType.Circle,
          x: transformB.x,
          y: transformB.y,
          radius: colliderB.radius
        };

        // Detect collision
        const result = CollisionDetector.circleVsCircle(shapeA, shapeB);

        if (result.colliding) {
          // Push circles apart (50/50 split)
          const halfDepth = result.depth / 2;
          transformA.x -= result.normal.x * halfDepth;
          transformA.y -= result.normal.y * halfDepth;
          transformB.x += result.normal.x * halfDepth;
          transformB.y += result.normal.y * halfDepth;

          // Simple elastic collision response
          const relativeVelocity = {
            x: velocityA.x - velocityB.x,
            y: velocityA.y - velocityB.y
          };

          const velocityDotNormal =
            relativeVelocity.x * result.normal.x +
            relativeVelocity.y * result.normal.y;

          if (velocityDotNormal < 0) {
            // Apply impulse (equal mass assumption)
            const impulse = velocityDotNormal * 1.5; // Some bounce
            velocityA.x -= result.normal.x * impulse;
            velocityA.y -= result.normal.y * impulse;
            velocityB.x += result.normal.x * impulse;
            velocityB.y += result.normal.y * impulse;
          }
        }
      }
    }
  }
}
