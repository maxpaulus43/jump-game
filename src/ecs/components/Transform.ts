import type { ComponentType } from '../types.js';

/**
 * Transform component - stores position and rotation
 * 
 * This is the most fundamental component - almost every visible entity needs one.
 * Position is in world space coordinates (pixels).
 * Rotation is in radians (0 = right, π/2 = down in canvas coordinates).
 */
export class Transform {
  static readonly type: ComponentType<Transform> = 'Transform' as ComponentType<Transform>;
  
  constructor(
    public x: number = 0,
    public y: number = 0,
    public rotation: number = 0  // radians
  ) {}
}
