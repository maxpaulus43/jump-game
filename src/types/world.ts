/**
 * world.ts
 * 
 * Type definitions for world/entity management system
 */

import { Renderer } from '../core/Renderer.js';
import { Vec2 } from '../utils/Vec2.js';

/**
 * Entity interface for world management
 */
export interface Entity {
  /**
   * Update entity state
   */
  update(dt: number): void;
  
  /**
   * Render entity
   */
  render(renderer: Renderer): void;
  
  /**
   * Get entity position
   */
  getPosition(): Vec2;
}

/**
 * Physical entity that participates in physics simulation
 */
export interface PhysicalEntity extends Entity {
  /**
   * Get velocity for physics calculations
   */
  getVelocity(): Vec2;
  
  /**
   * Apply force to entity
   */
  applyForce(force: Vec2): void;
}

/**
 * World bounds definition
 */
export interface WorldBounds {
  width: number;
  height: number;
}
