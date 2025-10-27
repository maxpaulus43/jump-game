import type { World, Entity } from '../types.js';
import {
  Transform,
  Velocity,
  CircleCollider,
  Renderable,
  PlayerController,
  CameraTarget,
  AnimatedSprite,
  Sprite,
  RectCollider
} from '../components/index.js';
import { createAnimation, createFrameSequence } from '../../utils/AnimationBuilder.js';
import { AnimationPlaybackMode } from '../../types/sprite.js';

/**
 * Create a player entity with all required components
 * 
 * Sets up a complete player entity with:
 * - Transform: position at (x, y)
 * - Velocity: initial jump velocity (0, -1500)
 * - CircleCollider: 20px radius, full bounce, low friction
 * - Renderable: yellow color (#ffbf00ff), high layer (10)
 * - AnimatedSprite: idle and jump animations
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

  // // Define player animations
  // // Note: Frames will be loaded from 'player_animations' sprite sheet (64x64 per frame)
  // // Frame names: idle_0, idle_1, idle_2 for idle; jump_0, jump_1 for jump
  // const idleFrames = createFrameSequence(
  //   'player_animations',
  //   ['idle_0', 'idle_1', 'idle_2', 'idle_3'],
  //   0.15 // 150ms per frame (~6.67 fps)
  // );

  // const jumpFrames = createFrameSequence(
  //   'player_animations',
  //   ['jump_0', 'jump_1'],
  //   0.1 // 100ms per frame (10 fps)
  // );

  // const animConfig = {
  //   defaultAnimation: 'idle',
  //   animations: {
  //     'idle': createAnimation('idle', idleFrames, AnimationPlaybackMode.Loop),
  //     'jump': createAnimation('jump', jumpFrames, AnimationPlaybackMode.Once)
  //   }
  // };

  // Add all player components
  world.addComponent(entity, new Transform(x, y, 0));
  world.addComponent(entity, new Velocity(0, -1500)); // Initial jump velocity
  world.addComponent(entity, new CircleCollider(20, 1.0, 0.1));
  world.addComponent(entity, new Renderable('#ffbf00ff', 10)); // Yellow, high layer (fallback)
  world.addComponent(entity, new Sprite('main', 'player', 128, 128));
  world.addComponent(entity, new PlayerController(3000, 1500, 1200, 800, false));
  world.addComponent(entity, new CameraTarget());

  return entity;
}
