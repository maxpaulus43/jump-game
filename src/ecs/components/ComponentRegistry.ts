/**
 * ComponentRegistry
 * 
 * Manages storage and retrieval of all components across all entities.
 * Uses one SparseSet per component type for efficient storage and iteration.
 * 
 * Architecture:
 * - componentStores: Map<ComponentType, SparseSet<component>>
 * - Each component type gets its own SparseSet
 * - Components are stored separately by type for cache-friendly iteration
 * 
 * Performance:
 * - add: O(1) - add to appropriate SparseSet
 * - remove: O(1) - remove from SparseSet
 * - get: O(1) - lookup in SparseSet
 * - has: O(1) - check SparseSet
 * - getEntitiesWithComponent: O(n) - return SparseSet entities
 * 
 * Design Pattern:
 * This implements the Data-Oriented Design principle of storing components
 * by type in contiguous memory (via SparseSet's dense arrays) rather than
 * storing all components for an entity together.
 * 
 * @example
 * const registry = new ComponentRegistry();
 * registry.register(Transform);
 * registry.add(entity, new Transform(100, 200));
 * const transform = registry.get(entity, Transform.type);
 */

import type { Entity, ComponentType, ComponentClass } from '../types';
import { SparseSet } from '../SparseSet';

/**
 * ComponentRegistry class
 * 
 * Central storage for all components, organized by component type.
 */
export class ComponentRegistry {
  /**
   * Map of component type -> SparseSet storage
   * Each component type gets its own SparseSet for efficient storage.
   */
  private componentStores: Map<ComponentType, SparseSet<any>> = new Map();

  /**
   * Map of component type -> component class constructor
   * Used for debugging and reflection (optional).
   */
  private componentClasses: Map<ComponentType, ComponentClass> = new Map();

  /**
   * Register a component type
   * 
   * Creates a SparseSet for this component type if it doesn't exist.
   * This should be called before adding components of this type.
   * 
   * Note: Registration is optional - add() will auto-register if needed.
   * But explicit registration is clearer and catches typos earlier.
   * 
   * @param componentClass - The component class to register
   * 
   * @example
   * registry.register(Transform);
   * registry.register(Velocity);
   */
  register<T>(componentClass: ComponentClass<T>): void {
    const type = componentClass.type;

    if (!this.componentStores.has(type)) {
      this.componentStores.set(type, new SparseSet<T>());
      this.componentClasses.set(type, componentClass);
    }
  }

  /**
   * Add a component to an entity
   * 
   * If the entity already has this component type, it will be replaced.
   * Auto-registers the component type if not already registered.
   * 
   * @param entity - The entity ID
   * @param component - The component instance to add
   * 
   * @example
   * registry.add(entity, new Transform(100, 200));
   */
  add<T>(entity: Entity, component: T): void {
    // Extract component type from the component class
    // Components must have a constructor with a static 'type' property
    const ctor = (component as any).constructor as ComponentClass<T>;
    const type = ctor.type;

    if (!type) {
      throw new Error(
        `Component class ${ctor.name} missing static 'type' property. ` +
        `All components must define: static readonly type: ComponentType<${ctor.name}>`
      );
    }

    // Auto-register component type if needed
    if (!this.componentStores.has(type)) {
      this.componentStores.set(type, new SparseSet<T>());
      this.componentClasses.set(type, ctor);
    }

    // Add to appropriate SparseSet
    const store = this.componentStores.get(type)!;
    store.add(entity, component);
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
   * registry.remove(entity, Transform.type);
   */
  remove<T>(entity: Entity, type: ComponentType<T>): void {
    const store = this.componentStores.get(type);
    if (store) {
      store.remove(entity);
    }
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
   * const transform = registry.get(entity, Transform.type);
   * if (transform) {
   *   console.log(transform.x, transform.y);
   * }
   */
  get<T>(entity: Entity, type: ComponentType<T>): T | undefined {
    const store = this.componentStores.get(type);
    return store ? store.get(entity) : undefined;
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
   * if (registry.has(entity, Transform.type)) {
   *   // Entity has Transform component
   * }
   */
  has<T>(entity: Entity, type: ComponentType<T>): boolean {
    const store = this.componentStores.get(type);
    return store ? store.has(entity) : false;
  }

  /**
   * Get all entities that have a specific component type
   * 
   * Returns an array of entity IDs. This is useful for systems
   * that need to iterate over all entities with a specific component.
   * 
   * @param type - The component type
   * @returns Array of entity IDs that have this component
   * 
   * @example
   * const entities = registry.getEntitiesWithComponent(Transform.type);
   * for (const entity of entities) {
   *   const transform = registry.get(entity, Transform.type)!;
   *   // Process transform
   * }
   */
  getEntitiesWithComponent(type: ComponentType): Entity[] {
    const store = this.componentStores.get(type);
    return store ? store.entities() : [];
  }

  /**
   * Remove all components from an entity
   * 
   * This is called when an entity is destroyed to clean up all its components.
   * Iterates through all component types and removes the entity from each.
   * 
   * @param entity - The entity ID
   * 
   * @example
   * registry.removeAllComponents(entity);
   */
  removeAllComponents(entity: Entity): void {
    // Iterate through all component stores and remove this entity
    for (const store of this.componentStores.values()) {
      store.remove(entity);
    }
  }

  /**
   * Get all registered component types
   * 
   * Returns an array of all component types that have been registered.
   * Useful for debugging and introspection.
   * 
   * @returns Array of component type strings
   * 
   * @example
   * const types = registry.getComponentTypes();
   * console.log(`Registered types: ${types.join(', ')}`);
   */
  getComponentTypes(): ComponentType[] {
    return Array.from(this.componentStores.keys());
  }

  /**
   * Get the SparseSet for a component type
   * 
   * This is for advanced use cases where you need direct access to
   * the underlying storage. Use with caution.
   * 
   * @param type - The component type
   * @returns The SparseSet for this type, or undefined
   * @internal
   * 
   * @example
   * const store = registry.getStore(Transform.type);
   * const entities = store?.entities() ?? [];
   */
  getStore<T>(type: ComponentType<T>): SparseSet<T> | undefined {
    return this.componentStores.get(type);
  }

  /**
   * Clear all components
   * 
   * Removes all components from all entities and clears all stores.
   * This is useful for resetting the game state.
   * 
   * Note: This does not unregister component types - the stores remain
   * but are emptied.
   * 
   * @example
   * registry.clear();
   */
  clear(): void {
    for (const store of this.componentStores.values()) {
      store.clear();
    }
  }

  /**
   * Get statistics about component storage
   * 
   * Returns information about the number of registered types and
   * the total number of components stored. Useful for debugging
   * and performance monitoring.
   * 
   * @returns Object with component statistics
   * 
   * @example
   * const stats = registry.getStats();
   * console.log(`${stats.types} types, ${stats.totalComponents} components`);
   */
  getStats(): { types: number; totalComponents: number } {
    let totalComponents = 0;
    for (const store of this.componentStores.values()) {
      totalComponents += store.size();
    }
    return {
      types: this.componentStores.size,
      totalComponents
    };
  }

  /**
   * Get the component class for a type
   * 
   * Returns the constructor function for a registered component type.
   * Useful for reflection and debugging.
   * 
   * @param type - The component type
   * @returns The component class constructor, or undefined
   * 
   * @example
   * const TransformClass = registry.getComponentClass(Transform.type);
   * const newTransform = new TransformClass();
   */
  getComponentClass<T>(type: ComponentType<T>): ComponentClass<T> | undefined {
    return this.componentClasses.get(type);
  }
}
