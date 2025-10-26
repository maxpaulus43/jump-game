import { System } from './System.js';
import type { World } from '../World.js';
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

  update(dt: number, world: World): void {
    const entities = world.query({
      with: [Velocity.type, PlayerController.type]
    });

    for (const entity of entities) {
      const velocity = world.getComponent(entity, Velocity.type)!;
      const player = world.getComponent(entity, PlayerController.type)!;

      // Apply gravity when not grounded
      if (!player.isGrounded) {
        velocity.y += player.gravity * dt;
      } else {
        // jump when grounded. player is always jumping.
        // velocity.y = -player.jumpVelocity;
      }
    }
  }
}
