/**
 * System Base Class
 * 
 * Abstract base class for all ECS systems.
 * Systems contain game logic and operate on entities via queries.
 * 
 * Design Principles:
 * - Systems are stateless (only read/write component data)
 * - Systems operate on entities via queries
 * - Systems execute in a defined order (set by SystemScheduler)
 * - Systems should not directly reference other systems
 * 
 * Lifecycle:
 * 1. System is instantiated
 * 2. System is registered with SystemScheduler
 * 3. System.update() is called each frame with fixed dt
 * 4. System.onDestroy() is called when removed (optional)
 * 
 * @example
 * class PhysicsSystem extends System {
 *   readonly name = 'PhysicsSystem';
 *   
 *   update(dt: number, world: ECSWorld): void {
 *     const entities = world.query({ with: [Transform.type, Velocity.type] });
 *     for (const entity of entities) {
 *       const transform = world.getComponent(entity, Transform.type)!;
 *       const velocity = world.getComponent(entity, Velocity.type)!;
 *       transform.x += velocity.x * dt;
 *       transform.y += velocity.y * dt;
 *     }
 *   }
 * }
 */

import type { System as ISystem, World, Query } from '../types';

/**
 * Abstract base class for systems
 * 
 * All game systems should extend this class and implement the update() method.
 */
export abstract class System implements ISystem {
  /**
   * System name for debugging and identification
   * 
   * Override this in subclasses with a descriptive name.
   */
  abstract readonly name: string;

  /**
   * Update system logic
   * 
   * Called once per frame at a fixed timestep (typically 60 Hz).
   * Systems should query for entities, read/write components, and
   * implement their specific game logic here.
   * 
   * @param dt - Delta time in seconds (fixed at 1/60 = 0.01667s)
   * @param world - The ECS world containing all entities and components
   * 
   * @example
   * update(dt: number, world: ECSWorld): void {
   *   const entities = world.query({ with: [Transform.type] });
   *   for (const entity of entities) {
   *     const transform = world.getComponent(entity, Transform.type)!;
   *     // Modify transform
   *   }
   * }
   */
  abstract update(dt: number, world: World): void;

  /**
   * Optional cleanup when system is removed
   * 
   * Override this to release resources, clear event listeners, etc.
   * Called by SystemScheduler when the system is removed.
   * 
   * @example
   * onDestroy(): void {
   *   // Clean up resources
   *   this.eventListeners.forEach(listener => listener.remove());
   * }
   */
  onDestroy?(): void;

  /**
   * Helper: Query for entities with specific components
   * 
   * Convenience wrapper around world.query() for cleaner system code.
   * 
   * @param world - The ECS world
   * @param query - The query specification
   * @returns Array of entity IDs
   * 
   * @example
   * const entities = this.query(world, {
   *   with: [Transform.type, Velocity.type]
   * });
   */
  protected query(world: World, query: Query): number[] {
    return world.query(query);
  }

  /**
   * Helper: Check if any entities match a query
   * 
   * More efficient than checking if query() returns a non-empty array.
   * 
   * @param world - The ECS world
   * @param query - The query specification
   * @returns true if at least one entity matches
   * 
   * @example
   * if (this.hasMatches(world, { with: [PlayerController.type] })) {
   *   // At least one player exists
   * }
   */
  protected hasMatches(world: World, query: Query): boolean {
    return world.hasMatches(query);
  }

  /**
   * Helper: Count entities matching a query
   * 
   * @param world - The ECS world
   * @param query - The query specification
   * @returns Number of matching entities
   * 
   * @example
   * const enemyCount = this.countQuery(world, { with: [Enemy.type] });
   */
  protected countQuery(world: World, query: Query): number {
    return world.countQuery(query);
  }

  /**
   * Get system name (for debugging)
   * 
   * @returns The system name
   */
  toString(): string {
    return this.name;
  }
}
