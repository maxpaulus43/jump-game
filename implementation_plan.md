# Implementation Plan: Game Architecture Refactoring

## [Overview]

Refactor Game.ts and Player.ts to extract system responsibilities, improving maintainability and extensibility by following Single Responsibility Principle.

The current codebase has Game.ts handling too many responsibilities (~350 lines) including rendering, debug visualization, UI/HUD, input commands, physics orchestration, and platform management. Player.ts also has tight coupling to InputManager through direct input processing. This refactoring will extract these concerns into dedicated systems, reducing the main Game class to ~150 lines of pure orchestration and making each system independently testable and extendable.

The refactoring will be done in phases to minimize risk, starting with the highest-impact changes (Debug and HUD extraction) that provide immediate code clarity benefits, then progressing to deeper architectural improvements (Input abstraction, Physics system, World management).

## [Types]

Define new type definitions and interfaces for the extracted systems.

### New Type Definitions

**src/types/debug.ts** - Debug system types:
```typescript
/**
 * Debug visualization features that can be toggled
 */
export enum DebugFeature {
  Raycasts = 'raycasts',
  Colliders = 'colliders',
  Velocity = 'velocity',
  FPS = 'fps'
}

/**
 * Configuration for debug system
 */
export interface DebugConfig {
  enabled: boolean;
  features: Set<DebugFeature>;
}

/**
 * Debug data passed to debug renderer
 */
export interface DebugData {
  entities: DebugEntity[];
  raycasts: RaycastDebugInfo[];
  fps: number;
}

/**
 * Entity debug information
 */
export interface DebugEntity {
  position: { x: number; y: number };
  velocity?: { x: number; y: number };
  collisionShape: CollisionShape;
  isGrounded?: boolean;
}

/**
 * Raycast debug information
 */
export interface RaycastDebugInfo {
  origin: { x: number; y: number };
  direction: { x: number; y: number };
  maxDistance: number;
  result: RaycastResult;
  color: string;
}
```

**src/types/ui.ts** - UI/HUD system types:
```typescript
/**
 * Game state information for UI rendering
 */
export interface UIGameState {
  fps: number;
  paused: boolean;
  useAccelerometer: boolean;
  showPermissionPrompt: boolean;
  debugEnabled: boolean;
  hasMotionSensors: boolean;
  hasMotionPermission: boolean;
}

/**
 * Configuration for HUD renderer
 */
export interface HUDConfig {
  showFPS: boolean;
  showInstructions: boolean;
  showPauseIndicator: boolean;
}
```

**src/types/input.ts** - Input controller types:
```typescript
/**
 * Input controller interface for entity control
 */
export interface InputController {
  /**
   * Get movement acceleration vector
   * @param dt - Delta time for frame-rate independent input
   * @returns Acceleration vector
   */
  getMovementInput(dt: number): Vec2;
  
  /**
   * Get jump input
   * @returns True if jump input is active
   */
  getJumpInput(): boolean;
  
  /**
   * Get action input (e.g., shoot, interact)
   * @returns True if action input is active
   */
  getActionInput(): boolean;
}

/**
 * Configuration for keyboard controller
 */
export interface KeyboardControllerConfig {
  moveUpKey: string;
  moveDownKey: string;
  moveLeftKey: string;
  moveRightKey: string;
  jumpKey: string;
  actionKey: string;
  acceleration: number;
}

/**
 * Configuration for accelerometer controller
 */
export interface AccelerometerControllerConfig {
  acceleration: number;
  invertX: boolean;
  invertY: boolean;
  deadZone: number;
}
```

**src/types/world.ts** - World/entity management types:
```typescript
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
```

**src/types/physics.ts** - Physics system types:
```typescript
/**
 * Configuration for physics system
 */
export interface PhysicsConfig {
  gravity: Vec2;
  enableCollisions: boolean;
}

/**
 * Physics simulation result
 */
export interface PhysicsResult {
  collisions: CollisionPair[];
}

/**
 * Collision pair information
 */
export interface CollisionPair {
  entityA: Collidable;
  entityB: Collidable;
  result: CollisionResult;
}
```

### Modified Types

**src/types/index.ts** - Add exports for new type files:
```typescript
// Add these exports:
export * from './debug.js';
export * from './ui.js';
export * from './input.js';
export * from './world.js';
export * from './physics.js';
```

## [Files]

Detailed breakdown of file modifications and new file creation.

### New Files to Create

1. **src/systems/DebugSystem.ts** (~150 lines)
   - Purpose: Manages debug visualization state and rendering
   - Handles toggling debug features
   - Collects debug data from entities
   - Renders debug overlays (raycasts, colliders, velocity, grounded status)

2. **src/systems/HUDRenderer.ts** (~120 lines)
   - Purpose: Renders all UI/HUD elements
   - FPS counter display
   - Instruction text
   - Pause indicator
   - Permission prompt messages
   - Separates UI rendering from game logic

3. **src/systems/FPSCounter.ts** (~50 lines)
   - Purpose: Tracks and calculates FPS
   - Frame counting logic
   - FPS calculation with 1-second update interval
   - Provides current FPS value

4. **src/systems/InputCommandHandler.ts** (~80 lines)
   - Purpose: Maps input keys to game commands
   - Registers command callbacks (pause, debug toggle, etc.)
   - Polls input and executes commands
   - Handles debouncing for toggle commands

5. **src/systems/PhysicsSystem.ts** (~100 lines)
   - Purpose: Orchestrates physics simulation
   - Applies gravity to physical entities
   - Detects collisions between entities
   - Resolves collisions using CollisionResolver
   - Configurable gravity settings

6. **src/core/World.ts** (~120 lines)
   - Purpose: Manages all game entities
   - Entity add/remove operations
   - Entity update loop
   - Entity rendering loop
   - Provides filtered entity access (collidables, physical entities)

7. **src/input/InputController.ts** (~30 lines)
   - Purpose: Interface definition for input controllers
   - Pure interface file (TypeScript interface)

8. **src/input/KeyboardController.ts** (~100 lines)
   - Purpose: Keyboard input implementation
   - Reads InputManager for keyboard state
   - Maps keys to movement vectors
   - Configurable key bindings

9. **src/input/AccelerometerController.ts** (~80 lines)
   - Purpose: Accelerometer input implementation
   - Reads InputManager for tilt data
   - Converts tilt to movement vectors
   - Configurable sensitivity and dead zones

10. **src/types/debug.ts** (~80 lines)
    - Purpose: Debug system type definitions

11. **src/types/ui.ts** (~50 lines)
    - Purpose: UI/HUD type definitions

12. **src/types/input.ts** (~80 lines)
    - Purpose: Input controller type definitions

13. **src/types/world.ts** (~60 lines)
    - Purpose: World/entity type definitions

14. **src/types/physics.ts** (~50 lines)
    - Purpose: Physics system type definitions

### Files to Modify

1. **src/core/Game.ts**
   - Remove: Debug visualization code (~50 lines)
   - Remove: HUD/UI rendering code (~80 lines)
   - Remove: FPS tracking code (~10 lines)
   - Remove: Input command handling code (~20 lines)
   - Remove: Platform array management (~15 lines)
   - Remove: Direct collision loop (~15 lines)
   - Add: System initialization (DebugSystem, HUDRenderer, FPSCounter, InputCommandHandler, PhysicsSystem, World)
   - Add: System orchestration in update() and render()
   - Result: Reduce from ~350 lines to ~150 lines

2. **src/core/Player.ts**
   - Remove: `getInputAcceleration()` method
   - Modify: `update()` signature to accept InputController instead of InputManager + useAccelerometer
   - Add: `applyMovementForce()` method to apply processed input
   - Add: Implement Entity and PhysicalEntity interfaces
   - Result: Reduce from ~280 lines to ~200 lines

3. **src/entities/Platform.ts**
   - Add: Implement Entity interface
   - Minor updates to match Entity interface

4. **src/types/index.ts**
   - Add: Export statements for new type files

### Configuration Files

No changes needed to:
- package.json
- tsconfig.json
- vite.config.ts

## [Functions]

Detailed breakdown of new, modified, and removed functions.

### New Functions

**DebugSystem (src/systems/DebugSystem.ts)**:
- `constructor(config: DebugConfig)` - Initialize debug system
- `isEnabled(): boolean` - Check if debug is enabled
- `toggle(feature: DebugFeature): void` - Toggle specific debug feature
- `setEnabled(enabled: boolean): void` - Enable/disable debug system
- `isFeatureEnabled(feature: DebugFeature): boolean` - Check if feature is enabled
- `update(dt: number): void` - Update debug state (placeholder for future)
- `render(renderer: Renderer, debugData: DebugData): void` - Render all debug visualizations
- `private renderRaycasts(renderer: Renderer, raycasts: RaycastDebugInfo[]): void` - Render raycast lines
- `private renderColliders(renderer: Renderer, entities: DebugEntity[]): void` - Render collision shapes
- `private renderGroundedStatus(renderer: Renderer, entities: DebugEntity[], canvasHeight: number): void` - Render grounded text

**HUDRenderer (src/systems/HUDRenderer.ts)**:
- `constructor(config: HUDConfig)` - Initialize HUD renderer
- `render(renderer: Renderer, state: UIGameState): void` - Render all HUD elements
- `renderFPS(renderer: Renderer, fps: number): void` - Render FPS counter
- `renderInstructions(renderer: Renderer, state: UIGameState): void` - Render control instructions
- `renderPauseIndicator(renderer: Renderer, paused: boolean, canvas: HTMLCanvasElement): void` - Render pause overlay
- `renderPermissionPrompt(renderer: Renderer, canvas: HTMLCanvasElement): void` - Render motion permission message

**FPSCounter (src/systems/FPSCounter.ts)**:
- `constructor()` - Initialize counter state
- `update(): void` - Update frame count and calculate FPS
- `getFPS(): number` - Get current FPS value
- `reset(): void` - Reset counter state

**InputCommandHandler (src/systems/InputCommandHandler.ts)**:
- `constructor(inputManager: InputManager)` - Initialize handler
- `registerCommand(key: string, callback: () => void, debounceMs?: number): void` - Register key-to-command mapping
- `unregisterCommand(key: string): void` - Remove command mapping
- `update(): void` - Poll input and execute commands with debouncing
- `private shouldExecute(key: string): boolean` - Check if command should execute (debounce check)

**PhysicsSystem (src/systems/PhysicsSystem.ts)**:
- `constructor(config: PhysicsConfig)` - Initialize physics system
- `update(dt: number, entities: PhysicalEntity[], collidables: Collidable[]): void` - Run physics simulation
- `private applyGravity(entities: PhysicalEntity[], dt: number): void` - Apply gravity to all entities
- `private detectCollisions(collidables: Collidable[]): CollisionPair[]` - Detect all collisions
- `private resolveCollisions(collisions: CollisionPair[]): void` - Resolve detected collisions
- `setGravity(gravity: Vec2): void` - Update gravity configuration

**World (src/core/World.ts)**:
- `constructor()` - Initialize empty world
- `addEntity(entity: Entity): void` - Add entity to world
- `removeEntity(entity: Entity): void` - Remove entity from world
- `getEntities(): Entity[]` - Get all entities
- `getCollidables(): Collidable[]` - Get entities implementing Collidable
- `getPhysicalEntities(): PhysicalEntity[]` - Get entities implementing PhysicalEntity
- `update(dt: number): void` - Update all entities
- `render(renderer: Renderer): void` - Render all entities
- `clear(): void` - Remove all entities

**KeyboardController (src/input/KeyboardController.ts)**:
- `constructor(inputManager: InputManager, config: KeyboardControllerConfig)` - Initialize controller
- `getMovementInput(dt: number): Vec2` - Calculate movement from keyboard
- `getJumpInput(): boolean` - Check jump key state
- `getActionInput(): boolean` - Check action key state

**AccelerometerController (src/input/AccelerometerController.ts)**:
- `constructor(inputManager: InputManager, config: AccelerometerControllerConfig)` - Initialize controller
- `getMovementInput(dt: number): Vec2` - Calculate movement from accelerometer
- `getJumpInput(): boolean` - No jump input for accelerometer
- `getActionInput(): boolean` - No action input for accelerometer

### Modified Functions

**Game.ts**:
- `constructor(canvasId: string)` - Add system initialization
- `initialize(): void` - Simplified to only create player and add to world
- `start(): void` - No changes
- `stop(): void` - No changes
- `update(dt: number): void` - Simplified to system orchestration only
- `render(): void` - Simplified to system orchestration only
- Remove: `requestMotionPermission()` - Move to InputCommandHandler or keep as-is
- Remove: `toggleAccelerometer()` - Move to InputCommandHandler

**Player.ts**:
- `update(dt: number, inputController: InputController, bounds: WorldBounds): void` - Changed signature
- Remove: `getInputAcceleration(inputManager: InputManager, useAccelerometer: boolean): Vec2`
- Add: `applyMovementForce(force: Vec2): void` - New method to apply input forces
- Add: `getVelocity(): Vec2` - Make public for PhysicsSystem (already exists, just make accessible)
- Add: `applyForce(force: Vec2): void` - Implement PhysicalEntity interface

**Platform.ts**:
- Minor signature updates to implement Entity interface properly

### Removed Functions

From **Game.ts**:
- Debug rendering helpers (moved to DebugSystem)
- FPS calculation logic (moved to FPSCounter)
- Input command polling (moved to InputCommandHandler)

From **Player.ts**:
- `getInputAcceleration()` - Replaced by InputController abstraction

## [Classes]

Detailed breakdown of new, modified, and removed classes.

### New Classes

1. **DebugSystem** (src/systems/DebugSystem.ts)
   - Purpose: Centralized debug visualization management
   - Key Methods: toggle(), render(), isFeatureEnabled()
   - Key Properties: config, features (Set<DebugFeature>)
   - Dependencies: Renderer, debug types

2. **HUDRenderer** (src/systems/HUDRenderer.ts)
   - Purpose: UI/HUD rendering system
   - Key Methods: render(), renderFPS(), renderInstructions(), renderPauseIndicator()
   - Key Properties: config
   - Dependencies: Renderer, UI types

3. **FPSCounter** (src/systems/FPSCounter.ts)
   - Purpose: FPS tracking and calculation
   - Key Methods: update(), getFPS(), reset()
   - Key Properties: frameCount, lastUpdate, currentFPS
   - Dependencies: None

4. **InputCommandHandler** (src/systems/InputCommandHandler.ts)
   - Purpose: Maps keyboard input to game commands
   - Key Methods: registerCommand(), update()
   - Key Properties: commands (Map), lastExecutionTime (Map)
   - Dependencies: InputManager

5. **PhysicsSystem** (src/systems/PhysicsSystem.ts)
   - Purpose: Physics simulation orchestration
   - Key Methods: update(), applyGravity(), detectCollisions(), resolveCollisions()
   - Key Properties: config (PhysicsConfig)
   - Dependencies: Vec2, CollisionDetector, CollisionResolver, physics types

6. **World** (src/core/World.ts)
   - Purpose: Entity management and lifecycle
   - Key Methods: addEntity(), removeEntity(), update(), render(), getCollidables()
   - Key Properties: entities (Entity[]), platforms (Platform[])
   - Dependencies: Entity types, Renderer

7. **KeyboardController** (src/input/KeyboardController.ts)
   - Purpose: Keyboard input processing
   - Key Methods: getMovementInput(), getJumpInput(), getActionInput()
   - Key Properties: inputManager, config
   - Dependencies: InputManager, InputController interface

8. **AccelerometerController** (src/input/AccelerometerController.ts)
   - Purpose: Accelerometer input processing
   - Key Methods: getMovementInput(), getJumpInput(), getActionInput()
   - Key Properties: inputManager, config
   - Dependencies: InputManager, InputController interface

### Modified Classes

1. **Game** (src/core/Game.ts)
   - Changes:
     - Add properties: debugSystem, hudRenderer, fpsCounter, inputCommandHandler, physicsSystem, world
     - Remove properties: platforms, frameCount, lastFpsUpdate, currentFps, debugRaycasts
     - Simplify initialize() to only create player
     - Simplify update() to call system updates
     - Simplify render() to call system renders
     - Move platform initialization to World
     - Move input command handling to InputCommandHandler
   - Result: ~150 lines (from ~350)

2. **Player** (src/core/Player.ts)
   - Changes:
     - Implement Entity and PhysicalEntity interfaces
     - Change update() signature: remove inputManager and useAccelerometer params, add inputController
     - Remove getInputAcceleration() method
     - Add applyMovementForce() method
     - Make getVelocity() public
     - Add applyForce() method
     - Update logic to use InputController
   - Result: ~200 lines (from ~280)

3. **Platform** (src/entities/Platform.ts)
   - Changes:
     - Explicitly implement Entity interface
     - Ensure all Entity interface methods are present
   - Result: Minimal changes, mainly type declarations

### No Classes Removed

All existing classes are preserved, just refactored.

## [Dependencies]

No new external dependencies required.

All refactoring uses existing internal dependencies:
- Vec2 utility class
- Renderer for drawing
- InputManager for input state
- CollisionDetector and CollisionResolver for physics
- Existing type definitions

The refactoring creates new internal modules but requires no additional npm packages.

## [Testing]

Testing strategy and validation approach for the refactored code.

### Manual Testing Steps

**Phase 1 - System Extraction Verification**:
1. Start game and verify it runs without errors
2. Test FPS counter display (should match previous behavior)
3. Test debug visualization toggle with 'R' key:
   - Verify raycast lines appear/disappear
   - Verify grounded status text appears/disappear
4. Test pause functionality with 'P' key:
   - Verify pause indicator appears
   - Verify game stops updating but keeps rendering
5. Test HUD instructions display:
   - Verify control instructions appear correctly
   - Verify they update based on input mode (keyboard/accelerometer)

**Phase 2 - Input Controller Verification**:
1. Test keyboard controls (WASD/Arrow keys):
   - Player movement should be identical to before
   - Verify acceleration and max speed feel the same
2. Test accelerometer controls (mobile):
   - Tilt device and verify player moves
   - Verify tilt sensitivity matches previous behavior
3. Test mode toggle with 'T' key:
   - Verify switching between keyboard and accelerometer works
   - Verify instructions update accordingly

**Phase 3 - Physics System Verification**:
1. Test player-platform collisions:
   - Player should land on platforms correctly
   - Verify bounce behavior matches previous behavior
   - Test edge cases (corners, fast movement)
2. Test gravity:
   - Verify player falls at correct rate
   - Verify acceleration feels identical
3. Test boundary collisions:
   - Verify player bounces off screen edges correctly

**Phase 4 - Integration Testing**:
1. Play game for extended period (2-3 minutes)
2. Toggle all debug features multiple times
3. Pause/resume multiple times
4. Switch input modes multiple times
5. Verify no memory leaks (check browser dev tools)
6. Verify FPS remains stable (should stay near 60)

### Automated Testing (Future Enhancement)

While not implemented in this refactor, the new architecture makes automated testing easier:

**Unit Test Candidates**:
- FPSCounter: test FPS calculation accuracy
- InputCommandHandler: test debouncing logic
- KeyboardController/AccelerometerController: test input mapping
- PhysicsSystem: test gravity application and collision detection orchestration

**Integration Test Candidates**:
- World: test entity add/remove/update/render cycles
- Game: test system initialization and orchestration

### Validation Criteria

**Success Criteria**:
- [ ] Game runs without console errors
- [ ] All controls work identically to before refactor
- [ ] Debug visualization matches previous behavior
- [ ] FPS remains stable at 60 FPS
- [ ] No visual glitches or artifacts
- [ ] Pause/resume works correctly
- [ ] Mobile accelerometer controls work (if available)
- [ ] Code is more maintainable (Game.ts reduced to ~150 lines)
- [ ] Systems are independently testable

## [Implementation Order]

Logical sequence of changes to minimize conflicts and ensure successful integration.

### Phase 1: Extract Debug and UI Systems (Lowest Risk, Highest Impact)

**Step 1: Create FPSCounter**
1. Create `src/systems/FPSCounter.ts`
2. Move FPS tracking logic from Game.ts
3. Update Game.ts to use FPSCounter
4. Test: Verify FPS counter displays correctly

**Step 2: Create HUDRenderer**
1. Create `src/types/ui.ts` (UI type definitions)
2. Create `src/systems/HUDRenderer.ts`
3. Move all UI rendering from Game.render() to HUDRenderer
4. Update Game.ts to use HUDRenderer
5. Test: Verify all UI elements display correctly

**Step 3: Create DebugSystem**
1. Create `src/types/debug.ts` (Debug type definitions)
2. Create `src/systems/DebugSystem.ts`
3. Move debug visualization code from Game.ts to DebugSystem
4. Update Game.ts to use DebugSystem
5. Test: Verify debug visualizations work with 'R' key toggle

**Step 4: Create InputCommandHandler**
1. Create `src/systems/InputCommandHandler.ts`
2. Move input command handling from Game.update() to InputCommandHandler
3. Register commands for pause, debug toggle, accelerometer toggle
4. Update Game.ts to use InputCommandHandler
5. Test: Verify all keyboard commands work (P, R, T keys)

**Verification Point**: After Phase 1, Game.ts should be reduced to ~200-220 lines with cleaner separation. All functionality should work identically to before.

### Phase 2: Extract World and Physics Systems (Medium Risk)

**Step 5: Create World**
1. Create `src/types/world.ts` (Entity type definitions)
2. Create `src/core/World.ts`
3. Move platform array from Game.ts to World
4. Update Player and Platform to implement Entity interface
5. Update Game.ts to use World for entity management
6. Test: Verify player and platforms render and update correctly

**Step 6: Create PhysicsSystem**
1. Create `src/types/physics.ts` (Physics type definitions)
2. Create `src/systems/PhysicsSystem.ts`
3. Move collision detection loop from Game.update() to PhysicsSystem
4. Update Player to implement PhysicalEntity interface
5. Update Game.ts to use PhysicsSystem
6. Test: Verify collisions and physics work identically

**Verification Point**: After Phase 2, Game.ts should be ~150-170 lines. All game objects managed through World, all physics through PhysicsSystem.

### Phase 3: Create Input Controller Abstraction (Medium Risk)

**Step 7: Create InputController Interface and Implementations**
1. Create `src/types/input.ts` (InputController type definitions)
2. Create `src/input/` directory
3. Create `src/input/InputController.ts` (interface file)
4. Create `src/input/KeyboardController.ts`
5. Create `src/input/AccelerometerController.ts`
6. Test implementations independently

**Step 8: Refactor Player to Use InputController**
1. Update Player.update() signature to accept InputController
2. Remove getInputAcceleration() method from Player
3. Add applyMovementForce() method to Player
4. Update Game.ts to create appropriate controller and pass to Player
5. Test: Verify player movement works with both keyboard and accelerometer

**Verification Point**: After Phase 3, Player is decoupled from InputManager. Game.ts should be ~150 lines.

### Phase 4: Final Integration and Testing (Low Risk)

**Step 9: Clean Up and Documentation**
1. Update `src/types/index.ts` to export all new types
2. Remove any dead code from Game.ts
3. Add JSDoc comments to all new classes
4. Update README.md with new architecture diagram
5. Run full integration test suite

**Step 10: Performance Verification**
1. Profile game with Chrome DevTools
2. Verify no performance regression
3. Check for memory leaks
4. Verify FPS stability over extended play session

**Final Verification**: Complete manual testing checklist from Testing section. Ensure all success criteria are met.

### Rollback Strategy

Each phase is independent and can be rolled back if issues occur:
- **Phase 1**: Rollback individual systems (FPSCounter, HUDRenderer, etc.) independently
- **Phase 2**: Rollback World and PhysicsSystem together
- **Phase 3**: Rollback InputController changes in Player.ts
- Git commits should be made after each step for easy rollback

### Estimated Time

- Phase 1: 2-3 hours (4 steps)
- Phase 2: 2-3 hours (2 steps)
- Phase 3: 2-3 hours (2 steps)
- Phase 4: 1-2 hours (2 steps)
- **Total**: 7-11 hours of development time

### Success Metrics

- Game.ts reduced from ~350 lines to ~150 lines
- Each system is <150 lines and has single responsibility
- Zero functional regressions
- FPS remains stable at 60
- Code is more maintainable and extensible
