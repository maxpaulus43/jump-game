import type { ComponentType } from '../types.js';

/**
 * Velocity component - stores movement vector
 * 
 * Represents the rate of change of position in pixels per second.
 * Used by PhysicsSystem to update Transform component.
 * 
 * @example
 * // Moving right at 100 pixels/second, down at 50 pixels/second
 * const velocity = new Velocity(100, 50);
 */
export class Velocity {
  static readonly type: ComponentType<Velocity> = 'Velocity' as ComponentType<Velocity>;
  
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
}
