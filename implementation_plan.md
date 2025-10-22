# Implementation Plan: ECS Architecture Migration

## Overview

Convert the game from Object-Oriented Architecture to Entity Component System (ECS) architecture while maintaining or improving performance.

This is a comprehensive migration that will transform the current OOP game architecture into a data-oriented ECS architecture. The migration is split into three phases to ensure the game remains functional and testable throughout the process. The ECS implementation will use sparse sets for O(1) component access, incrementing entity IDs for simplicity, manual system ordering for predictable execution, and on-demand query computation (with future optimization potential for query caching).

**Current State**: The game uses traditional OOP with classes like `Player` and `Platform` that encapsulate data and behavior. Systems like `PhysicsSystem` operate on arrays of objects. The `World` class manages entities as a flat array.

**Target State**: Pure ECS where entities are IDs, components are pure data stored in sparse sets, and systems operate on components via queries. This enables better cache locality, easier parallelization, and more flexible composition of game behaviors.

**Key Benefits**:
- **Performance**: Cache-friendly component iteration, zero-allocation queries
- **Flexibility**: Easy to add/remove behaviors via components
- **Scalability**: Supports thousands of entities efficiently
- **Maintainability**: Clear separation of data and logic

**Performance Requirements**: The game currently runs at 60 FPS with hundreds of entities. The ECS implementation must maintain this performance or improve it through better memory layout and iteration patterns.

## Types

New type system for ECS core and component definitions.

### ECS Core Types (`src/ecs/types.ts`)

```typescript
/**
 * Entity ID type - simple incrementing counter
 */
export type Entity = number;

/**
 * Component type identifier (unique string per component type)
 */
export type ComponentType<T = any> = string & { __componentBrand: T };

/**
 * Component class constructor
 */
export interface ComponentClass<T = any> {
  new(...args: any[]): T;
  type: ComponentType<T>;
}

/**
 * Query filter for entity iteration
 */
export interface Query {
  /** Components that must be present */
  with: ComponentType[];
  /** Components that must not be present */
  without?: ComponentType[];
}

/**
 * Query result containing matched entities
 */
export interface QueryResult {
  entities: Entity[];
}

/**
 * System interface - systems operate on components
 */
export interface System {
  /** System name for debugging */
  readonly name: string;
  /** Update system logic (called every frame at fixed timestep) */
  update(dt: number, world: ECSWorld): void;
  /** Optional: cleanup when system is removed */
  onDestroy?(): void;
}

/**
 * System constructor
 */
export interface SystemClass {
  new(): System;
}
```

### Component Types (`src/ecs/components/`)

```typescript
// Transform.ts - Position and rotation
export class Transform {
  static readonly type: ComponentType<Transform> = 'Transform' as ComponentType<Transform>;
  constructor(
    public x: number = 0,
    public y: number = 0,
    public rotation: number = 0
  ) {}
}

// Velocity.ts - Movement velocity
export class Velocity {
  static readonly type: ComponentType<Velocity> = 'Velocity' as ComponentType<Velocity>;
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
}

// CircleCollider.ts - Circle collision shape
export class CircleCollider {
  static readonly type: ComponentType<CircleCollider> = 'CircleCollider' as ComponentType<CircleCollider>;
  constructor(
    public radius: number,
    public restitution: number = 1.0,
    public friction: number = 0.1
  ) {}
}

// RectCollider.ts - Rectangle collision shape
export class RectCollider {
  static readonly type: ComponentType<RectCollider> = 'RectCollider' as ComponentType<RectCollider>;
  constructor(
    public width: number,
    public height: number,
    public restitution: number = 0.3,
    public friction: number = 0.5
  ) {}
}

// Renderable.ts - Visual appearance
export class Renderable {
  static readonly type: ComponentType<Renderable> = 'Renderable' as ComponentType<Renderable>;
  constructor(
    public color: string = '#ffffff',
    public layer: number = 0
  ) {}
}

// PlayerController.ts - Player-specific behavior
export class PlayerController {
  static readonly type: ComponentType<PlayerController> = 'PlayerController' as ComponentType<PlayerController>;
  constructor(
    public gravity: number = 3000,
    public jumpVelocity: number = 1500,
    public acceleration: number = 1200,
    public maxSpeed: number = 800,
    public isGrounded: boolean = false
  ) {}
}

// Platform.ts - Platform tag component
export class Platform {
  static readonly type: ComponentType<Platform> = 'Platform' as ComponentType<Platform>;
  constructor(
    public platformType: PlatformType = PlatformType.Standard
  ) {}
}

// CameraTarget.ts - Marks entity as camera target
export class CameraTarget {
  static readonly type: ComponentType<CameraTarget> = 'CameraTarget' as ComponentType<CameraTarget>;
  constructor() {}
}
```

### Sparse Set Types (`src/ecs/SparseSet.ts`)

```typescript
/**
 * Sparse set data structure for O(1) component access
 * 
 * Uses two arrays:
 * - sparse: maps entity ID to dense array index (may have holes)
 * - dense: packed array of entity IDs
 * - components: packed array of component data (parallel to dense)
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
```

## Files

File modifications and new files for ECS implementation.

### New Files to Create

**Phase 1: ECS Core Infrastructure**

1. **`src/ecs/types.ts`** (180 lines)
   - Core ECS type definitions
   - Entity, ComponentType, Query, System interfaces
   - Export all ECS types

2. **`src/ecs/SparseSet.ts`** (150 lines)
   - SparseSet implementation for component storage
   - O(1) add, remove, get, has operations
   - Packed array iteration for cache-friendly access
   - Generic type parameter for component data

3. **`src/ecs/EntityManager.ts`** (80 lines)
   - Entity ID generation (incrementing counter)
   - Entity lifecycle management (create, destroy)
   - Entity validation

4. **`src/ecs/ComponentRegistry.ts`** (120 lines)
   - Component type registration
   - ComponentType string generation
   - Component metadata storage
   - Sparse set per component type

5. **`src/ecs/Query.ts`** (100 lines)
   - Query execution on component registry
   - Filter entities by component presence/absence
   - Return entity arrays for iteration
   - On-demand computation (no caching yet)

6. **`src/ecs/ECSWorld.ts`** (200 lines)
   - Main ECS world container
   - Integrates EntityManager, ComponentRegistry, Query
   - Entity creation/destruction API
   - Component add/remove/get API
   - Query API

7. **`src/ecs/System.ts`** (80 lines)
   - System base class
   - System lifecycle hooks
   - Helper methods for common queries

8. **`src/ecs/SystemScheduler.ts`** (100 lines)
   - System registration and execution
   - Manual ordering of systems
   - System enable/disable
   - System update orchestration

**Phase 2: Component and Entity Definitions**

9. **`src/ecs/components/Transform.ts`** (30 lines)
   - Transform component (position, rotation)

10. **`src/ecs/components/Velocity.ts`** (25 lines)
    - Velocity component (vx, vy)

11. **`src/ecs/components/CircleCollider.ts`** (35 lines)
    - Circle collider component

12. **`src/ecs/components/RectCollider.ts`** (35 lines)
    - Rectangle collider component

13. **`src/ecs/components/Renderable.ts`** (30 lines)
    - Renderable component (color, layer)

14. **`src/ecs/components/PlayerController.ts`** (45 lines)
    - Player controller component

15. **`src/ecs/components/Platform.ts`** (30 lines)
    - Platform tag component

16. **`src/ecs/components/CameraTarget.ts`** (20 lines)
    - Camera target tag component

17. **`src/ecs/components/index.ts`** (30 lines)
    - Export all components

18. **`src/ecs/prefabs/PlayerPrefab.ts`** (60 lines)
    - Factory function to create player entity
    - Adds all player components

19. **`src/ecs/prefabs/PlatformPrefab.ts`** (50 lines)
    - Factory function to create platform entity
    - Adds all platform components

20. **`src/ecs/prefabs/index.ts`** (15 lines)
    - Export all prefabs

**Phase 3: ECS Systems**

21. **`src/ecs/systems/PlayerInputSystem.ts`** (120 lines)
    - Reads input from InputController
    - Applies acceleration/velocity to player entity
    - Queries: Transform, Velocity, PlayerController

22. **`src/ecs/systems/PhysicsSystem.ts`** (200 lines)
    - Apply gravity and velocity to all physical entities
    - Update positions from velocity
    - Queries: Transform, Velocity

23. **`src/ecs/systems/CollisionSystem.ts`** (250 lines)
    - Detect collisions between entities with colliders
    - Resolve collisions using existing CollisionDetector/Resolver
    - Queries: Transform, CircleCollider/RectCollider

24. **`src/ecs/systems/GroundDetectionSystem.ts`** (100 lines)
    - Raycast ground detection for player
    - Updates PlayerController.isGrounded
    - Queries: Transform, PlayerController, CircleCollider

25. **`src/ecs/systems/BoundaryCollisionSystem.ts`** (80 lines)
    - Handle left/right boundary collisions
    - Stop horizontal velocity at screen edges
    - Queries: Transform, Velocity, CircleCollider

26. **`src/ecs/systems/RenderSystem.ts`** (150 lines)
    - Render all entities with Renderable component
    - Sort by layer, draw circles/rects based on collider type
    - Queries: Transform, Renderable, CircleCollider/RectCollider

27. **`src/ecs/systems/CameraFollowSystem.ts`** (100 lines)
    - Update Camera to follow CameraTarget entity
    - Queries: Transform, CameraTarget

28. **`src/ecs/systems/PlatformSpawnSystem.ts`** (180 lines)
    - Spawn platforms ahead of player using PlatformPrefab
    - Despawn platforms below camera
    - Queries: Transform, CameraTarget, Platform

29. **`src/ecs/systems/index.ts`** (40 lines)
    - Export all systems

30. **`src/ecs/index.ts`** (40 lines)
    - Main ECS module exports

### Files to Modify

**Phase 2: Integration with existing game**

31. **`src/core/Game.ts`** (complete refactor, ~300 lines)
    - Replace Player/Platform instances with ECS entities
    - Create ECSWorld instance
    - Register and schedule all systems
    - Remove direct Player/Platform manipulation
    - Update render loop to use RenderSystem
    - Update update loop to use SystemScheduler

**Phase 3: System cleanup**

32. **`src/systems/Camera.ts`** (minor changes)
    - Keep Camera class but expose position/transform for ECS access
    - Add method to set target from entity Transform component

33. **`src/systems/PlatformSpawner.ts`** (deprecate)
    - Mark for removal (functionality moves to PlatformSpawnSystem)
    - Keep temporarily for reference

34. **`src/systems/ScoreSystem.ts`** (modify)
    - Update to read player position from ECS query instead of Player object

35. **`src/systems/physics/PhysicsSystem.ts`** (deprecate)
    - Mark for removal (functionality moves to ECS PhysicsSystem)

36. **`src/core/World.ts`** (deprecate)
    - Mark for removal (replaced by ECSWorld)

### Files to Delete (Phase 3 cleanup)

37. **`src/core/Player.ts`** - Remove after migration to ECS
38. **`src/entities/Platform.ts`** - Remove after migration to ECS
39. **`src/core/World.ts`** - Remove after migration to ECSWorld
40. **`src/systems/PlatformSpawner.ts`** - Remove after migration to PlatformSpawnSystem
41. **`src/systems/physics/PhysicsSystem.ts`** - Remove after migration to ECS PhysicsSystem

## Functions

New functions and modifications for ECS architecture.

### New Functions

**SparseSet methods** (`src/ecs/SparseSet.ts`):
- `add(entity: Entity, component: T): void` - Add component to entity
- `remove(entity: Entity): void` - Remove component from entity
- `get(entity: Entity): T | undefined` - Get component for entity
- `has(entity: Entity): boolean` - Check if entity has component
- `entities(): Entity[]` - Get all entities with this component
- `clear(): void` - Remove all components
- `size(): number` - Get component count

**EntityManager methods** (`src/ecs/EntityManager.ts`):
- `create(): Entity` - Create new entity, returns ID
- `destroy(entity: Entity): void` - Destroy entity
- `isAlive(entity: Entity): boolean` - Check if entity exists
- `getEntityCount(): number` - Get total entity count

**ComponentRegistry methods** (`src/ecs/ComponentRegistry.ts`):
- `register<T>(componentClass: ComponentClass<T>): void` - Register component type
- `add<T>(entity: Entity, component: T): void` - Add component to entity
- `remove<T>(entity: Entity, type: ComponentType<T>): void` - Remove component
- `get<T>(entity: Entity, type: ComponentType<T>): T | undefined` - Get component
- `has<T>(entity: Entity, type: ComponentType<T>): boolean` - Check component
- `getEntitiesWithComponent(type: ComponentType): Entity[]` - Get all entities with component
- `removeAllComponents(entity: Entity): void` - Remove all components from entity

**Query methods** (`src/ecs/Query.ts`):
- `execute(registry: ComponentRegistry, query: Query): QueryResult` - Execute query
- `matchesEntity(registry: ComponentRegistry, entity: Entity, query: Query): boolean` - Check if entity matches query

**ECSWorld methods** (`src/ecs/ECSWorld.ts`):
- `createEntity(): Entity` - Create entity
- `destroyEntity(entity: Entity): void` - Destroy entity
- `addComponent<T>(entity: Entity, component: T): void` - Add component
- `removeComponent<T>(entity: Entity, type: ComponentType<T>): void` - Remove component
- `getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined` - Get component
- `hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean` - Check component
- `query(query: Query): Entity[]` - Execute query
- `clear(): void` - Clear all entities and components

**SystemScheduler methods** (`src/ecs/SystemScheduler.ts`):
- `addSystem(system: System): void` - Add system (order matters)
- `removeSystem(system: System): void` - Remove system
- `update(dt: number, world: ECSWorld): void` - Update all systems
- `getSystem<T extends System>(systemClass: SystemClass): T | undefined` - Get system instance

**Prefab functions** (`src/ecs/prefabs/`):
- `createPlayer(world: ECSWorld, x: number, y: number): Entity` - Create player entity with all components
- `createPlatform(world: ECSWorld, x: number, y: number, width: number, height: number): Entity` - Create platform entity

### Modified Functions

**Game.update()** (`src/core/Game.ts`):
- **Before**: Manually updates player, platforms, physics, camera
- **After**: Calls `systemScheduler.update(dt, ecsWorld)` which orchestrates all system updates

**Game.render()** (`src/core/Game.ts`):
- **Before**: Manually calls `player.render()`, `world.render()`, etc.
- **After**: RenderSystem handles all rendering via ECS queries

**Game.initialize()** (`src/core/Game.ts`):
- **Before**: Creates Player and Platform instances
- **After**: Creates ECS entities using prefabs

**Camera.update()** (`src/systems/Camera.ts`):
- **Before**: Takes Vec2 position parameter
- **After**: Can take Transform component or Vec2 (backwards compatible)

## Classes

New classes and modifications for ECS architecture.

### New Classes

**Core ECS Classes**:

1. **`SparseSet<T>`** (`src/ecs/SparseSet.ts`)
   - Generic sparse set implementation
   - Fields: `sparse: (number | undefined)[]`, `dense: Entity[]`, `components: T[]`
   - Methods: add, remove, get, has, entities, clear, size
   - Performance: O(1) all operations, cache-friendly iteration

2. **`EntityManager`** (`src/ecs/EntityManager.ts`)
   - Manages entity IDs and lifecycle
   - Fields: `nextEntityId: number`, `activeEntities: Set<Entity>`
   - Methods: create, destroy, isAlive, getEntityCount
   - ID Generation: Simple incrementing counter

3. **`ComponentRegistry`** (`src/ecs/ComponentRegistry.ts`)
   - Stores all component sparse sets
   - Fields: `componentStores: Map<ComponentType, SparseSet<any>>`
   - Methods: register, add, remove, get, has, getEntitiesWithComponent, removeAllComponents
   - Manages component lifecycle for entities

4. **`Query`** (`src/ecs/Query.ts`)
   - Query execution engine
   - Static methods: execute, matchesEntity
   - No instance state (stateless)
   - Computes results on-demand each frame

5. **`ECSWorld`** (`src/ecs/ECSWorld.ts`)
   - Main ECS container
   - Fields: `entityManager: EntityManager`, `componentRegistry: ComponentRegistry`
   - Methods: createEntity, destroyEntity, addComponent, removeComponent, getComponent, hasComponent, query, clear
   - Public API for game code

6. **`System`** (`src/ecs/System.ts`)
   - Abstract base class for systems
   - Fields: `name: string`
   - Methods: update (abstract), onDestroy (optional)
   - Systems extend this and implement update logic

7. **`SystemScheduler`** (`src/ecs/SystemScheduler.ts`)
   - Manages system execution order
   - Fields: `systems: System[]`
   - Methods: addSystem, removeSystem, update, getSystem
   - Executes systems in registration order

**Component Classes** (all in `src/ecs/components/`):

8. **`Transform`** - Position and rotation (x, y, rotation)
9. **`Velocity`** - Movement vector (x, y)
10. **`CircleCollider`** - Circle collision (radius, restitution, friction)
11. **`RectCollider`** - Rectangle collision (width, height, restitution, friction)
12. **`Renderable`** - Visual appearance (color, layer)
13. **`PlayerController`** - Player behavior (gravity, jumpVelocity, acceleration, maxSpeed, isGrounded)
14. **`Platform`** - Platform tag (platformType)
15. **`CameraTarget`** - Camera target tag (empty, just marks entity)

**System Classes** (all in `src/ecs/systems/`):

16. **`PlayerInputSystem`** extends `System`
    - Reads input, applies to player Transform/Velocity
    - Query: [Transform, Velocity, PlayerController]

17. **`PhysicsSystem`** extends `System`
    - Applies gravity and velocity to all entities
    - Query: [Transform, Velocity]

18. **`CollisionSystem`** extends `System`
    - Detects and resolves collisions
    - Queries: [Transform, CircleCollider], [Transform, RectCollider]

19. **`GroundDetectionSystem`** extends `System`
    - Raycasts for ground detection
    - Query: [Transform, PlayerController, CircleCollider]

20. **`BoundaryCollisionSystem`** extends `System`
    - Handles screen boundary collisions
    - Query: [Transform, Velocity, CircleCollider]

21. **`RenderSystem`** extends `System`
    - Renders all visible entities
    - Queries: [Transform, Renderable, CircleCollider], [Transform, Renderable, RectCollider]

22. **`CameraFollowSystem`** extends `System`
    - Updates camera to follow target
    - Query: [Transform, CameraTarget]

23. **`PlatformSpawnSystem`** extends `System`
    - Spawns/despawns platforms
    - Queries: [Transform, CameraTarget], [Transform, Platform]

### Modified Classes

24. **`Game`** (`src/core/Game.ts`)
    - **Add**: `ecsWorld: ECSWorld`, `systemScheduler: SystemScheduler`
    - **Remove**: `player: Player`, `world: World`, `physicsSystem: PhysicsSystem`, `platformSpawner: PlatformSpawner`
    - **Modify**: `initialize()` to create ECS entities, `update()` to use systems, `render()` to use RenderSystem

25. **`Camera`** (`src/systems/Camera.ts`)
    - **Add**: `followTransform(transform: Transform)` method
    - **Keep**: Existing methods for backwards compatibility

26. **`ScoreSystem`** (`src/systems/ScoreSystem.ts`)
    - **Modify**: `update()` to query ECS for player position instead of using Player object

### Classes to Deprecate (Phase 3)

27. **`Player`** - Replaced by ECS entity with components
28. **`Platform`** - Replaced by ECS entity with components
29. **`World`** - Replaced by ECSWorld
30. **`PlatformSpawner`** - Replaced by PlatformSpawnSystem
31. **`PhysicsSystem`** (old OOP version) - Replaced by ECS PhysicsSystem

## Dependencies

No new external dependencies required for ECS implementation.

### Existing Dependencies (unchanged)

All current dependencies remain:
- `typescript` - TypeScript compiler
- `vite` - Build tool
- `@vitejs/plugin-basic-ssl` - HTTPS support for development

### Internal Dependencies

The ECS implementation uses only TypeScript standard library features:
- `Map` for component type storage
- `Set` for entity tracking
- Arrays for sparse set implementation
- No external ECS libraries (custom implementation)

### Why No External ECS Libraries?

1. **Educational**: Building from scratch provides deep understanding
2. **Performance**: Custom implementation optimized for this specific game
3. **Control**: Full control over memory layout and iteration patterns
4. **Size**: Zero bundle size overhead from external libraries
5. **Simplicity**: Minimal API surface, easier to maintain

### Future Optimization Libraries (optional)

If performance profiling reveals bottlenecks, consider:
- `@webassembly/wasm` - For hot paths in collision detection
- Performance.now() for profiling (already available in browser)
- Chrome DevTools for memory profiling

## Testing

Testing strategy for ECS implementation with focus on correctness and performance.

### Unit Tests (to be created)

**Phase 1: Core ECS Tests**

1. **SparseSet Tests** (`tests/ecs/SparseSet.test.ts`)
   - Test add/remove/get/has operations
   - Test O(1) performance with 10,000 entities
   - Test iterator returns correct entities
   - Test clear removes all components
   - Test edge cases (remove non-existent entity, double add)

2. **EntityManager Tests** (`tests/ecs/EntityManager.test.ts`)
   - Test entity creation returns unique IDs
   - Test entity destruction
   - Test isAlive after create/destroy
   - Test ID monotonic increase
   - Test 100,000 entity creation/destruction

3. **ComponentRegistry Tests** (`tests/ecs/ComponentRegistry.test.ts`)
   - Test register/add/remove/get component
   - Test multiple component types per entity
   - Test removeAllComponents
   - Test getEntitiesWithComponent returns correct set
   - Test component isolation (entity A component doesn't affect entity B)

4. **Query Tests** (`tests/ecs/Query.test.ts`)
   - Test query with single component
   - Test query with multiple components (AND logic)
   - Test query with exclusion (without clause)
   - Test empty query result
   - Test query performance with 10,000 entities

5. **ECSWorld Tests** (`tests/ecs/ECSWorld.test.ts`)
   - Test entity lifecycle (create/destroy)
   - Test component lifecycle (add/remove/get)
   - Test query execution
   - Test clear removes all data
   - Integration test: create 1000 entities with components, query, destroy

6. **SystemScheduler Tests** (`tests/ecs/SystemScheduler.test.ts`)
   - Test system registration order
   - Test system update called in correct order
   - Test system removal
   - Test system enable/disable (if implemented)

**Phase 2: Component and System Tests**

7. **Component Tests** (`tests/ecs/components/*.test.ts`)
   - Test component construction with default values
   - Test component type constants are unique
   - Test component serialization (if needed)

8. **Prefab Tests** (`tests/ecs/prefabs/*.test.ts`)
   - Test createPlayer creates entity with correct components
   - Test createPlatform creates entity with correct components
   - Test prefabs create valid entities

9. **System Tests** (`tests/ecs/systems/*.test.ts`)
   - Test PlayerInputSystem applies input to velocity
   - Test PhysicsSystem updates positions from velocity
   - Test CollisionSystem detects collisions
   - Test GroundDetectionSystem sets isGrounded correctly
   - Test RenderSystem renders all entities (mock renderer)
   - Test each system in isolation with mock ECSWorld

**Phase 3: Integration Tests**

10. **Game Integration Tests** (`tests/integration/game-ecs.test.ts`)
    - Test complete game loop with ECS
    - Test player movement matches old OOP behavior
    - Test platform collisions work correctly
    - Test camera follows player entity
    - Test platform spawning/despawning
    - Test score system reads player position

### Manual Testing

**Performance Testing**:
1. **Baseline**: Measure current FPS with 500 platforms, 1 player
2. **Phase 1**: Verify ECS core has no performance regressions
3. **Phase 2**: Measure FPS with ECS entities (should match baseline)
4. **Phase 3**: Measure FPS with all systems (target: ≥60 FPS, ideally better)
5. **Stress Test**: 10,000 entities, verify performance remains acceptable

**Functional Testing**:
1. Test player movement (WASD/arrows)
2. Test player jumping and gravity
3. Test platform collisions
4. Test screen boundary collisions
5. Test camera following
6. Test platform spawning as player climbs
7. Test pause/resume functionality
8. Test game over and restart
9. Test mobile controls (touch/accelerometer)
10. Test all debug visualizations

**Regression Testing**:
- Compare gameplay feel to original OOP version
- Verify no visual glitches
- Verify consistent frame times (no stuttering)
- Verify memory usage doesn't increase significantly

### Performance Benchmarks

**Target Metrics**:
- Entity creation: <0.01ms per entity
- Component add/remove: <0.001ms per operation
- Query execution: <0.1ms for 1000 entities
- System update: <1ms per system per frame (60 FPS = 16.67ms budget)
- Memory usage: <10MB for 10,000 entities with 5 components each

**Profiling Tools**:
- Chrome DevTools Performance tab
- Memory snapshots before/after phases
- FPS counter (already implemented in game)
- Custom timing for system execution

### Validation Approach

**Per-Phase Validation**:
- **Phase 1**: Unit tests pass, performance benchmarks meet targets
- **Phase 2**: Game runs with hybrid OOP/ECS, no regressions
- **Phase 3**: Full ECS, all systems work, performance improved

**Acceptance Criteria**:
- ✅ All unit tests pass
- ✅ Game maintains 60 FPS with 500+ entities
- ✅ No visual or gameplay regressions
- ✅ Memory usage stable (no leaks)
- ✅ Code is maintainable and documented

## Implementation Order

Phased implementation approach to maintain working game throughout migration.

### Phase 1: ECS Core Infrastructure (Days 1-3)

**Goal**: Build and test core ECS foundation without modifying existing game code.

**Step 1.1**: Create type definitions
- Create `src/ecs/types.ts`
- Define Entity, ComponentType, Query, System interfaces
- Document all types thoroughly

**Step 1.2**: Implement SparseSet
- Create `src/ecs/SparseSet.ts`
- Implement sparse array and dense array storage
- Add add/remove/get/has/entities/clear/size methods
- Write unit tests for SparseSet
- Verify O(1) performance

**Step 1.3**: Implement EntityManager
- Create `src/ecs/EntityManager.ts`
- Implement incrementing ID generation
- Add create/destroy/isAlive methods
- Write unit tests for EntityManager

**Step 1.4**: Implement ComponentRegistry
- Create `src/ecs/ComponentRegistry.ts`
- Implement component type registration
- Create SparseSet per component type
- Add add/remove/get/has methods
- Write unit tests for ComponentRegistry

**Step 1.5**: Implement Query system
- Create `src/ecs/Query.ts`
- Implement query execution logic
- Add support for with/without clauses
- Write unit tests for Query
- Benchmark query performance

**Step 1.6**: Implement ECSWorld
- Create `src/ecs/ECSWorld.ts`
- Integrate EntityManager and ComponentRegistry
- Expose public API for entity/component management
- Add query method
- Write integration tests for ECSWorld

**Step 1.7**: Implement SystemScheduler
- Create `src/ecs/SystemScheduler.ts`
- Add system registration and ordering
- Implement update loop that calls all systems
- Write unit tests for SystemScheduler

**Step 1.8**: Create base System class
- Create `src/ecs/System.ts`
- Define System interface
- Add helper methods for common queries
- Document system lifecycle

**Phase 1 Validation**:
- All unit tests pass (100% coverage for core ECS)
- Performance benchmarks meet targets
- Zero impact on existing game (no code changes to Game.ts yet)

### Phase 2: Component Definitions & Entity Migration (Days 4-7)

**Goal**: Create component definitions, prefabs, and migrate Player/Platform to ECS entities while maintaining game functionality.

**Step 2.1**: Create component classes
- Create all component files in `src/ecs/components/`
- Implement Transform, Velocity, CircleCollider, RectCollider, Renderable, PlayerController, Platform, CameraTarget
- Add component type constants
- Create `src/ecs/components/index.ts` to export all

**Step 2.2**: Create prefab factories
- Create `src/ecs/prefabs/PlayerPrefab.ts`
- Create `src/ecs/prefabs/PlatformPrefab.ts`
- Implement createPlayer() and createPlatform() functions
- Write tests for prefabs

**Step 2.3**: Create initial ECS systems (subset)
- Create `src/ecs/systems/RenderSystem.ts` (for visual feedback)
- Create simple test system to verify ECS pipeline works
- Keep logic minimal, just prove entities can be queried and rendered

**Step 2.4**: Integrate ECSWorld into Game (parallel mode)
- Modify `src/core/Game.ts` to create ECSWorld instance
- Keep existing Player/Platform objects
- Create ECS entities alongside OOP objects
- Render both OOP and ECS entities (dual mode for testing)
- Verify ECS entities render correctly

**Step 2.5**: Implement basic ECS systems
- Create `src/ecs/systems/PhysicsSystem.ts`
- Create `src/ecs/systems/PlayerInputSystem.ts`
- Systems should mirror OOP behavior exactly
- Test in isolation with mock entities

**Step 2.6**: Switch to ECS for Player
- Use ECS player entity instead of Player class
- Remove Player class instantiation from Game.ts
- Keep Platform as OOP for now
- Test game still works with hybrid approach

**Step 2.7**: Switch to ECS for Platforms
- Use ECS platform entities instead of Platform class
- Remove World class usage
- Remove Platform class instantiation
- Test platform collisions work correctly

**Phase 2 Validation**:
- Game runs at same FPS as before
- Player movement feels identical
- Platform collisions work correctly
- All debug visualizations still work
- No visual or gameplay regressions

### Phase 3: Complete System Migration (Days 8-12)

**Goal**: Migrate all remaining systems to ECS and remove old OOP code.

**Step 3.1**: Create remaining ECS systems
- Create `src/ecs/systems/CollisionSystem.ts`
- Create `src/ecs/systems/GroundDetectionSystem.ts`
- Create `src/ecs/systems/BoundaryCollisionSystem.ts`
- Create `src/ecs/systems/CameraFollowSystem.ts`
- Create `src/ecs/systems/PlatformSpawnSystem.ts`
- Write unit tests for each system

**Step 3.2**: Set up SystemScheduler in Game
- Create SystemScheduler instance in Game.ts
- Register all systems in correct order:
  1. PlayerInputSystem (read input)
  2. PhysicsSystem (apply forces, update positions)
  3. BoundaryCollisionSystem (screen edges)
  4. CollisionSystem (entity collisions)
  5. GroundDetectionSystem (raycast ground)
  6. CameraFollowSystem (update camera)
  7. PlatformSpawnSystem (spawn/despawn platforms)
  8. RenderSystem (draw everything)

**Step 3.3**: Migrate Game.update() to use SystemScheduler
- Replace manual update calls with `systemScheduler.update(dt, ecsWorld)`
- Remove all direct entity manipulation
- Keep input command handling (pause, restart, etc.)
- Verify game loop still runs at 60 FPS

**Step 3.4**: Migrate Game.render() to use RenderSystem
- Remove manual render calls
- RenderSystem handles all entity rendering
- Keep UI rendering (HUD, buttons, debug overlay)
- Camera transform still managed by Camera class

**Step 3.5**: Update ScoreSystem for ECS
- Modify ScoreSystem.update() to query ECS for player position
- Use `world.query({ with: [CameraTarget.type, Transform.type] })`
- Get Transform component from player entity
- Test score updates correctly as player climbs

**Step 3.6**: Update Camera integration
- Add Camera.followTransform() method
- CameraFollowSystem uses this to update camera
- Keep Camera class (not part of ECS, used by all systems)
- Verify smooth camera following

**Step 3.7**: Clean up deprecated code
- Delete `src/core/Player.ts`
- Delete `src/entities/Platform.ts`
- Delete `src/core/World.ts`
- Delete `src/systems/PlatformSpawner.ts`
- Delete old `src/systems/physics/PhysicsSystem.ts`
- Remove unused imports from Game.ts

**Step 3.8**: Final integration testing
- Test all game features work
- Test pause/resume
- Test restart
- Test game over
- Test mobile controls
- Test debug visualizations
- Performance profiling (should be ≥60 FPS)

**Phase 3 Validation**:
- All deprecated code removed
- Game fully running on ECS
- 60 FPS maintained with 500+ entities
- All features work (no regressions)
- Code is clean and well-documented
- Memory usage stable (no leaks)

### Post-Implementation Tasks

**Documentation**:
- Update architecture.md to describe ECS architecture
- Add ECS examples to README
- Document component types and their usage
- Document system order and dependencies
- Add performance profiling results

**Performance Optimization (if needed)**:
- Profile system execution times
- Identify bottlenecks
- Consider query caching if queries are slow
- Consider spatial partitioning for collision detection
- Optimize component iteration patterns

**Future Enhancements**:
- Add more component types (Health, Damage, PowerUp, etc.)
- Implement entity pooling for frequent spawn/despawn
- Add system groups for parallel execution
- Implement event system for entity communication
- Add entity serialization for save/load
- Consider archetype storage if component combinations are fixed

## Commands to Read Implementation Plan Sections

Use these commands during implementation to read specific sections:

```bash
# Read Overview section
sed -n '/## Overview/,/## Types/p' implementation_plan.md | head -n -1 | cat

# Read Types section
sed -n '/## Types/,/## Files/p' implementation_plan.md | head -n -1 | cat

# Read Files section
sed -n '/## Files/,/## Functions/p' implementation_plan.md | head -n -1 | cat

# Read Functions section
sed -n '/## Functions/,/## Classes/p' implementation_plan.md | head -n -1 | cat

# Read Classes section
sed -n '/## Classes/,/## Dependencies/p' implementation_plan.md | head -n -1 | cat

# Read Dependencies section
sed -n '/## Dependencies/,/## Testing/p' implementation_plan.md | head -n -1 | cat

# Read Testing section
sed -n '/## Testing/,/## Implementation Order/p' implementation_plan.md | head -n -1 | cat

# Read Implementation Order section
sed -n '/## Implementation Order/,$p' implementation_plan.md | cat
```

## Summary

This implementation plan provides a complete roadmap for migrating the game to ECS architecture. The phased approach ensures the game remains playable throughout development, with each phase validated before moving to the next. The ECS implementation uses sparse sets for optimal performance, maintains the existing 60 FPS target, and provides a foundation for future game features.

**Total Estimated Time**: 12-15 days for complete migration
**Total New Code**: ~3,500 lines (ECS core + components + systems)
**Code Removed**: ~800 lines (deprecated OOP classes)
**Net Change**: +2,700 lines (but more maintainable and performant)

**Key Success Metrics**:
- ✅ 60 FPS maintained with 500+ entities
- ✅ Zero gameplay regressions
- ✅ Clean, documented code
- ✅ All tests passing
- ✅ Memory usage stable
