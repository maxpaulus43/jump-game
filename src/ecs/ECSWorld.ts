/**
 * ECSWorld
 * 
 * Main ECS container that integrates EntityManager, ComponentRegistry, and Query system.
 * This is the primary API for game code to interact with the ECS.
 * 
 * Architecture:
 * - Owns EntityManager for entity lifecycle
 * - Owns ComponentRegistry for component storage
 * - Provides query interface via QueryExecutor
 * - Ensures entity-component consistency (destroying entity removes all components)
 * 
 * Usage Pattern:
 * 1. Create world: `const world = new ECSWorld()`
 * 2. Create entities: `const entity = world.createEntity()`
 * 3. Add components: `world.addComponent(entity, new Transform(x, y))`
 * 4. Query entities: `const entities = world.query({ with: [Transform.type] })`
 * 5. Get components: `const transform = world.getComponent(entity, Transform.type)`
 * 
 * @example
 * const world = new ECSWorld();
 * const player = world.createEntity();
 * world.addComponent(player, new Transform(100, 200));
 * world.addComponent(player, new Velocity(0, 0));
 * 
 * const movingEntities = world.query({ with: [Transform.type, Velocity.type] });
 * for (const entity of movingEntities) {
 *   const transform = world.getComponent(entity, Transform.type)!;
 *   const velocity = world.getComponent(entity, Velocity.type)!;
 *   // Update position
 * }
 */

import type { Entity, ComponentType, Query, ECSWorld as IECSWorld } from './types';
import { EntityManager } from './EntityManager';
import { ComponentRegistry } from './ComponentRegistry';
import { QueryExecutor } from './Query';

/**
 * ECSWorld class
 * 
 * The main ECS world container. Provides the public API for entity/component
 * management and queries.
 */
export class ECSWorld implements IECSWorld {
  /**
   * Entity lifecycle manager
   */
  private entityManager: EntityManager;

  /**
   * Component storage
   */
  private componentRegistry: ComponentRegistry;

  /**
   * Create a new ECS world
   * 
   * Initializes empty entity and component storage.
   */
  constructor() {
    this.entityManager = new EntityManager();
    this.componentRegistry = new ComponentRegistry();
  }

  /**
   * Create a new entity
   * 
   * Allocates a new entity ID and marks it as active.
   * The entity starts with no components.
   * 
   * @returns The newly created entity ID
   * 
   * @example
   * const entity = world.createEntity();
   * world.addComponent(entity, new Transform(0, 0));
   */
  createEntity(): Entity {
    return this.entityManager.create();
  }

  /**
   * Destroy an entity
   * 
   * Removes the entity and all its components. The entity ID becomes invalid
   * and should not be used after this call.
   * 
   * If the entity doesn't exist or is already destroyed, this is a no-op.
   * 
   * @param entity - The entity ID to destroy
   * 
   * @example
   * world.destroyEntity(entity);
   * // entity ID is now invalid
   */
  destroyEntity(entity: Entity): void {
    if (!this.entityManager.isAlive(entity)) {
      return;
    }

    // Remove all components first
    this.componentRegistry.removeAllComponents(entity);
    
    // Then mark entity as dead
    this.entityManager.destroy(entity);
  }

  /**
   * Add a component to an entity
   * 
   * If the entity already has this component type, it will be replaced.
   * The component class must have a static `type` property.
   * 
   * @param entity - The entity ID
   * @param component - The component instance to add
   * @throws Error if entity is not alive
   * @throws Error if component class is missing `type` property
   * 
   * @example
   * world.addComponent(entity, new Transform(100, 200));
   * world.addComponent(entity, new Velocity(5, 0));
   */
  addComponent<T>(entity: Entity, component: T): void {
    if (!this.entityManager.isAlive(entity)) {
      throw new Error(
        `Cannot add component to entity ${entity}: entity is not alive`
      );
    }

    this.componentRegistry.add(entity, component);
  }

  /**
   * Remove a component from an entity
   * 
   * If the entity doesn't have this component, this is a no-op.
   * 
   * @param entity - The entity ID
   * @param type - The component type to remove
   * 
   * @example
   * world.removeComponent(entity, Transform.type);
   */
  removeComponent<T>(entity: Entity, type: ComponentType<T>): void {
    this.componentRegistry.remove(entity, type);
  }

  /**
   * Get a component from an entity
   * 
   * Returns the component instance if present, undefined otherwise.
   * 
   * @param entity - The entity ID
   * @param type - The component type to get
   * @returns The component instance, or undefined
   * 
   * @example
   * const transform = world.getComponent(entity, Transform.type);
   * if (transform) {
   *   console.log(`Entity at (${transform.x}, ${transform.y})`);
   * }
   */
  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
    return this.componentRegistry.get(entity, type);
  }

  /**
   * Check if an entity has a component
   * 
   * Returns true if the entity has this component type.
   * 
   * @param entity - The entity ID
   * @param type - The component type to check
   * @returns true if entity has the component
   * 
   * @example
   * if (world.hasComponent(entity, Transform.type)) {
   *   const transform = world.getComponent(entity, Transform.type)!;
   *   // Use transform
   * }
   */
  hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
    return this.componentRegistry.has(entity, type);
  }

  /**
   * Execute a query and return matching entities
   * 
   * Finds all entities that have the required components (AND logic)
   * and lack the excluded components (NOT logic).
   * 
   * @param query - The query specification
   * @returns Array of entity IDs that match the query
   * 
   * @example
   * // Find all entities with Transform and Velocity
   * const movingEntities = world.query({
   *   with: [Transform.type, Velocity.type]
   * });
   * 
   * // Find all entities with Transform but not PlayerController
   * const npcs = world.query({
   *   with: [Transform.type],
   *   without: [PlayerController.type]
   * });
   */
  query(query: Query): Entity[] {
    return QueryExecutor.execute(this.componentRegistry, query);
  }

  /**
   * Clear all entities and components
   * 
   * Destroys all entities and removes all components. Resets the world
   * to initial state. Entity IDs start again from 0.
   * 
   * Use this to reset the game state.
   * 
   * @example
   * world.clear();
   * // World is now empty, ready to create new entities
   */
  clear(): void {
    this.componentRegistry.clear();
    this.entityManager.clear();
  }

  /**
   * Check if an entity is alive
   * 
   * Returns true if the entity exists and has not been destroyed.
   * 
   * @param entity - The entity ID to check
   * @returns true if entity is alive
   * 
   * @example
   * if (world.isAlive(entity)) {
   *   // Safe to use entity
   * }
   */
  isAlive(entity: Entity): boolean {
    return this.entityManager.isAlive(entity);
  }

  /**
   * Get the total number of active entities
   * 
   * @returns Number of entities currently alive
   * 
   * @example
   * console.log(`${world.getEntityCount()} entities active`);
   */
  getEntityCount(): number {
    return this.entityManager.getEntityCount();
  }

  /**
   * Get all active entity IDs
   * 
   * Returns an array of all currently active entity IDs.
   * Useful for debugging or iteration.
   * 
   * @returns Array of active entity IDs
   * 
   * @example
   * const allEntities = world.getAllEntities();
   * for (const entity of allEntities) {
   *   console.log(`Entity ${entity}`);
   * }
   */
  getAllEntities(): Entity[] {
    return this.entityManager.getAllEntities();
  }

  /**
   * Get component statistics
   * 
   * Returns information about registered component types and
   * total component count. Useful for debugging and monitoring.
   * 
   * @returns Object with component statistics
   * 
   * @example
   * const stats = world.getComponentStats();
   * console.log(`${stats.types} component types, ${stats.totalComponents} components`);
   */
  getComponentStats(): { types: number; totalComponents: number } {
    return this.componentRegistry.getStats();
  }

  /**
   * Get all registered component types
   * 
   * Returns an array of all component type strings that have been
   * registered in this world.
   * 
   * @returns Array of component type identifiers
   * 
   * @example
   * const types = world.getComponentTypes();
   * console.log(`Registered types: ${types.join(', ')}`);
   */
  getComponentTypes(): ComponentType[] {
    return this.componentRegistry.getComponentTypes();
  }

  /**
   * Count entities matching a query
   * 
   * More efficient than `query().length` as it doesn't allocate an array.
   * 
   * @param query - The query specification
   * @returns Number of matching entities
   * 
   * @example
   * const movingCount = world.countQuery({
   *   with: [Transform.type, Velocity.type]
   * });
   * console.log(`${movingCount} entities are moving`);
   */
  countQuery(query: Query): number {
    return QueryExecutor.count(this.componentRegistry, query);
  }

  /**
   * Check if any entities match a query
   * 
   * Short-circuits as soon as a match is found. More efficient than
   * checking if `query().length > 0`.
   * 
   * @param query - The query specification
   * @returns true if at least one entity matches
   * 
   * @example
   * if (world.hasMatches({ with: [PlayerController.type] })) {
   *   // At least one player exists
   * }
   */
  hasMatches(query: Query): boolean {
    return QueryExecutor.hasMatches(this.componentRegistry, query);
  }

  /**
   * Get direct access to the EntityManager
   * 
   * For advanced use cases. Most code should use the ECSWorld API instead.
   * 
   * @returns The entity manager instance
   * @internal
   */
  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  /**
   * Get direct access to the ComponentRegistry
   * 
   * For advanced use cases. Most code should use the ECSWorld API instead.
   * 
   * @returns The component registry instance
   * @internal
   */
  getComponentRegistry(): ComponentRegistry {
    return this.componentRegistry;
  }
}
