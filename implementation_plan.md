# Implementation Plan: Collision Detection System with Platforms

## Overview

This implementation adds a modular, reusable collision detection system to support platforms that the player can bounce on. The system is designed to be extensible for future features like moving platforms, weak platforms, and powerup platforms while maintaining the existing architecture's principles of performance, type safety, and separation of concerns.

## Context

The current game uses a fixed timestep loop with frame-rate independent physics. The Player class has basic boundary collision detection with bouncing physics. We need to create a collision detection system that:
- Supports multiple entity types (Player, Platform, and future entities)
- Provides reusable collision detection algorithms
- Integrates seamlessly with existing physics simulation
- Follows the zero-allocation performance patterns used by Vec2
- Maintains strict TypeScript typing with no `any` types
- Is extensible for future collision behaviors

The game will have static platforms initially, with the architecture supporting dynamic platforms in the future. Platforms use rectangle collision shapes while the player uses a circle.

## Types

Define comprehensive type system for collision detection, shapes, and collision events.

### Collision Shape Types (`src/types/collision.ts` - new file):

```typescript
/**
 * Types of collision shapes supported
 */
export enum CollisionShapeType {
  Circle = 'circle',
  Rectangle = 'rectangle'
}

/**
 * Base interface for all collision shapes
 */
export interface CollisionShape {
  type: CollisionShapeType;
}

/**
 * Circle collision shape
 */
export interface CircleShape extends CollisionShape {
  type: CollisionShapeType.Circle;
  /** Center position X */
  x: number;
  /** Center position Y */
  y: number;
  /** Radius */
  radius: number;
}

/**
 * Axis-Aligned Bounding Box (rectangle) collision shape
 */
export interface RectangleShape extends CollisionShape {
  type: CollisionShapeType.Rectangle;
  /** Top-left X position */
  x: number;
  /** Top-left Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  /** Whether a collision occurred */
  colliding: boolean;
  /** Penetration depth (how much objects overlap) */
  depth: number;
  /** Normal vector pointing from shape A to shape B (direction to resolve collision) */
  normal: { x: number; y: number };
  /** Contact point (where collision occurred) */
  contactPoint: { x: number; y: number };
}

/**
 * Material properties for collision response
 */
export interface CollisionMaterial {
  /** Bounciness coefficient (0 = no bounce, 1 = perfect bounce) */
  restitution: number;
  /** Friction coefficient (0 = no friction, 1 = full friction) */
  friction: number;
}

/**
 * Interface for entities that can collide
 */
export interface Collidable {
  /** Get the collision shape for this entity */
  getCollisionShape(): CollisionShape;
  /** Get collision material properties */
  getCollisionMaterial(): CollisionMaterial;
  /** Handle collision response */
  onCollision(other: Collidable, result: CollisionResult): void;
}
```

### Platform Configuration Types (`src/types/index.ts` - additions):

```typescript
/**
 * Platform type enumeration for future extensibility
 */
export enum PlatformType {
  Standard = 'standard',
  Moving = 'moving',      // For future use
  Weak = 'weak',          // For future use
  Powerup = 'powerup'     // For future use
}

/**
 * Configuration for creating a platform
 */
export interface PlatformConfig {
  /** Position (top-left corner) */
  position?: { x: number; y: number };
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Platform type */
  type?: PlatformType;
  /** Visual color */
  color?: string;
  /** Collision material properties */
  material?: {
    restitution?: number;
    friction?: number;
  };
}
```

## Files

Detailed breakdown of all file modifications and creations.

### New Files to Create:

1. **`src/types/collision.ts`**
   - Purpose: Central type definitions for collision system
   - Contains: CollisionShapeType enum, shape interfaces, CollisionResult, CollisionMaterial, Collidable interface
   - Exports: All types needed for collision detection

2. **`src/physics/CollisionDetector.ts`**
   - Purpose: Core collision detection algorithms
   - Contains: Static methods for shape-to-shape collision detection
   - Methods: `circleVsCircle()`, `circleVsRectangle()`, `rectangleVsRectangle()`
   - Design: Pure functions with optional output parameters for zero-allocation patterns

3. **`src/physics/CollisionResolver.ts`**
   - Purpose: Handle collision response and physics resolution
   - Contains: Methods to apply impulses, resolve penetration, calculate bounce
   - Methods: `resolveCollision()`, `applyImpulse()`, `separateShapes()`
   - Integrates with entity velocity and position

4. **`src/entities/Platform.ts`**
   - Purpose: Platform entity class
   - Implements: Collidable interface
   - Contains: Position, dimensions, rendering, collision shape generation
   - Configurable: Size, color, material properties, type (for future extension)

### Files to Modify:

1. **`src/types/index.ts`**
   - Add: PlatformType enum
   - Add: PlatformConfig interface
   - Add: Export for `./collision.js` types

2. **`src/core/Player.ts`**
   - Add: Implement Collidable interface
   - Add: `getCollisionShape()` method
   - Add: `getCollisionMaterial()` method
   - Add: `onCollision()` method for handling platform collisions
   - Modify: `handleBoundaryCollisions()` - keep existing but separate from platform collisions
   - Add: `setVelocity()` method for collision response

3. **`src/core/Game.ts`**
   - Add: Array of Platform instances
   - Add: Platform initialization in `initialize()` method
   - Modify: `update()` to check player-platform collisions
   - Modify: `render()` to draw platforms
   - Add: Collision detection loop using CollisionDetector

4. **`src/core/Renderer.ts`**
   - Add: `drawPlatform()` or use existing `drawRect()` - no changes needed actually

### Configuration Files:
- No changes to `package.json`, `tsconfig.json`, or `vite.config.ts` required

## Functions

Detailed breakdown of new and modified functions.

### New Functions in CollisionDetector:

**File**: `src/physics/CollisionDetector.ts`

1. **`static checkCollision(shapeA: CollisionShape, shapeB: CollisionShape, out?: CollisionResult): CollisionResult`**
   - Purpose: Main entry point for collision detection
   - Dispatches to specific shape-vs-shape methods
   - Parameters: Two shapes, optional output result for reuse
   - Returns: CollisionResult with collision data

2. **`static circleVsCircle(circleA: CircleShape, circleB: CircleShape, out?: CollisionResult): CollisionResult`**
   - Purpose: Detect collision between two circles
   - Algorithm: Compare distance between centers to sum of radii
   - Returns: Collision result with depth and normal

3. **`static circleVsRectangle(circle: CircleShape, rect: RectangleShape, out?: CollisionResult): CollisionResult`**
   - Purpose: Detect collision between circle and AABB
   - Algorithm: Find closest point on rectangle to circle center, check distance
   - Returns: Collision result with contact point and penetration

4. **`static rectangleVsRectangle(rectA: RectangleShape, rectB: RectangleShape, out?: CollisionResult): CollisionResult`**
   - Purpose: Detect collision between two AABBs
   - Algorithm: Check overlap on both axes
   - Returns: Collision result with overlap data
   - Note: For future use (not needed immediately)

5. **`static pointVsRectangle(x: number, y: number, rect: RectangleShape): boolean`**
   - Purpose: Helper to check if point is inside rectangle
   - Returns: Boolean

### New Functions in CollisionResolver:

**File**: `src/physics/CollisionResolver.ts`

1. **`static resolveCollision(entityA: Collidable, entityB: Collidable, result: CollisionResult): void`**
   - Purpose: Apply collision response to both entities
   - Handles: Velocity changes, position correction, restitution
   - Mutates: Entity velocities and positions

2. **`static separateShapes(entityA: Collidable, entityB: Collidable, depth: number, normal: { x: number; y: number }): void`**
   - Purpose: Separate overlapping shapes to resolve penetration
   - Moves entities apart along collision normal
   - Used for position correction

3. **`static calculateBounce(velocity: Vec2, normal: Vec2, restitution: number): Vec2`**
   - Purpose: Calculate reflection velocity for bouncing
   - Formula: v' = v - (1 + e) * (v · n) * n
   - Returns: New velocity vector

### Modified Functions in Player:

**File**: `src/core/Player.ts`

1. **`getCollisionShape(): CollisionShape`** (NEW)
   - Purpose: Return circle collision shape for player
   - Returns: CircleShape with current position and radius

2. **`getCollisionMaterial(): CollisionMaterial`** (NEW)
   - Purpose: Return material properties for collision
   - Returns: Material with restitution and friction

3. **`onCollision(other: Collidable, result: CollisionResult): void`** (NEW)
   - Purpose: Handle collision response
   - Updates velocity based on collision normal and restitution
   - Only applies bounce if hitting from above (for platforms)

4. **`setVelocity(velocity: Vec2): void`** (NEW)
   - Purpose: Set velocity from external source (collision response)
   - Parameters: New velocity vector

5. **`update(...)`** (MODIFIED)
   - Remove platform collision logic (will be handled by Game class)
   - Keep boundary collision handling
   - Existing functionality remains unchanged

### New Functions in Platform:

**File**: `src/entities/Platform.ts`

1. **`constructor(config: PlatformConfig)`**
   - Initialize position, dimensions, color, material

2. **`getCollisionShape(): CollisionShape`**
   - Return RectangleShape for collision detection

3. **`getCollisionMaterial(): CollisionMaterial`**
   - Return material properties (restitution, friction)

4. **`onCollision(other: Collidable, result: CollisionResult): void`**
   - For static platforms: do nothing
   - For future moving platforms: could affect platform behavior

5. **`render(renderer: Renderer): void`**
   - Draw platform rectangle using Renderer

6. **`getPosition(): Vec2`**
   - Return position (clone for safety)

7. **`getBounds(): { x: number; y: number; width: number; height: number }`**
   - Return bounding box

### Modified Functions in Game:

**File**: `src/core/Game.ts`

1. **`initialize()`** (MODIFIED)
   - Add platform array initialization
   - Create several platforms at different positions
   - Example: Staircase pattern or scattered platforms

2. **`update(dt: number)`** (MODIFIED)
   - After player update, check collisions with all platforms
   - Use CollisionDetector to check player shape vs platform shapes
   - If collision detected, call onCollision on both entities
   - Apply collision response using CollisionResolver

3. **`render()`** (MODIFIED)
   - Add platform rendering loop
   - Render all platforms before or after player

## Classes

Detailed breakdown of new and modified classes.

### New Classes:

1. **`CollisionDetector`** (`src/physics/CollisionDetector.ts`)
   - Purpose: Static utility class for collision detection
   - Design: Pure functions, no instance state
   - Methods: All static collision detection algorithms
   - Pattern: Similar to Vec2 static utilities
   - Performance: Optional output parameters for zero-allocation

2. **`CollisionResolver`** (`src/physics/CollisionResolver.ts`)
   - Purpose: Static utility class for collision response
   - Design: Pure functions operating on Collidable entities
   - Methods: All static collision resolution algorithms
   - Integrates: With Vec2 for vector math
   - Handles: Velocity changes, position corrections, impulses

3. **`Platform`** (`src/entities/Platform.ts`)
   - Purpose: Represents a platform entity
   - Implements: Collidable interface
   - Properties: position (Vec2), width, height, color, material, type
   - Methods: getCollisionShape(), getCollisionMaterial(), onCollision(), render()
   - Design: Similar structure to Player class
   - Extensibility: Type property allows for future specializations

### Modified Classes:

1. **`Player`** (`src/core/Player.ts`)
   - Changes:
     - Implement Collidable interface
     - Add getCollisionShape() returning CircleShape
     - Add getCollisionMaterial() returning restitution/friction
     - Add onCollision() for collision response
     - Add setVelocity() for external velocity changes
     - Keep existing physics and rendering
   - Integration: Works with collision system while maintaining existing behavior

2. **`Game`** (`src/core/Game.ts`)
   - Changes:
     - Add platforms: Platform[] property
     - Initialize platforms in initialize()
     - Add collision detection loop in update()
     - Add platform rendering in render()
     - Coordinate collision system
   - Remains: Main orchestrator, no major architectural changes

## Dependencies

No new external dependencies required.

### Existing Dependencies (unchanged):
- TypeScript (^5.3.3) - for compilation
- Vite (^7.1.11) - for bundling and dev server
- @vitejs/plugin-basic-ssl (^2.1.0) - for HTTPS in dev mode

### Internal Dependencies (new imports):
- `src/physics/CollisionDetector.ts` - imported by Game.ts
- `src/physics/CollisionResolver.ts` - imported by Game.ts
- `src/entities/Platform.ts` - imported by Game.ts
- `src/types/collision.ts` - imported by Platform.ts, Player.ts, collision modules

## Testing

Comprehensive testing approach for collision system.

### Manual Testing Steps:

1. **Platform Rendering**
   - Verify platforms appear on screen at correct positions
   - Check that platforms have correct size and color
   - Test with different platform configurations

2. **Basic Collision Detection**
   - Drop player onto platform from above
   - Verify player stops on platform (doesn't fall through)
   - Check that collision is detected accurately

3. **Bounce Physics**
   - Jump/fall onto platform
   - Verify player bounces with correct restitution
   - Test velocity preservation in bounce direction

4. **Edge Cases**
   - Land on platform edge
   - Approach platform from side
   - Test with very small/large platforms
   - Test with multiple platforms stacked

5. **Performance**
   - Add many platforms (10-20)
   - Verify FPS stays at 60
   - Check for any frame drops during collisions

6. **Integration**
   - Verify boundary collisions still work
   - Check that keyboard controls work normally
   - Test pause/resume during collision
   - Verify accelerometer controls (if on mobile)

### Test Platform Configurations:

Create diverse platforms in Game.initialize():
```typescript
// Staircase pattern
new Platform({ position: { x: 100, y: 500 }, width: 150, height: 20 })
new Platform({ position: { x: 300, y: 400 }, width: 150, height: 20 })
new Platform({ position: { x: 500, y: 300 }, width: 150, height: 20 })

// Wide base platform
new Platform({ position: { x: 50, y: 600 }, width: 700, height: 30 })

// Small platform (edge case)
new Platform({ position: { x: 400, y: 250 }, width: 50, height: 15 })
```

### Debug Visualization (optional):

Add to Renderer for debugging:
- Draw collision shapes (circles/rectangles) with different colors
- Show collision normals as arrows
- Display collision depth values
- Highlight active collisions

### Unit Testing (for future):

Although not part of initial implementation, design allows for:
- Test individual collision detection algorithms
- Mock Collidable objects for testing
- Verify collision math accuracy
- Test edge cases with known inputs/outputs

## Implementation Order

Sequential steps to minimize conflicts and ensure successful integration.

1. **Create Type Definitions**
   - Create `src/types/collision.ts` with all collision types
   - Modify `src/types/index.ts` to add Platform types and export collision types
   - Rationale: Types must exist before implementing classes that use them

2. **Implement CollisionDetector**
   - Create `src/physics/` directory
   - Implement `src/physics/CollisionDetector.ts` with all detection algorithms
   - Start with `circleVsRectangle()` (most critical for Player-Platform)
   - Add `circleVsCircle()` for completeness
   - Rationale: Detection algorithms are pure functions with no dependencies

3. **Implement Platform Entity**
   - Create `src/entities/` directory
   - Implement `src/entities/Platform.ts` class
   - Implement Collidable interface
   - Add rendering method
   - Rationale: Need Platform before integrating with Game

4. **Modify Player for Collidable Interface**
   - Update `src/core/Player.ts` to implement Collidable
   - Add `getCollisionShape()`, `getCollisionMaterial()`, `onCollision()`
   - Add `setVelocity()` method
   - Keep existing functionality intact
   - Rationale: Player must be Collidable before Game can use collision system

5. **Implement CollisionResolver**
   - Implement `src/physics/CollisionResolver.ts`
   - Add collision response algorithms
   - Use Vec2 for vector math
   - Handle velocity and position changes
   - Rationale: Need resolver before integrating collision responses

6. **Integrate Platforms into Game**
   - Modify `src/core/Game.ts` to add platforms array
   - Initialize platforms in `initialize()` method
   - Add platform rendering in `render()` method
   - Test rendering without collision first
   - Rationale: Verify visual setup before adding collision logic

7. **Add Collision Detection to Game Loop**
   - Modify Game `update()` method
   - Add collision detection loop using CollisionDetector
   - Log collisions initially for verification
   - Don't apply responses yet
   - Rationale: Verify detection works before adding response

8. **Add Collision Response**
   - Call `onCollision()` methods when collisions detected
   - Use CollisionResolver for complex responses
   - Apply velocity and position changes
   - Test bounce physics
   - Rationale: Complete the collision system with responses

9. **Tune and Test**
   - Adjust restitution values for desired bounce feel
   - Test various platform configurations
   - Verify FPS remains stable
   - Check edge cases
   - Rationale: Polish the experience and ensure robustness

10. **Document and Finalize**
    - Add code comments for complex algorithms
    - Update architecture.md if needed
    - Verify all TypeScript strict mode passes
    - Test build process
    - Rationale: Ensure maintainability and completeness

## Performance Considerations

- **Zero-Allocation Patterns**: Use optional output parameters in CollisionDetector methods to reuse CollisionResult objects
- **Early Exit**: Check bounding boxes before expensive collision calculations
- **Spatial Partitioning**: Not needed initially with <20 platforms, but architecture allows future quadtree integration
- **Vec2 Reuse**: Use mutable Vec2 operations in collision response to avoid allocations
- **Fixed Timestep**: Collision detection runs at fixed 60 Hz, preventing inconsistencies

## Future Extensibility

Architecture supports future features:

### Moving Platforms:
- Add velocity property to Platform
- Update position in Platform.update() method
- Collision system already supports dynamic objects

### Platform Types:
- Use PlatformType enum to specialize behavior
- WeakPlatform subclass: breaks after N collisions
- PowerupPlatform subclass: gives player abilities on collision
- onCollision() can have type-specific logic

### Advanced Collision:
- Add polygon collision shapes
- Implement sweep tests for fast-moving objects
- Add trigger volumes (collision without response)

### Spatial Partitioning:
- Add Quadtree or Grid class in src/physics/
- Update Game to use spatial structure
- Optimize for hundreds of entities

### Multiple Collision Layers:
- Add layer/mask system to Collidable
- Filter collisions by layer
- Support player-enemy, player-bullet, etc.
