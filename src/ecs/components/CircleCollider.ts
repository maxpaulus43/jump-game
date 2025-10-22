import type { ComponentType } from '../types.js';

/**
 * CircleCollider component - defines circular collision shape
 * 
 * Used for circular entities like the player.
 * Contains collision material properties (restitution = bounciness, friction).
 * 
 * @example
 * // Player collider: 20px radius, full bounce, low friction
 * const collider = new CircleCollider(20, 1.0, 0.1);
 */
export class CircleCollider {
  static readonly type: ComponentType<CircleCollider> = 'CircleCollider' as ComponentType<CircleCollider>;
  
  constructor(
    public radius: number = 20,
    public restitution: number = 1.0,  // bounce coefficient (0-1)
    public friction: number = 0.1
  ) {}
}
