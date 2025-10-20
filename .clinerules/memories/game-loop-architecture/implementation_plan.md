# Implementation Plan

## Overview
Create a frame-rate independent game loop architecture for a top-down bullet heaven roguelite game using TypeScript and Canvas.

This implementation establishes a robust foundation for a bullet heaven roguelite game with a fixed timestep game loop that ensures consistent gameplay across different frame rates. The architecture follows SOLID principles with clear separation of concerns: the Game class orchestrates high-level flow, the GameLoop class manages timing and updates, the Renderer handles all drawing operations, and the InputManager processes player input. This modular design allows for easy extension as game features are added (entities, weapons, enemies, etc.) while maintaining code organization and testability.

## Types
Define core interfaces and types for the game loop system.

```typescript
// Core timing configuration
interface GameLoopConfig {
  targetFPS: number;           // Target frames per second (e.g., 60)
  maxDeltaTime: number;        // Maximum time step to prevent spiral of death (e.g., 0.25s)
}

// Game state for update/render cycle
interface GameState {
  running: boolean;
  paused: boolean;
  lastTimestamp: number;
  accumulator: number;
}

// Input state tracking
interface InputState {
  keys: Map<string, boolean>;
  mouse: {
    x: number;
    y: number;
    buttons: Map<number, boolean>;
  };
}

// Vector2D for positions and velocities
interface Vector2D {
  x: number;
  y: number;
}

// Canvas context wrapper
interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}
```

## Files
Organize code into focused, single-responsibility modules.

**New files to create:**
- `src/core/GameLoop.ts` - Fixed timestep game loop implementation
- `src/core/Game.ts` - Main game orchestrator class
- `src/core/Renderer.ts` - Canvas rendering management
- `src/core/InputManager.ts` - Keyboard and mouse input handling
- `src/types/index.ts` - Type definitions and interfaces
- `src/utils/Vector2D.ts` - Vector math utilities
- `tsconfig.json` - TypeScript compiler configuration

**Existing files to modify:**
- `index.ts` - Replace console.log with game initialization
- `index.html` - Add canvas element to body
- `css/style.css` - Add canvas styling (full viewport, no margins)
- `package.json` - Add TypeScript and build scripts

**Directory structure:**
```
/Users/maxpaulu/c/game-ts/
├── src/
│   ├── core/
│   │   ├── Game.ts
│   │   ├── GameLoop.ts
│   │   ├── Renderer.ts
│   │   └── InputManager.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── Vector2D.ts
├── css/
│   └── style.css
├── index.ts
├── index.html
├── package.json
└── tsconfig.json
```

## Functions
Define key functions for each class with clear responsibilities.

**GameLoop class:**
- `constructor(config: GameLoopConfig)` - Initialize loop with timing configuration
- `start(updateFn: (dt: number) => void, renderFn: () => void): void` - Begin the game loop
- `stop(): void` - Halt the game loop
- `pause(): void` - Pause game updates but continue rendering
- `resume(): void` - Resume game updates
- `private loop(timestamp: number): void` - Main RAF callback with fixed timestep logic

**Game class:**
- `constructor(canvasId: string)` - Initialize game with canvas reference
- `start(): void` - Start the game
- `stop(): void` - Stop the game
- `private update(dt: number): void` - Update game state (called by GameLoop)
- `private render(): void` - Render current frame (called by GameLoop)
- `private initialize(): void` - Set up initial game state

**Renderer class:**
- `constructor(canvas: HTMLCanvasElement)` - Initialize with canvas element
- `clear(): void` - Clear the canvas
- `getContext(): RenderContext` - Get rendering context
- `resize(): void` - Handle canvas resize
- `drawRect(x: number, y: number, width: number, height: number, color: string): void` - Draw rectangle
- `drawCircle(x: number, y: number, radius: number, color: string): void` - Draw circle

**InputManager class:**
- `constructor()` - Initialize input tracking
- `initialize(): void` - Set up event listeners
- `isKeyPressed(key: string): boolean` - Check if key is currently pressed
- `isMouseButtonPressed(button: number): boolean` - Check if mouse button is pressed
- `getMousePosition(): Vector2D` - Get current mouse position
- `private handleKeyDown(event: KeyboardEvent): void` - Key press handler
- `private handleKeyUp(event: KeyboardEvent): void` - Key release handler
- `private handleMouseMove(event: MouseEvent): void` - Mouse move handler
- `private handleMouseDown(event: MouseEvent): void` - Mouse button press handler
- `private handleMouseUp(event: MouseEvent): void` - Mouse button release handler

**Vector2D utility:**
- `static add(a: Vector2D, b: Vector2D): Vector2D` - Add two vectors
- `static subtract(a: Vector2D, b: Vector2D): Vector2D` - Subtract vectors
- `static multiply(v: Vector2D, scalar: number): Vector2D` - Multiply by scalar
- `static magnitude(v: Vector2D): number` - Get vector length
- `static normalize(v: Vector2D): Vector2D` - Get unit vector
- `static distance(a: Vector2D, b: Vector2D): number` - Distance between points

## Classes
Core classes implementing the game architecture.

**GameLoop class** (`src/core/GameLoop.ts`):
- Implements fixed timestep game loop pattern
- Properties: `config`, `state`, `updateCallback`, `renderCallback`, `animationFrameId`
- Prevents spiral of death with max delta time clamping
- Separates update (fixed timestep) from render (variable)
- Uses requestAnimationFrame for smooth rendering

**Game class** (`src/core/Game.ts`):
- Main game orchestrator
- Properties: `gameLoop`, `renderer`, `inputManager`, `canvas`
- Coordinates between all subsystems
- Manages game lifecycle (init, start, stop)
- Contains game-specific update and render logic

**Renderer class** (`src/core/Renderer.ts`):
- Encapsulates all Canvas API interactions
- Properties: `canvas`, `ctx`, `width`, `height`
- Provides high-level drawing primitives
- Handles canvas resizing
- Manages rendering context

**InputManager class** (`src/core/InputManager.ts`):
- Singleton pattern for global input access
- Properties: `inputState` (keys and mouse tracking)
- Provides query interface for input state
- Handles all DOM input events
- Prevents default behaviors where needed

**Vector2D utility class** (`src/utils/Vector2D.ts`):
- Static utility methods for 2D vector math
- No instance state (pure functions)
- Common operations for game physics and movement

## Dependencies
Add TypeScript tooling and development dependencies.

**New dependencies to add:**
```json
{
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**Package.json scripts to add:**
```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "dev": "tsc --watch"
  }
}
```

**TypeScript configuration (tsconfig.json):**
- Target: ES2020 or later
- Module: ES2020
- Strict mode enabled
- Source maps for debugging
- Output to root directory (index.js)
- Include src directory

## Testing
Initial testing approach for the game loop architecture.

**Manual testing steps:**
1. Verify game loop starts and runs at consistent rate
2. Test pause/resume functionality
3. Verify input detection (keyboard and mouse)
4. Test canvas rendering (draw test shapes)
5. Verify frame rate independence (artificially slow down updates)
6. Test window resize handling

**Test scenarios to implement in Game class:**
- Draw a moving circle that moves at constant speed regardless of frame rate
- Display FPS counter to verify loop performance
- Test input by moving circle with arrow keys
- Verify pause stops updates but continues rendering

**Future testing considerations:**
- Unit tests for Vector2D utility functions
- Integration tests for GameLoop timing accuracy
- Input manager event simulation tests

## Implementation Order
Sequential steps to build the system incrementally.

1. **Set up TypeScript configuration**
   - Create tsconfig.json with appropriate settings
   - Update package.json with TypeScript dependency and build scripts
   - Verify TypeScript compilation works

2. **Create type definitions**
   - Create src/types/index.ts with all interfaces
   - Export types for use across modules

3. **Implement Vector2D utility**
   - Create src/utils/Vector2D.ts
   - Implement static math methods
   - This has no dependencies and is needed by other classes

4. **Implement Renderer class**
   - Create src/core/Renderer.ts
   - Implement canvas initialization and basic drawing methods
   - Add resize handling

5. **Implement InputManager class**
   - Create src/core/InputManager.ts
   - Set up event listeners
   - Implement state tracking and query methods

6. **Implement GameLoop class**
   - Create src/core/GameLoop.ts
   - Implement fixed timestep algorithm
   - Add pause/resume functionality
   - This is the core timing mechanism

7. **Implement Game class**
   - Create src/core/Game.ts
   - Wire up GameLoop, Renderer, and InputManager
   - Add simple test rendering (moving circle)
   - Implement basic update logic

8. **Update HTML and CSS**
   - Add canvas element to index.html
   - Style canvas for full viewport in style.css
   - Ensure proper canvas sizing

9. **Update index.ts entry point**
   - Import and instantiate Game class
   - Start the game on window load
   - Add error handling

10. **Build and test**
    - Run TypeScript compiler
    - Test in browser
    - Verify game loop runs smoothly
    - Test all input methods
    - Verify frame rate independence
