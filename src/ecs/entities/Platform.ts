import type { World, Entity } from '../types.js';
import {
  Transform,
  RectCollider,
  Renderable,
  Platform,
  PlatformType
} from '../components/index.js';

/**
 * Color mapping for platform types
 */
const PLATFORM_COLORS: Record<PlatformType, string> = {
  [PlatformType.Standard]: '#4a90e2',  // Blue
  [PlatformType.Moving]: '#f39c12',    // Orange
  [PlatformType.Weak]: '#e74c3c',      // Red
  [PlatformType.Powerup]: '#9b59b6'    // Purple
};

/**
 * Create a platform entity with all required components
 * 
 * Sets up a complete platform entity with:
 * - Transform: position at (x, y)
 * - RectCollider: width x height dimensions, moderate bounce, medium friction
 * - Renderable: color based on platform type, low layer (0)
 * - Platform: platform type tag
 * 
 * @param world - ECS world to create entity in
 * @param x - Top-left X position
 * @param y - Top-left Y position
 * @param width - Platform width in pixels
 * @param height - Platform height in pixels
 * @param type - Platform type (Standard, Moving, Weak, Powerup)
 * @returns The created platform entity ID
 * 
 * @example
 * // Create a standard 150x20 platform at (100, 500)
 * const platform = createPlatform(world, 100, 500, 150, 20);
 * 
 * // Create a moving platform
 * const movingPlatform = createPlatform(world, 200, 400, 100, 20, PlatformType.Moving);
 */
export function createPlatform(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number,
  type: PlatformType = PlatformType.Standard
): Entity {
  const entity = world.createEntity();

  // Add all platform components
  world.addComponent(entity, new Transform(x, y, 0));
  world.addComponent(entity, new RectCollider(width, height, 0.3, 0.5, { bottom: false, left: false, right: false }));
  world.addComponent(entity, new Renderable(PLATFORM_COLORS[type], 0));
  world.addComponent(entity, new Platform(type));

  return entity;
}
