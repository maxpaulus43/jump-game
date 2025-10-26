import type { System, World } from '../types.js';
import { AnimatedSprite } from '../components/AnimatedSprite.js';

/**
 * AnimationSystem - updates all animated sprite timings each frame.
 * 
 * Queries for entities with AnimatedSprite components and calls their
 * update() method to advance animation frames based on delta time.
 * 
 * This system must run BEFORE RenderSystem to ensure the current frame
 * is updated before rendering.
 * 
 * @example
 * ```typescript
 * const animationSystem = new AnimationSystem();
 * systemScheduler.addSystem(animationSystem); // Before RenderSystem
 * ```
 */
export class AnimationSystem implements System {
  readonly name = 'AnimationSystem';

  /**
   * Update all animated sprites in the world.
   * 
   * @param dt - Delta time in seconds (from fixed timestep)
   * @param world - ECS world containing entities
   */
  update(dt: number, world: World): void {
    // Query for all entities with AnimatedSprite component
    const entities = world.query({
      with: [AnimatedSprite.type]
    });

    // Update each animated sprite's timing
    for (const entity of entities) {
      const animatedSprite = world.getComponent(entity, AnimatedSprite.type);
      if (animatedSprite) {
        animatedSprite.update(dt);
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
