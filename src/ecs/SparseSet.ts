/**
 * SparseSet Data Structure
 * 
 * A sparse set provides O(1) insertion, deletion, and lookup while maintaining
 * cache-friendly iteration over dense data. This is ideal for ECS component storage.
 * 
 * Architecture:
 * - sparse: array mapping entity ID -> dense array index (may have holes/undefined)
 * - dense: packed array of entity IDs (no holes, cache-friendly)
 * - components: packed array of component data (parallel to dense)
 * 
 * Performance:
 * - add: O(1) - append to dense array
 * - remove: O(1) - swap-and-pop from dense array
 * - get: O(1) - sparse[entity] gives dense index
 * - has: O(1) - check if sparse[entity] is defined
 * - iteration: O(n) where n = number of components (dense array iteration)
 * 
 * Memory:
 * - sparse array grows to accommodate highest entity ID (but sparse, mostly undefined)
 * - dense arrays stay compact (only allocated elements)
 * 
 * @example
 * const set = new SparseSet<Transform>();
 * set.add(42, new Transform(100, 200));
 * const transform = set.get(42); // O(1) lookup
 * set.remove(42); // O(1) removal via swap-and-pop
 */

import type { Entity } from './types';

/**
 * SparseSet interface for component storage
 */
export interface ISparseSet<T> {
  /** Add component for entity */
  add(entity: Entity, component: T): void;
  /** Remove component from entity */
  remove(entity: Entity): void;
  /** Get component for entity (returns undefined if not present) */
  get(entity: Entity): T | undefined;
  /** Check if entity has component */
  has(entity: Entity): boolean;
  /** Get all entities with this component */
  entities(): Entity[];
  /** Clear all components */
  clear(): void;
  /** Get component count */
  size(): number;
}

/**
 * SparseSet implementation
 * 
 * Uses the sparse set pattern for O(1) operations on component data.
 * The sparse array can grow large but remains mostly empty (undefined slots).
 * The dense arrays stay compact for cache-friendly iteration.
 */
export class SparseSet<T> implements ISparseSet<T> {
  /**
   * Sparse array: maps entity ID -> index in dense array
   * May contain undefined for entities without this component.
   * Grows to accommodate highest entity ID seen.
   */
  private sparse: (number | undefined)[] = [];
  
  /**
   * Dense array: packed array of entity IDs that have this component
   * No holes, always contiguous. Enables cache-friendly iteration.
   */
  private dense: Entity[] = [];
  
  /**
   * Component array: packed array of component data
   * Parallel to dense array (same indices). Components stored contiguously.
   */
  private components: T[] = [];

  /**
   * Add a component to an entity
   * 
   * If the entity already has this component, it will be replaced.
   * This is an O(1) operation that appends to the dense arrays.
   * 
   * @param entity - The entity ID
   * @param component - The component data to add
   * 
   * @example
   * set.add(42, new Transform(100, 200));
   */
  add(entity: Entity, component: T): void {
    // Check if entity already has this component
    if (this.has(entity)) {
      // Replace existing component data
      const denseIndex = this.sparse[entity]!;
      this.components[denseIndex] = component;
      return;
    }

    // Grow sparse array if needed
    if (entity >= this.sparse.length) {
      // Fill with undefined up to entity ID
      this.sparse.length = entity + 1;
    }

    // Add to dense arrays
    const denseIndex = this.dense.length;
    this.sparse[entity] = denseIndex;
    this.dense.push(entity);
    this.components.push(component);
  }

  /**
   * Remove a component from an entity
   * 
   * Uses swap-and-pop for O(1) removal: swaps the target element with
   * the last element, then pops the last element. This keeps the dense
   * arrays packed without holes.
   * 
   * If the entity doesn't have the component, this is a no-op.
   * 
   * @param entity - The entity ID
   * 
   * @example
   * set.remove(42);
   */
  remove(entity: Entity): void {
    // Check if entity has this component
    if (!this.has(entity)) {
      return;
    }

    // Get index in dense array
    const denseIndex = this.sparse[entity]!;
    const lastIndex = this.dense.length - 1;

    if (denseIndex !== lastIndex) {
      // Swap with last element (to avoid holes)
      const lastEntity = this.dense[lastIndex];
      const lastComponent = this.components[lastIndex];

      // Move last element to removed element's position
      this.dense[denseIndex] = lastEntity;
      this.components[denseIndex] = lastComponent;
      
      // Update sparse array for swapped entity
      this.sparse[lastEntity] = denseIndex;
    }

    // Pop last element
    this.dense.pop();
    this.components.pop();
    
    // Mark as removed in sparse array
    this.sparse[entity] = undefined;
  }

  /**
   * Get component for entity
   * 
   * O(1) lookup via sparse array indirection.
   * 
   * @param entity - The entity ID
   * @returns The component data, or undefined if entity doesn't have component
   * 
   * @example
   * const transform = set.get(42);
   * if (transform) {
   *   console.log(transform.x, transform.y);
   * }
   */
  get(entity: Entity): T | undefined {
    if (!this.has(entity)) {
      return undefined;
    }
    
    const denseIndex = this.sparse[entity]!;
    return this.components[denseIndex];
  }

  /**
   * Check if entity has component
   * 
   * O(1) check via sparse array bounds and undefined check.
   * Also validates that the sparse -> dense -> sparse mapping is consistent
   * to catch corruption.
   * 
   * @param entity - The entity ID
   * @returns true if entity has this component
   * 
   * @example
   * if (set.has(42)) {
   *   // Entity has component
   * }
   */
  has(entity: Entity): boolean {
    // Check sparse array bounds
    if (entity >= this.sparse.length) {
      return false;
    }

    const denseIndex = this.sparse[entity];
    
    // Check if sparse slot is undefined (entity doesn't have component)
    if (denseIndex === undefined) {
      return false;
    }

    // Validate dense array bounds and back-reference
    // This catches corruption if sparse points to invalid dense index
    if (denseIndex >= this.dense.length) {
      return false;
    }

    // Verify sparse -> dense -> sparse mapping is consistent
    return this.dense[denseIndex] === entity;
  }

  /**
   * Get all entities that have this component
   * 
   * Returns a copy of the dense entity array for safe iteration.
   * This is O(n) where n is the number of entities with this component.
   * 
   * @returns Array of entity IDs (copy, safe to iterate)
   * 
   * @example
   * const entities = set.entities();
   * for (const entity of entities) {
   *   const component = set.get(entity)!;
   *   // Process component
   * }
   */
  entities(): Entity[] {
    // Return a copy to prevent external modification
    return [...this.dense];
  }

  /**
   * Clear all components
   * 
   * Resets the sparse set to empty state. All arrays are cleared.
   * This is O(1) as we just reset array lengths (GC handles cleanup).
   * 
   * @example
   * set.clear();
   */
  clear(): void {
    this.sparse = [];
    this.dense = [];
    this.components = [];
  }

  /**
   * Get the number of components stored
   * 
   * O(1) operation - just returns dense array length.
   * 
   * @returns Number of entities with this component
   * 
   * @example
   * console.log(`${set.size()} entities have this component`);
   */
  size(): number {
    return this.dense.length;
  }

  /**
   * Get direct access to components array (for advanced use)
   * 
   * WARNING: This exposes internal state. Only use for performance-critical
   * iteration where you need direct array access. Do not modify the array.
   * 
   * @returns The internal components array (DO NOT MODIFY)
   * @internal
   */
  getComponentsUnsafe(): readonly T[] {
    return this.components;
  }

  /**
   * Get direct access to dense entities array (for advanced use)
   * 
   * WARNING: This exposes internal state. Only use for performance-critical
   * iteration where you need direct array access. Do not modify the array.
   * 
   * @returns The internal dense array (DO NOT MODIFY)
   * @internal
   */
  getEntitiesUnsafe(): readonly Entity[] {
    return this.dense;
  }
}
