import { System } from '../System.js';
import type { ECSWorld } from '../ECSWorld.js';
import { Velocity } from '../components/Velocity.js';
import { PlayerController } from '../components/PlayerController.js';

/**
 * PlayerPhysicsSystem applies player-specific physics (gravity, jumping)
 * 
 * Applies gravity to player velocity when not grounded
 * This runs after input but before general physics integration
 */
export class PlayerPhysicsSystem extends System {
  readonly name = 'PlayerPhysicsSystem';

  update(dt: number, world: ECSWorld): void {
    const entities = world.query({
      with: [Velocity.type, PlayerController.type]
    });

    for (const entity of entities) {
      const velocity = world.getComponent(entity, Velocity.type)!;
      const controller = world.getComponent(entity, PlayerController.type)!;

      // Apply gravity when not grounded
      // Note: We still apply some gravity when grounded to maintain contact with platforms
      if (!controller.isGrounded) {
        velocity.y += controller.gravity * dt;
      } else {
        // Apply reduced gravity when grounded to maintain platform contact
        velocity.y = -controller.jumpVelocity;
      }
    }
  }
}
