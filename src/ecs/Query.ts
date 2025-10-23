/**
 * Query System
 * 
 * Filters entities based on component presence/absence.
 * Queries use AND logic for 'with' clause and NOT logic for 'without' clause.
 * 
 * Design:
 * - On-demand computation (no caching yet - can be optimized later)
 * - Queries start with smallest component set for efficiency
 * - Results are computed fresh each time (stateless)
 * 
 * Performance:
 * - Query execution: O(n * m) where n = entities with rarest component, m = number of component checks
 * - Optimization: Start with smallest component set to minimize iterations
 * - Future: Can add query caching if profiling shows this is a bottleneck
 * 
 * @example
 * // Find entities with Transform and Velocity but not PlayerController
 * const entities = Query.execute(registry, {
 *   with: [Transform.type, Velocity.type],
 *   without: [PlayerController.type]
 * });
 */

import type { Entity, ComponentType, Query, QueryResult } from './types';
import type { ComponentRegistry } from './components/ComponentRegistry';

/**
 * Query execution engine
 * 
 * Provides static methods for executing queries against a ComponentRegistry.
 * All methods are stateless - they don't store query results.
 */
export class QueryExecutor {
  /**
   * Execute a query and return matching entities
   * 
   * Algorithm:
   * 1. Find the smallest component set from the 'with' clause
   * 2. Iterate through entities in that set
   * 3. Check if each entity has all required components (AND logic)
   * 4. Check if each entity lacks all excluded components (NOT logic)
   * 5. Return entities that pass all checks
   * 
   * Starting with the smallest set minimizes the number of entities to check.
   * 
   * @param registry - The component registry to query
   * @param query - The query specification
   * @returns Array of matching entity IDs
   * 
   * @example
   * const entities = QueryExecutor.execute(registry, {
   *   with: [Transform.type, Velocity.type],
   *   without: [PlayerController.type]
   * });
   */
  static execute(registry: ComponentRegistry, query: Query): Entity[] {
    // Validate query has at least one component in 'with' clause
    if (!query.with || query.with.length === 0) {
      throw new Error('Query must specify at least one component in "with" clause');
    }

    // Optimization: Start with smallest component set to minimize iterations
    const smallestType = this.findSmallestComponentSet(registry, query.with);
    if (!smallestType) {
      // No entities have any of the required components
      return [];
    }

    const candidates = registry.getEntitiesWithComponent(smallestType);
    const results: Entity[] = [];

    // Check each candidate entity
    for (const entity of candidates) {
      if (this.matchesEntity(registry, entity, query)) {
        results.push(entity);
      }
    }

    return results;
  }

  /**
   * Check if a single entity matches a query
   * 
   * Tests both the 'with' (AND) and 'without' (NOT) clauses.
   * 
   * @param registry - The component registry
   * @param entity - The entity ID to test
   * @param query - The query specification
   * @returns true if entity matches query
   * 
   * @example
   * if (QueryExecutor.matchesEntity(registry, entity, query)) {
   *   // Entity matches query
   * }
   */
  static matchesEntity(registry: ComponentRegistry, entity: Entity, query: Query): boolean {
    // Check all required components (AND logic)
    for (const type of query.with) {
      if (!registry.has(entity, type)) {
        return false;
      }
    }

    // Check excluded components (NOT logic)
    if (query.without) {
      for (const type of query.without) {
        if (registry.has(entity, type)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Find the component type with the smallest entity set
   * 
   * This optimization reduces the number of entities we need to check.
   * We start with the rarest component and filter from there.
   * 
   * @param registry - The component registry
   * @param types - Array of component types to check
   * @returns The component type with fewest entities, or undefined if all are empty
   * 
   * @example
   * const smallestType = QueryExecutor.findSmallestComponentSet(registry, [
   *   Transform.type,
   *   Velocity.type
   * ]);
   */
  private static findSmallestComponentSet(
    registry: ComponentRegistry,
    types: ComponentType[]
  ): ComponentType | undefined {
    let smallestType: ComponentType | undefined;
    let smallestSize = Infinity;

    for (const type of types) {
      const store = registry.getStore(type);
      if (!store) {
        // Component type not registered, no entities have it
        return undefined;
      }

      const size = store.size();
      if (size === 0) {
        // No entities have this component, query result will be empty
        return undefined;
      }

      if (size < smallestSize) {
        smallestSize = size;
        smallestType = type;
      }
    }

    return smallestType;
  }

  /**
   * Create a query result object
   * 
   * Wraps the entity array in a QueryResult for future extensibility.
   * 
   * @param entities - Array of matching entity IDs
   * @returns QueryResult object
   * @internal
   */
  static createResult(entities: Entity[]): QueryResult {
    return { entities };
  }

  /**
   * Count entities matching a query without allocating an array
   * 
   * This is more efficient than execute() when you only need the count.
   * 
   * @param registry - The component registry
   * @param query - The query specification
   * @returns Number of matching entities
   * 
   * @example
   * const count = QueryExecutor.count(registry, {
   *   with: [Transform.type, Velocity.type]
   * });
   * console.log(`${count} entities match query`);
   */
  static count(registry: ComponentRegistry, query: Query): number {
    if (!query.with || query.with.length === 0) {
      throw new Error('Query must specify at least one component in "with" clause');
    }

    const smallestType = this.findSmallestComponentSet(registry, query.with);
    if (!smallestType) {
      return 0;
    }

    const candidates = registry.getEntitiesWithComponent(smallestType);
    let count = 0;

    for (const entity of candidates) {
      if (this.matchesEntity(registry, entity, query)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check if any entities match a query
   * 
   * Short-circuits as soon as a match is found. More efficient than
   * checking if execute() returns a non-empty array.
   * 
   * @param registry - The component registry
   * @param query - The query specification
   * @returns true if at least one entity matches
   * 
   * @example
   * if (QueryExecutor.hasMatches(registry, query)) {
   *   // At least one entity matches
   * }
   */
  static hasMatches(registry: ComponentRegistry, query: Query): boolean {
    if (!query.with || query.with.length === 0) {
      throw new Error('Query must specify at least one component in "with" clause');
    }

    const smallestType = this.findSmallestComponentSet(registry, query.with);
    if (!smallestType) {
      return false;
    }

    const candidates = registry.getEntitiesWithComponent(smallestType);

    for (const entity of candidates) {
      if (this.matchesEntity(registry, entity, query)) {
        return true;
      }
    }

    return false;
  }
}
