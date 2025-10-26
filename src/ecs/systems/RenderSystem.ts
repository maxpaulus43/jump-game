import { System, World } from '../types.js';
import {
  Transform,
  Renderable,
  CircleCollider,
  RectCollider,
  Sprite
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

  update(_dt: number, world: World): void {
    // Query for sprite entities
    const spriteEntities = world.query({
      with: [Transform.type, Sprite.type]
    });

    // Query for shape entities with circle colliders
    const circleEntities = world.query({
      with: [Transform.type, Renderable.type, CircleCollider.type]
    });

    // Query for shape entities with rect colliders
    const rectEntities = world.query({
      with: [Transform.type, Renderable.type, RectCollider.type]
    });

    // Combine all entities
    const allEntities = [...spriteEntities, ...circleEntities, ...rectEntities];
    
    // Remove duplicates (entity might have both sprite and shape components)
    const uniqueEntities = Array.from(new Set(allEntities));

    // Sort by layer (use Sprite.layer if available, otherwise Renderable.layer)
    const sortedEntities = uniqueEntities.sort((a, b) => {
      const spriteA = world.getComponent(a, Sprite.type);
      const spriteB = world.getComponent(b, Sprite.type);
      const renderA = world.getComponent(a, Renderable.type);
      const renderB = world.getComponent(b, Renderable.type);

      const layerA = spriteA?.layer ?? renderA?.layer ?? 0;
      const layerB = spriteB?.layer ?? renderB?.layer ?? 0;

      return layerA - layerB; // Lower layers first
    });

    // Render each entity
    for (const entity of sortedEntities) {
      const transform = world.getComponent(entity, Transform.type)!;
      
      // Try to render as sprite first
      const sprite = world.getComponent(entity, Sprite.type);
      if (sprite) {
        // Determine dimensions for sprite rendering
        const circleCollider = world.getComponent(entity, CircleCollider.type);
        const rectCollider = world.getComponent(entity, RectCollider.type);
        
        let width = sprite.width;
        let height = sprite.height;
        
        // Use collider dimensions as fallback if sprite doesn't specify
        if (!width && !height) {
          if (circleCollider) {
            width = height = circleCollider.radius * 2;
          } else if (rectCollider) {
            width = rectCollider.width;
            height = rectCollider.height;
          }
        }
        
        // Draw sprite (will fail silently if sprite not found, allowing fallback)
        this.renderer.drawSprite(sprite, transform.x, transform.y, width!, height!);
        
        // Skip shape rendering if sprite was drawn successfully
        // (drawSprite fails silently, so we always skip shapes if Sprite component exists)
        continue;
      }

      // Fallback to shape rendering
      const renderable = world.getComponent(entity, Renderable.type);
      if (!renderable) continue;

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
