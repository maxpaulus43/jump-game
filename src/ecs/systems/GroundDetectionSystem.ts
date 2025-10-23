import { System } from './System.js';
import type { World } from '../World.js';
import { Transform } from '../components/Transform.js';
import { Velocity } from '../components/Velocity.js';
import { CircleCollider } from '../components/CircleCollider.js';
import { RectCollider } from '../components/RectCollider.js';
import { PlayerController } from '../components/PlayerController.js';
import { Platform } from '../components/Platform.js';
import { CollisionDetector } from './physics/CollisionDetector.js';
import { Ray, RectangleShape, CollisionShapeType } from '../../types/collision.js';

/**
 * GroundDetectionSystem performs raycast-based ground detection for jumping
 * 
 * Casts a ray downward from player center to detect platforms
 * Sets PlayerController.isGrounded when player is on a platform
 */
export class GroundDetectionSystem extends System {
    readonly name = 'GroundDetectionSystem';

    update(_dt: number, world: World): void {
        // Get all players
        const players = world.query({
            with: [Transform.type, PlayerController.type, CircleCollider.type]
        });

        // Get all platforms
        const platforms = world.query({
            with: [Transform.type, RectCollider.type, Platform.type]
        });

        for (const player of players) {
            const transform = world.getComponent(player, Transform.type)!;
            const controller = world.getComponent(player, PlayerController.type)!;
            const collider = world.getComponent(player, CircleCollider.type)!;
            const velocity = world.getComponent(player, Velocity.type)!;

            // Create ray pointing downward from player center
            const rayDistance = collider.radius + 5; // Small threshold for detecting ground
            const ray: Ray = {
                origin: { x: transform.x, y: transform.y },
                direction: { x: 0, y: 1 }, // Downward in canvas coordinates
                maxDistance: rayDistance
            };

            // Check ray against all platforms
            let isGrounded = false;

            for (const platform of platforms) {
                const platformTransform = world.getComponent(platform, Transform.type)!;
                const platformCollider = world.getComponent(platform, RectCollider.type)!;

                // Create platform collision shape
                const platformShape: RectangleShape = {
                    type: CollisionShapeType.Rectangle,
                    x: platformTransform.x,
                    y: platformTransform.y,
                    width: platformCollider.width,
                    height: platformCollider.height
                };

                // Perform raycast
                const result = CollisionDetector.rayVsRectangle(ray, platformShape);

                if (result.hit) {
                    // Check if the platform is below the player (normal points up)
                    // Normal.y should be negative (pointing up in canvas coordinates)
                    if (result.normal.y < -0.7) {
                        // Only consider grounded if moving downward or nearly stationary
                        // This prevents being grounded while jumping upward through platforms
                        if (velocity.y >= -50) { // Small threshold for "nearly stationary"
                            isGrounded = true;
                            break;
                        }
                    }
                }
            }

            // Update grounded state
            controller.isGrounded = isGrounded;
        }
    }
}
