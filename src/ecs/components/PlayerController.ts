import type { ComponentType } from '../types.js';

/**
 * PlayerController component - player-specific behavior data
 * 
 * Contains all physics parameters specific to player movement.
 * Used by PlayerInputSystem and PhysicsSystem for player control.
 * 
 * @example
 * // Standard player controller with default values
 * const controller = new PlayerController(3000, 1500, 1200, 800, false);
 */
export class PlayerController {
  static readonly type: ComponentType<PlayerController> = 'PlayerController' as ComponentType<PlayerController>;
  
  constructor(
    public gravity: number = 3000,
    public jumpVelocity: number = 1500,
    public acceleration: number = 1200,
    public maxSpeed: number = 800,
    public isGrounded: boolean = false
  ) {}
}
