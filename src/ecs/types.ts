/**
 * ECS Core Type Definitions
 * 
 * This module defines the fundamental types for the Entity Component System.
 * The ECS architecture separates data (components) from behavior (systems),
 * allowing for better performance, flexibility, and composition.
 */

/**
 * Entity ID type - simple incrementing counter
 * 
 * Entities are just unique IDs that act as handles to groups of components.
 * We use a simple number for performance and simplicity. No generational
 * indices are used in this implementation.
 * 
 * @example
 * const entity: Entity = 42;
 */
export type Entity = number;

/**
 * Component type identifier (unique string per component type)
 * 
 * Each component class has a unique type string that identifies it.
 * This is used as a key in the ComponentRegistry to store and retrieve
 * components efficiently.
 * 
 * The __componentBrand is a phantom type parameter that provides
 * type safety without runtime overhead.
 * 
 * @example
 * const transformType: ComponentType<Transform> = 'Transform' as ComponentType<Transform>;
 */
export type ComponentType<T = any> = string & { __componentBrand?: T };

/**
 * Component class constructor
 * 
 * All component classes must have a static 'type' property that
 * identifies the component type. This interface enforces that constraint.
 * 
 * @example
 * class Transform {
 *   static readonly type: ComponentType<Transform> = 'Transform' as ComponentType<Transform>;
 *   constructor(public x: number = 0, public y: number = 0) {}
 * }
 */
export interface ComponentClass<T = any> {
  new (...args: any[]): T;
  type: ComponentType<T>;
}

/**
 * Query filter for entity iteration
 * 
 * Queries allow systems to find entities that have specific components.
 * The 'with' clause specifies required components (AND logic).
 * The 'without' clause specifies components that must not be present (NOT logic).
 * 
 * @example
 * // Find entities with Transform and Velocity but not PlayerController
 * const query: Query = {
 *   with: [Transform.type, Velocity.type],
 *   without: [PlayerController.type]
 * };
 */
export interface Query {
  /** Components that must be present (AND logic) */
  with: ComponentType[];
  /** Components that must not be present (NOT logic) */
  without?: ComponentType[];
}

/**
 * Query result containing matched entities
 * 
 * The result of executing a query is a list of entity IDs
 * that match the query criteria.
 * 
 * @example
 * const result: QueryResult = { entities: [1, 5, 10, 23] };
 */
export interface QueryResult {
  /** Array of entity IDs that match the query */
  entities: Entity[];
}

/**
 * System interface - systems operate on components
 * 
 * Systems contain the game logic and operate on entities via queries.
 * Each system implements the update() method which is called every frame.
 * Systems are stateless and only modify component data, not entities directly.
 * 
 * @example
 * class PhysicsSystem implements System {
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
export interface System {
  /** System name for debugging and identification */
  readonly name: string;
  
  /** 
   * Update system logic (called every frame at fixed timestep)
   * 
   * @param dt - Delta time in seconds (fixed at 1/60 = 0.01667s)
   * @param world - The ECS world containing all entities and components
   */
  update(dt: number, world: ECSWorld): void;
  
  /** 
   * Optional cleanup when system is removed
   * Use this to release resources, clear listeners, etc.
   */
  onDestroy?(): void;
}

/**
 * System constructor
 * 
 * Used for type-safe system instantiation and retrieval.
 * 
 * @example
 * const systemClass: SystemClass = PhysicsSystem;
 * const system = new systemClass();
 */
export interface SystemClass {
  new (): System;
}

/**
 * ECSWorld interface (forward declaration)
 * 
 * The main ECS world container that provides the public API
 * for entity/component management and queries. Full implementation
 * is in ECSWorld.ts.
 */
export interface ECSWorld {
  /** Create a new entity and return its ID */
  createEntity(): Entity;
  
  /** Destroy an entity and remove all its components */
  destroyEntity(entity: Entity): void;
  
  /** Add a component to an entity */
  addComponent<T>(entity: Entity, component: T): void;
  
  /** Remove a component from an entity */
  removeComponent<T>(entity: Entity, type: ComponentType<T>): void;
  
  /** Get a component from an entity (returns undefined if not present) */
  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined;
  
  /** Check if an entity has a component */
  hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean;
  
  /** Execute a query and return matching entities */
  query(query: Query): Entity[];
  
  /** Count entities matching a query */
  countQuery(query: Query): number;
  
  /** Check if any entities match a query */
  hasMatches(query: Query): boolean;
  
  /** Clear all entities and components */
  clear(): void;
}
