import type { ComponentType } from '../types.js';

/**
 * RectCollider component - defines rectangular collision shape
 * 
 * Used for rectangular entities like platforms.
 * Contains collision material properties (restitution = bounciness, friction).
 * 
 * @example
 * // Platform collider: 150x20px, moderate bounce, medium friction
 * const collider = new RectCollider(150, 20, 0.3, 0.5);
 */
export class RectCollider {
  static readonly type: ComponentType<RectCollider> = 'RectCollider' as ComponentType<RectCollider>;
  
  constructor(
    public width: number = 100,
    public height: number = 20,
    public restitution: number = 0.3,
    public friction: number = 0.5
  ) {}
}
