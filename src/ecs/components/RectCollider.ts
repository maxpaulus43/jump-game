import type { ComponentType } from '../types.js';

/**
 * Configuration for which sides of a RectCollider can collide
 */
export interface CollidableSides {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

/**
 * RectCollider component - defines rectangular collision shape
 * 
 * Used for rectangular entities like platforms.
 * Contains collision material properties (restitution = bounciness, friction).
 * Optionally configure which sides are collidable for one-way platforms and specialized collisions.
 * 
 * @example
 * // Platform collider: 150x20px, moderate bounce, medium friction, all sides collidable
 * const collider = new RectCollider(150, 20, 0.3, 0.5);
 * 
 * @example
 * // One-way platform: only top side is collidable
 * const oneWayPlatform = new RectCollider(150, 20, 0.3, 0.5, { top: true, bottom: false, left: false, right: false });
 * 
 * @example
 * // Wall: only left and right sides are collidable
 * const wall = new RectCollider(20, 150, 0.3, 0.5, { top: false, bottom: false, left: true, right: true });
 */
export class RectCollider {
  static readonly type: ComponentType<RectCollider> = 'RectCollider' as ComponentType<RectCollider>;
  
  public collidableSides: CollidableSides;
  
  constructor(
    public width: number = 100,
    public height: number = 20,
    public restitution: number = 0.3,
    public friction: number = 0.5,
    collidableSides?: Partial<CollidableSides>
  ) {
    // Default: all sides are collidable
    this.collidableSides = {
      top: collidableSides?.top ?? true,
      bottom: collidableSides?.bottom ?? true,
      left: collidableSides?.left ?? true,
      right: collidableSides?.right ?? true,
    };
  }
  
  /**
   * Check if a specific side is collidable
   */
  isCollidable(side: keyof CollidableSides): boolean {
    return this.collidableSides[side];
  }
  
  /**
   * Set whether a specific side is collidable
   */
  setCollidable(side: keyof CollidableSides, value: boolean): void {
    this.collidableSides[side] = value;
  }
  
  /**
   * Check if all sides are collidable
   */
  isFullyCollidable(): boolean {
    return this.collidableSides.top && 
           this.collidableSides.bottom && 
           this.collidableSides.left && 
           this.collidableSides.right;
  }
}
