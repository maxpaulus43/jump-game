import type { ComponentType } from '../types.js';

/**
 * Platform type enumeration
 * 
 * Defines different types of platforms for future extensibility.
 * Standard platforms are static, other types can have special behaviors.
 */
export enum PlatformType {
  Standard = 'standard',
  Moving = 'moving',      // For future use
  Weak = 'weak',          // For future use
  Powerup = 'powerup'     // For future use
}

/**
 * Platform component - tag component for platforms
 * 
 * Marks an entity as a platform and stores its type.
 * Used by systems to identify platform entities for collision, spawning, etc.
 * 
 * @example
 * // Standard static platform
 * const platform = new Platform(PlatformType.Standard);
 * 
 * // Moving platform (future)
 * const movingPlatform = new Platform(PlatformType.Moving);
 */
export class Platform {
  static readonly type: ComponentType<Platform> = 'Platform' as ComponentType<Platform>;
  
  constructor(
    public platformType: PlatformType = PlatformType.Standard
  ) {}
}
