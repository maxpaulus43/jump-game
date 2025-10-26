import type { System, World } from '../types.js';
import { AnimatedSprite } from '../components/AnimatedSprite.js';
import { PlayerController } from '../components/PlayerController.js';
import { Velocity } from '../components/Velocity.js';

/**
 * PlayerAnimationSystem - manages state-based animation switching for the player.
 * 
 * Automatically switches player animations based on game state:
 * - Not grounded (in air) → jump animation
 * - Grounded and moving → idle animation (can add walk later)
 * - Grounded and still → idle animation
 * 
 * This system must run AFTER physics systems and BEFORE AnimationSystem.
 * 
 * @example
 * ```typescript
 * const playerAnimSystem = new PlayerAnimationSystem();
 * systemScheduler.addSystem(playerAnimSystem); // After physics, before AnimationSystem
 * ```
 */
export class PlayerAnimationSystem implements System {
  readonly name = 'PlayerAnimationSystem';

  /**
   * Update player animation based on current state.
   * 
   * @param _dt - Delta time (unused)
   * @param world - ECS world containing entities
   */
  update(_dt: number, world: World): void {
    // Query for player entities with animation capability
    const entities = world.query({
      with: [AnimatedSprite.type, PlayerController.type, Velocity.type]
    });

    for (const entity of entities) {
      const animatedSprite = world.getComponent(entity, AnimatedSprite.type);
      const controller = world.getComponent(entity, PlayerController.type);
      const velocity = world.getComponent(entity, Velocity.type);

      if (!animatedSprite || !controller || !velocity) {
        continue;
      }

      // Determine which animation should be playing
      const currentAnim = animatedSprite.getCurrentAnimationName();

      if (!controller.isGrounded) {
        // Player is in the air - play jump animation
        if (currentAnim !== 'jump') {
          animatedSprite.play('jump', true);
        }
      } else {
        // Player is grounded
        // For now, always play idle when grounded
        // Future: Check velocity.x to play walk animation when moving
        const isMoving = Math.abs(velocity.x) > 10;
        
        if (isMoving) {
          // Could add walk animation here in the future
          // For now, keep playing idle
          if (currentAnim !== 'idle') {
            animatedSprite.play('idle');
          }
        } else {
          // Standing still - play idle
          if (currentAnim !== 'idle') {
            animatedSprite.play('idle');
          }
        }
      }
    }
  }

  /**
   * Cleanup when system is destroyed.
   * No cleanup needed for this system.
   */
  onDestroy(): void {
    // No cleanup needed
  }
}
