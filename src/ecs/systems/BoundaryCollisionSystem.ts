import { System } from './System.js';
import type { World } from '../World.js';
import { Transform } from '../components/Transform.js';
import { Velocity } from '../components/Velocity.js';
import { CircleCollider } from '../components/CircleCollider.js';
import type { Renderer } from '../../types/renderer.js';

/**
 * BoundaryCollisionSystem handles screen edge collisions
 * 
 * Prevents entities from leaving the screen horizontally
 * Clamps position to screen bounds and stops horizontal velocity
 */
export class BoundaryCollisionSystem extends System {
  readonly name = 'BoundaryCollisionSystem';

  private renderer: Renderer;

  constructor(renderer: Renderer) {
    super();
    this.renderer = renderer;
  }

  update(_dt: number, world: World): void {
    const entities = world.query({
      with: [Transform.type, Velocity.type, CircleCollider.type]
    });

    const screenWidth = this.renderer.getWidth();

    for (const entity of entities) {
      const transform = world.getComponent(entity, Transform.type)!;
      const velocity = world.getComponent(entity, Velocity.type)!;
      const collider = world.getComponent(entity, CircleCollider.type)!;

      // Check left boundary
      if (transform.x - collider.radius < 0) {
        transform.x = collider.radius;
        velocity.x = 0;
      }

      // Check right boundary
      if (transform.x + collider.radius > screenWidth) {
        transform.x = screenWidth - collider.radius;
        velocity.x = 0;
      }
    }
  }
}
