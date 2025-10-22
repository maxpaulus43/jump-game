import { System, ECSWorld } from '../types.js';
import {
  Transform,
  Renderable,
  CircleCollider,
  RectCollider
} from '../components/index.js';
import type { Renderer } from '../../types/renderer.js';

/**
 * RenderSystem - renders all entities with visual components
 * 
 * Queries for entities with Transform + Renderable + (CircleCollider OR RectCollider)
 * and draws them using the provided renderer.
 * 
 * Entities are sorted by layer before rendering to ensure correct draw order.
 * Lower layers are drawn first (background), higher layers drawn last (foreground).
 * 
 * @example
 * const renderSystem = new RenderSystem(renderer);
 * systemScheduler.registerSystem(renderSystem);
 */
export class RenderSystem implements System {
  readonly name = 'RenderSystem';

  constructor(private renderer: Renderer) { }

  update(_dt: number, world: ECSWorld): void {
    // Query for all renderable entities with circle colliders
    const circleEntities = world.query({
      with: [Transform.type, Renderable.type, CircleCollider.type]
    });

    // Query for all renderable entities with rect colliders
    const rectEntities = world.query({
      with: [Transform.type, Renderable.type, RectCollider.type]
    });

    // Combine all entities and sort by layer
    const allEntities = [...circleEntities, ...rectEntities];
    const sortedEntities = allEntities.sort((a, b) => {
      const renderA = world.getComponent(a, Renderable.type)!;
      const renderB = world.getComponent(b, Renderable.type)!;
      return renderA.layer - renderB.layer; // Lower layers first
    });

    // Render each entity based on its collider type
    for (const entity of sortedEntities) {
      const transform = world.getComponent(entity, Transform.type)!;
      const renderable = world.getComponent(entity, Renderable.type)!;

      // Check which collider type this entity has
      const circleCollider = world.getComponent(entity, CircleCollider.type);
      const rectCollider = world.getComponent(entity, RectCollider.type);

      if (circleCollider) {
        // Draw circle
        this.renderer.drawCircle(
          transform.x,
          transform.y,
          circleCollider.radius,
          renderable.color
        );
      } else if (rectCollider) {
        // Draw rectangle
        this.renderer.drawRect(
          transform.x,
          transform.y,
          rectCollider.width,
          rectCollider.height,
          renderable.color
        );
      }
    }
  }

  onDestroy(): void {
    // No cleanup needed
  }
}
