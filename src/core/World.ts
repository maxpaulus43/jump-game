/**
 * World.ts
 * 
 * World class manages all entities in the game
 * Provides centralized entity management and coordination
 */

import { Renderer } from './Renderer.js';
import { Entity } from '../types/world.js';
import { Collidable } from '../types/collision.js';
import { Platform } from '../entities/Platform.js';

/**
 * World class manages all game entities
 * Separates entity management from game logic
 */
export class World {
  private entities: Entity[] = [];
  private platforms: Platform[] = [];

  /**
   * Add an entity to the world
   * 
   * @param entity - Entity to add
   */
  addEntity(entity: Entity): void {
    this.entities.push(entity);
    
    // Track platforms separately for quick access
    if (entity instanceof Platform) {
      this.platforms.push(entity);
    }
  }

  /**
   * Remove an entity from the world
   * 
   * @param entity - Entity to remove
   * @returns True if entity was removed, false if not found
   */
  removeEntity(entity: Entity): boolean {
    const index = this.entities.indexOf(entity);
    if (index === -1) {
      return false;
    }

    this.entities.splice(index, 1);

    // Remove from platforms array if it's a platform
    if (entity instanceof Platform) {
      const platformIndex = this.platforms.indexOf(entity);
      if (platformIndex !== -1) {
        this.platforms.splice(platformIndex, 1);
      }
    }

    return true;
  }

  /**
   * Get all entities in the world
   * 
   * @returns Array of all entities
   */
  getEntities(): readonly Entity[] {
    return this.entities;
  }

  /**
   * Get all platforms (for quick platform-specific access)
   * 
   * @returns Array of platforms
   */
  getPlatforms(): readonly Platform[] {
    return this.platforms;
  }

  /**
   * Get all collidable entities
   * 
   * @returns Array of collidable entities
   */
  getCollidables(): Collidable[] {
    // Filter entities that implement Collidable interface
    // Cast is safe because we check for all required Collidable methods
    return this.entities.filter((entity): entity is Entity & Collidable => {
      return 'getCollisionShape' in entity && 
             'getCollisionMaterial' in entity &&
             'onCollision' in entity;
    }) as Collidable[];
  }

  /**
   * Get all physical entities (entities that participate in physics)
   * Currently returns empty array - will be used when entities implement PhysicalEntity
   * 
   * @returns Array of physical entities
   */
  getPhysicalEntities(): Entity[] {
    // For now, return empty array
    // In future phases, this will filter for entities with getVelocity() and applyForce()
    return [];
  }

  /**
   * Update all entities
   * 
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    for (const entity of this.entities) {
      entity.update(dt);
    }
  }

  /**
   * Render all entities
   * 
   * @param renderer - Renderer instance
   */
  render(renderer: Renderer): void {
    for (const entity of this.entities) {
      entity.render(renderer);
    }
  }

  /**
   * Clear all entities from the world
   */
  clear(): void {
    this.entities = [];
    this.platforms = [];
  }

  /**
   * Get number of entities in the world
   * 
   * @returns Entity count
   */
  getEntityCount(): number {
    return this.entities.length;
  }
}
