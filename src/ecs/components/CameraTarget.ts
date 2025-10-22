import type { ComponentType } from '../types.js';

/**
 * CameraTarget component - marks entity as camera target
 * 
 * This is a tag component (no data) that marks an entity as the camera's follow target.
 * Camera system will query for entities with this component to determine what to follow.
 * 
 * @example
 * // Mark player as camera target
 * world.addComponent(playerEntity, new CameraTarget());
 */
export class CameraTarget {
  static readonly type: ComponentType<CameraTarget> = 'CameraTarget' as ComponentType<CameraTarget>;
  
  // Empty tag component - just marks entity as camera target
  constructor() {}
}
