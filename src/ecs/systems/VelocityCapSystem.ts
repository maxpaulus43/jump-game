import { System } from '../System.js';
import type { ECSWorld } from '../ECSWorld.js';
import { Velocity } from '../components/Velocity.js';
import { PlayerController } from '../components/PlayerController.js';

/**
 * VelocityCapSystem enforces maximum velocity limits
 * 
 * Caps horizontal velocity to PlayerController.maxSpeed
 * Preserves vertical velocity to allow proper jumping and falling
 */
export class VelocityCapSystem extends System {
    readonly name = 'VelocityCapSystem';

    update(_dt: number, world: ECSWorld): void {
        const entities = world.query({
            with: [Velocity.type, PlayerController.type]
        });

        for (const entity of entities) {
            const velocity = world.getComponent(entity, Velocity.type)!;
            const controller = world.getComponent(entity, PlayerController.type)!;

            // Cap horizontal velocity only (preserve vertical for jumps/gravity)
            const horizontalSpeed = Math.abs(velocity.x);
            if (horizontalSpeed > controller.maxSpeed) {
                // Normalize and scale to maxSpeed, preserving direction
                velocity.x = (velocity.x / horizontalSpeed) * controller.maxSpeed;
            }
        }
    }
}
