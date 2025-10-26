import type { World, Entity } from '../types.js';
import {
  Transform,
  Velocity,
  CircleCollider,
  Renderable,
  PlayerController,
  CameraTarget,
  Sprite
} from '../components/index.js';

/**
 * Create a player entity with all required components
 * 
 * Sets up a complete player entity with:
 * - Transform: position at (x, y)
 * - Velocity: initial jump velocity (0, -1500)
 * - CircleCollider: 20px radius, full bounce, low friction
 * - Renderable: yellow color (#ffbf00ff), high layer (10)
 * - PlayerController: standard player physics parameters
 * - CameraTarget: marks as camera follow target
 * 
 * @param world - ECS world to create entity in
 * @param x - Initial X position
 * @param y - Initial Y position
 * @returns The created player entity ID
 * 
 * @example
 * const player = createPlayer(world, 400, 300);
 */
export function createPlayer(world: World, x: number, y: number): Entity {
  const entity = world.createEntity();

  // Add all player components with defaults from Player.ts
  world.addComponent(entity, new Transform(x, y, 0));
  world.addComponent(entity, new Velocity(0, -1500)); // Initial jump velocity
  world.addComponent(entity, new CircleCollider(20, 1.0, 0.1));
  world.addComponent(entity, new Renderable('#ffbf00ff', 10)); // Yellow, high layer (fallback)
  world.addComponent(entity, new Sprite('placeholder', 'player', 40, 40, 10)); // Sprite rendering
  world.addComponent(entity, new PlayerController(3000, 1500, 1200, 800, false));
  world.addComponent(entity, new CameraTarget());

  return entity;
}
