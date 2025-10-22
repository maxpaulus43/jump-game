/**
 * EntityManager
 * 
 * Manages entity lifecycle - creation, destruction, and validation.
 * Uses simple incrementing IDs for entities (no generational indices).
 * 
 * Design:
 * - Entity IDs are just numbers starting from 0
 * - IDs increment monotonically (never reused in this implementation)
 * - activeEntities Set tracks which entities are currently alive
 * - Destroyed entities are removed from the Set but IDs are not recycled
 * 
 * Performance:
 * - create: O(1) - increment counter, add to Set
 * - destroy: O(1) - remove from Set
 * - isAlive: O(1) - Set lookup
 * 
 * Trade-offs:
 * - Simple and fast
 * - IDs never reused (fine for typical game session lengths)
 * - No generational indices (simpler but can't detect stale references)
 * 
 * @example
 * const manager = new EntityManager();
 * const entity = manager.create(); // Returns 0
 * const entity2 = manager.create(); // Returns 1
 * manager.destroy(entity); // Entity 0 is now dead
 * console.log(manager.isAlive(entity)); // false
 * console.log(manager.isAlive(entity2)); // true
 */

import type { Entity } from './types';

/**
 * EntityManager class
 * 
 * Handles entity ID generation and lifecycle tracking.
 */
export class EntityManager {
  /**
   * Next entity ID to allocate
   * Starts at 0 and increments for each new entity.
   * Never decrements (IDs are not reused).
   */
  private nextEntityId: Entity = 0;

  /**
   * Set of currently active (alive) entities
   * Used for O(1) isAlive checks.
   * Entities are added on create(), removed on destroy().
   */
  private activeEntities: Set<Entity> = new Set();

  /**
   * Create a new entity
   * 
   * Allocates a new unique entity ID and marks it as active.
   * This is an O(1) operation.
   * 
   * @returns The newly created entity ID
   * 
   * @example
   * const entity = manager.create();
   * console.log(`Created entity ${entity}`);
   */
  create(): Entity {
    const entity = this.nextEntityId++;
    this.activeEntities.add(entity);
    return entity;
  }

  /**
   * Destroy an entity
   * 
   * Marks the entity as dead by removing it from the active set.
   * The entity ID is not reused. This is an O(1) operation.
   * 
   * If the entity is already dead or never existed, this is a no-op.
   * 
   * Note: This only marks the entity as dead. The caller (typically ECSWorld)
   * is responsible for removing all components from the entity.
   * 
   * @param entity - The entity ID to destroy
   * 
   * @example
   * manager.destroy(entity);
   */
  destroy(entity: Entity): void {
    this.activeEntities.delete(entity);
  }

  /**
   * Check if an entity is alive
   * 
   * Returns true if the entity exists and has not been destroyed.
   * This is an O(1) operation (Set lookup).
   * 
   * @param entity - The entity ID to check
   * @returns true if the entity is alive, false otherwise
   * 
   * @example
   * if (manager.isAlive(entity)) {
   *   // Entity exists and is active
   * }
   */
  isAlive(entity: Entity): boolean {
    return this.activeEntities.has(entity);
  }

  /**
   * Get the total number of active entities
   * 
   * Returns the count of entities that have been created but not destroyed.
   * This is an O(1) operation (Set.size).
   * 
   * @returns Number of active entities
   * 
   * @example
   * console.log(`${manager.getEntityCount()} entities active`);
   */
  getEntityCount(): number {
    return this.activeEntities.size;
  }

  /**
   * Get all active entity IDs
   * 
   * Returns an array of all currently active entity IDs.
   * This is O(n) where n is the number of active entities.
   * 
   * Useful for debugging or iterating over all entities.
   * 
   * @returns Array of active entity IDs
   * 
   * @example
   * const entities = manager.getAllEntities();
   * console.log(`Active entities: ${entities.join(', ')}`);
   */
  getAllEntities(): Entity[] {
    return Array.from(this.activeEntities);
  }

  /**
   * Clear all entities
   * 
   * Destroys all active entities and resets the ID counter to 0.
   * This is useful for resetting the game state.
   * 
   * Warning: This invalidates all existing entity IDs!
   * 
   * @example
   * manager.clear(); // Start fresh
   */
  clear(): void {
    this.activeEntities.clear();
    this.nextEntityId = 0;
  }

  /**
   * Get the next entity ID that would be allocated
   * 
   * This is useful for debugging or estimating entity count.
   * Note that this doesn't account for destroyed entities.
   * 
   * @returns The next entity ID
   * @internal
   * 
   * @example
   * const nextId = manager.getNextEntityId();
   * console.log(`Next entity will be ID ${nextId}`);
   */
  getNextEntityId(): Entity {
    return this.nextEntityId;
  }
}
