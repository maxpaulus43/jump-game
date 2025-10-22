# Implementation Plan: Camera System for Vertical Player Tracking

## [Overview]

Add a camera system that smoothly follows the player vertically as they bounce higher in the world, starting only when the player exceeds the screen center threshold.

The current game renders all entities in world-space coordinates directly to the screen. This implementation will introduce a Camera class that translates world coordinates to screen coordinates, enabling infinite vertical scrolling. The camera will use lerp-based smoothing for a polished feel, track only vertical movement (Y-axis), and activate when the player bounces above the screen's vertical center. This system integrates with the existing renderer by applying a transform offset before all rendering operations, maintaining the current architecture while adding scrolling capability.

## [Types]

Define camera configuration and state types to manage camera behavior and integration with existing systems.

**New Type Definitions:**

```typescript
// src/types/camera.ts

/**
 * Camera configuration options
 */
export interface CameraConfig {
  /** Lerp factor for smooth following (0-1, higher = faster) */
  smoothing?: number;
  /** Y position threshold to start following (relative to screen height) */
  followThreshold?: number;
  /** Whether camera is currently active */
  enabled?: boolean;
}

/**
 * Camera bounds for limiting camera movement
 */
export interface CameraBounds {
  minY: number;
  maxY: number;
}

/**
 * Camera interface for rendering systems
 */
export interface Camera {
  /** Get current camera Y offset in world space */
  getOffsetY(): number;
  /** Update camera position based on target */
  update(dt: number, targetY: number): void;
  /** Apply camera transform to renderer context */
  applyTransform(ctx: CanvasRenderingContext2D): void;
  /** Reset camera transform */
  resetTransform(ctx: CanvasRenderingContext2D): void;
  /** Get camera position */
  getPosition(): { x: number; y: number };
  /** Set camera bounds */
  setBounds(bounds: CameraBounds): void;
  /** Check if camera is following target */
  isFollowing(): boolean;
}
```

**Type Updates:**

```typescript
// src/types/index.ts - Add camera exports
export * from './camera.js';
```

## [Files]

Create new camera system file and modify existing files to integrate camera transforms.

**New Files:**

- `src/systems/Camera.ts` - Main camera class implementing smooth vertical tracking with threshold-based activation

**Modified Files:**

- `src/core/Game.ts` - Add camera instantiation, update loop integration, and pass camera to renderer
- `src/systems/HTMLCanvasRenderer.ts` - Add camera transform application before rendering
- `src/types/renderer.ts` - Update Renderer interface to accept optional camera parameter
- `src/types/index.ts` - Export new camera types

**No Files Deleted or Moved**

## [Functions]

Add camera-specific methods and integrate camera updates into the game loop.

**New Functions:**

- `Camera.constructor(config: CameraConfig, screenHeight: number)` in `src/systems/Camera.ts`
  - Initialize camera with smoothing factor (0.1 for minimal lag), follow threshold (screenHeight / 2), and starting position
- `Camera.update(dt: number, targetY: number)` in `src/systems/Camera.ts`
  - Check if target Y is above follow threshold, if so activate following
  - Apply lerp smoothing: `currentY += (targetY - currentY) * smoothing`
  - Clamp to camera bounds if set
- `Camera.applyTransform(ctx: CanvasRenderingContext2D)` in `src/systems/Camera.ts`
  - Save current transform state
  - Translate context by camera offset: `ctx.translate(0, -offsetY)`
- `Camera.resetTransform(ctx: CanvasRenderingContext2D)` in `src/systems/Camera.ts`
  - Restore saved transform state
- `Camera.getOffsetY()` in `src/systems/Camera.ts`
  - Return current camera Y position (offset from world origin)
- `Camera.getPosition()` in `src/systems/Camera.ts`
  - Return camera position as `{ x: 0, y: offsetY }`
- `Camera.setBounds(bounds: CameraBounds)` in `src/systems/Camera.ts`
  - Set minimum and maximum Y bounds for camera
- `Camera.isFollowing()` in `src/systems/Camera.ts`
  - Return true if camera has activated (player exceeded threshold)

**Modified Functions:**

- `Game.initialize()` in `src/core/Game.ts`
  - Add camera instantiation: `this.camera = new Camera({ smoothing: 0.1, followThreshold: h / 2 }, h)`
- `Game.update(dt: number)` in `src/core/Game.ts`
  - Add camera update after player update: `this.camera.update(dt, this.player.getPosition().y)`
- `Game.render()` in `src/core/Game.ts`
  - Apply camera transform before world/player rendering
  - Reset transform after entities, before UI rendering
- `HTMLCanvasRenderer.clear()` in `src/systems/HTMLCanvasRenderer.ts`
  - Ensure transform is reset before clearing

**No Functions Removed**

## [Classes]

Add new Camera class following the existing system architecture patterns.

**New Classes:**

- `Camera` class in `src/systems/Camera.ts`
  - Implements `Camera` interface from types
  - Properties:
    - `private position: Vec2` - Current camera position (only Y is used)
    - `private smoothing: number` - Lerp factor for smooth following
    - `private followThreshold: number` - Y threshold to activate following
    - `private isActive: boolean` - Whether camera has started following
    - `private bounds: CameraBounds | null` - Optional camera bounds
    - `private screenHeight: number` - Reference screen height
  - Key Methods:
    - `update(dt, targetY)` - Smooth camera following with threshold check
    - `applyTransform(ctx)` - Apply translation to rendering context
    - `resetTransform(ctx)` - Reset context to identity transform
    - `getOffsetY()` - Get current Y offset for calculations
    - `getPosition()` - Get camera position vector
    - `setBounds(bounds)` - Set min/max Y bounds
    - `isFollowing()` - Check if camera is active

**Modified Classes:**

- `Game` class in `src/core/Game.ts`
  - Add `private camera: Camera` property
  - Initialize camera in `initialize()` method
  - Update camera in `update()` method
  - Apply/reset camera transform in `render()` method

**No Classes Removed**

## [Dependencies]

No new external dependencies required - uses existing Vec2 utility and Canvas API.

All functionality can be implemented using:
- Existing `Vec2` class for position management
- Canvas 2D context transform methods (`translate`, `save`, `restore`)
- TypeScript strict mode typing
- Existing game loop and rendering architecture

## [Testing]

Verify camera behavior through manual testing and ensure compatibility with existing systems.

**Test Scenarios:**

1. **Threshold Activation Test**
   - Start game, player should be at screen center
   - Player should move normally without camera following
   - When player bounces above screen center (Y < screenHeight/2), camera should activate
   - Camera position should start smoothly tracking player Y position

2. **Smooth Following Test**
   - Camera should lag slightly behind player (lerp smoothing)
   - No jerky movements or sudden jumps
   - Camera speed should feel responsive but not instant

3. **Vertical-Only Tracking Test**
   - Move player horizontally - camera should not move
   - Only Y-axis should be affected by camera
   - X-axis rendering should remain unchanged

4. **UI Rendering Test**
   - HUD elements (FPS, controls text) should remain fixed on screen
   - UI should not scroll with camera
   - Debug overlays should render correctly

5. **Boundary Collision Test**
   - Player collision with world boundaries should work correctly
   - Platform collisions should function normally
   - Player physics should be unaffected by camera transform

6. **Edge Cases**
   - Player falling back below threshold - camera should continue following (not reset)
   - Rapid player movement - camera should remain stable
   - Game pause/resume - camera state should persist

**Testing Approach:**

- Use browser dev tools to log camera position
- Add debug visualization showing camera offset (optional)
- Test on different screen sizes to verify threshold calculation
- Verify all existing gameplay features still work correctly

## [Implementation Order]

Follow this sequence to minimize integration conflicts and ensure testable increments.

1. **Create Camera Type Definitions**
   - Create `src/types/camera.ts` with interfaces and types
   - Update `src/types/index.ts` to export camera types
   - Verify types compile without errors

2. **Implement Camera Class**
   - Create `src/systems/Camera.ts` with full implementation
   - Implement constructor with config parameters
   - Implement `update()` with threshold check and lerp smoothing
   - Implement transform methods (`applyTransform`, `resetTransform`)
   - Implement getter methods
   - Test compilation

3. **Integrate Camera into Game Class**
   - Add camera property to Game class
   - Initialize camera in `initialize()` method with screen height
   - Call camera update in game `update()` loop after player update
   - Verify camera instantiation works

4. **Apply Camera Transform to Renderer**
   - Modify `render()` method to apply camera transform before world/player rendering
   - Call `camera.applyTransform(ctx)` after background fill
   - Render world and player (these will be transformed)
   - Call `camera.resetTransform(ctx)` before UI rendering
   - Ensure UI elements render in screen space (not world space)

5. **Test Basic Functionality**
   - Run game and verify compilation
   - Test player movement without camera activation
   - Bounce player above screen center
   - Verify camera starts following
   - Check smooth motion

6. **Refine and Debug**
   - Adjust smoothing factor if needed (currently 0.1)
   - Test edge cases (pause, boundaries, rapid movement)
   - Verify no regressions in existing features
   - Add debug logging if needed

7. **Final Verification**
   - Test complete game loop with camera active
   - Verify all input methods work (keyboard, touch, accelerometer)
   - Check performance (should have minimal impact)
   - Verify UI remains fixed on screen
   - Test on different screen sizes/devices
