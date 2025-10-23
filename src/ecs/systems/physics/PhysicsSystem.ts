import { System, World } from '../../types.js';
import { Transform, Velocity } from '../../components/index.js';

/**
 * PhysicsSystem - applies basic physics to entities
 * 
 * Updates entity positions based on their velocities using the formula:
 * position += velocity * dt
 * 
 * This is a simple integration system that forms the foundation for movement.
 * More complex physics (gravity, collision, etc.) will be added in Phase 3.
 * 
 * @example
 * const physicsSystem = new PhysicsSystem();
 * systemScheduler.registerSystem(physicsSystem);
 */
export class PhysicsSystem implements System {
  readonly name = 'PhysicsSystem';

  update(dt: number, world: World): void {
    // Query for all entities with transform and velocity
    const entities = world.query({
      with: [Transform.type, Velocity.type]
    });

    // Update positions based on velocity
    for (const entity of entities) {
      const transform = world.getComponent(entity, Transform.type)!;
      const velocity = world.getComponent(entity, Velocity.type)!;

      // Apply velocity to position (simple Euler integration)
      transform.x += velocity.x * dt;
      transform.y += velocity.y * dt;
    }
  }

  onDestroy(): void {
    // No cleanup needed
  }
}
