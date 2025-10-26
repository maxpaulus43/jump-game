# Implementation Plan

## Overview

Add sprite rendering support to the ECS-based game, allowing entities to be rendered with 2D images from sprite sheets instead of solid colored shapes.

This implementation adds a complete sprite system that integrates seamlessly with the existing ECS architecture. Entities will be able to use a new Sprite component alongside or instead of the Renderable component. The system includes a SpriteSheetManager for asset loading, a placeholder sprite sheet generator for testing, and scaffolding for future animated sprite support. The design follows the existing component-based patterns where adding sprites is as simple as `world.addComponent(entity, new Sprite(...))`.

## Types

Define complete type system for sprites, sprite sheets, and frame definitions.

```typescript
// src/types/sprite.ts

/**
 * Represents a rectangular region within a sprite sheet
 */
export interface SpriteFrame {
  /** X position of top-left corner in sprite sheet (pixels) */
  x: number;
  /** Y position of top-left corner in sprite sheet (pixels) */
  y: number;
  /** Width of the sprite frame (pixels) */
  width: number;
  /** Height of the sprite frame (pixels) */
  height: number;
}

/**
 * A loaded sprite sheet image with metadata
 */
export interface SpriteSheet {
  /** Unique identifier for this sprite sheet */
  id: string;
  /** The loaded HTMLImageElement */
  image: HTMLImageElement;
  /** Width of the entire sprite sheet */
  width: number;
  /** Height of the entire sprite sheet */
  height: number;
  /** Map of named sprite frames within this sheet */
  frames: Map<string, SpriteFrame>;
}

/**
 * Configuration for loading a sprite sheet
 */
export interface SpriteSheetConfig {
  /** Unique ID for this sprite sheet */
  id: string;
  /** Path or URL to the image file */
  imagePath: string;
  /** Frame definitions within the sheet */
  frames: Record<string, SpriteFrame>;
}

/**
 * Reference to a specific sprite frame
 */
export interface SpriteReference {
  /** ID of the sprite sheet containing this sprite */
  sheetId: string;
  /** Name of the frame within the sprite sheet */
  frameName: string;
}

/**
 * Animation frame definition (placeholder for future animation support)
 */
export interface AnimationFrame {
  /** Sprite reference for this frame */
  sprite: SpriteReference;
  /** Duration to display this frame (seconds) */
  duration: number;
}

/**
 * Animation definition (placeholder for future animation support)
 */
export interface Animation {
  /** Unique name for this animation */
  name: string;
  /** Array of frames in the animation */
  frames: AnimationFrame[];
  /** Whether the animation should loop */
  loop: boolean;
}
```

## Files

Create new sprite system files and update existing rendering pipeline to support sprites.

**New Files to Create:**

1. `src/ecs/components/Sprite.ts` - ECS component that references a sprite frame for rendering
   - Contains SpriteReference (sheetId + frameName)
   - Optional width/height overrides for scaling
   - Layer property for draw order (similar to Renderable)

2. `src/managers/SpriteSheetManager.ts` - Centralized sprite sheet loading and management
   - Singleton pattern for global access
   - Async image loading with Promise-based API
   - Caching of loaded sprite sheets by ID
   - Methods: loadSpriteSheet(), getSpriteSheet(), getFrame()

3. `src/utils/PlaceholderSpriteSheet.ts` - Programmatically generates a test sprite sheet
   - Creates a canvas-based sprite sheet with colored squares
   - Defines frames for "player", "platform", "enemy" sprites
   - Returns SpriteSheetConfig for loading into manager

**Existing Files to Modify:**

1. `src/types/sprite.ts` - Fill in the empty Sprite interface with complete type definitions (see Types section)

2. `src/ecs/components/index.ts` - Export the new Sprite component
   - Add: `export * from './Sprite.js';`

3. `src/ecs/systems/RenderSystem.ts` - Update to render sprites
   - Query for entities with Transform + Sprite (in addition to existing shape queries)
   - Combine and sort all renderable entities by layer
   - Check for Sprite component first, fall back to shape rendering
   - Use SpriteSheetManager to get sprite data
   - Call renderer.drawSprite() for sprite entities

4. `src/managers/ui/HTMLCanvasRenderer.ts` - Implement the drawSprite method
   - Currently throws "Method not implemented" error
   - Use ctx.drawImage() with sprite sheet source and frame coordinates
   - Support width/height parameters for scaling

5. `src/ecs/entities/Player.ts` - Add example sprite component to player
   - Add Sprite component alongside existing components
   - Reference "player" frame from placeholder sprite sheet
   - Keep Renderable as fallback if sprite fails to load

6. `src/core/Game.ts` - Initialize sprite system on game start
   - Create and initialize SpriteSheetManager instance
   - Load placeholder sprite sheet during initialization
   - Store reference for access by systems

## Functions

Define key functions and methods for sprite loading, retrieval, and rendering.

**New Functions in SpriteSheetManager:**

1. `constructor()` - Initialize empty sprite sheet storage
   - `private spriteSheets: Map<string, SpriteSheet> = new Map()`

2. `async loadSpriteSheet(config: SpriteSheetConfig): Promise<void>` - Load and cache a sprite sheet
   - Create new Image() element
   - Set src to config.imagePath
   - Return Promise that resolves on image.onload
   - Convert config.frames Record to Map
   - Store SpriteSheet object in spriteSheets Map

3. `getSpriteSheet(sheetId: string): SpriteSheet | undefined` - Retrieve loaded sprite sheet
   - Simple Map lookup and return

4. `getFrame(ref: SpriteReference): { sheet: SpriteSheet; frame: SpriteFrame } | undefined` - Get specific frame
   - Lookup sprite sheet by ref.sheetId
   - Lookup frame by ref.frameName in sheet.frames Map
   - Return both sheet and frame, or undefined if not found

5. `isLoaded(sheetId: string): boolean` - Check if sprite sheet is loaded
   - Return spriteSheets.has(sheetId)

**New Functions in PlaceholderSpriteSheet:**

1. `export function createPlaceholderSpriteSheet(): SpriteSheetConfig` - Generate test sprite sheet
   - Create 256x256 canvas
   - Draw colored 64x64 squares for different entity types:
     - (0, 0): Yellow square for "player"
     - (64, 0): Blue square for "platform"
     - (128, 0): Red square for "enemy"
   - Convert canvas to data URL
   - Return SpriteSheetConfig with frame definitions

**Modified Functions in RenderSystem:**

1. `update(dt: number, world: World): void` - Update to handle sprite rendering
   - NEW: Query for entities with Transform + Sprite
   - EXISTING: Query for entities with Transform + Renderable + CircleCollider
   - EXISTING: Query for entities with Transform + Renderable + RectCollider
   - Combine all queries and sort by layer (Sprite.layer or Renderable.layer)
   - For each entity:
     - Check for Sprite component first
     - If sprite exists and loaded, call drawSprite()
     - Otherwise check for shape components (CircleCollider/RectCollider)
     - If shape exists, call existing shape drawing code

**Modified Functions in HTMLCanvasRenderer:**

1. `drawSprite(sprite: Sprite, x: number, y: number, width: number, height: number): void` - Implement sprite rendering
   - REMOVE: `throw new Error('Method not implemented.')`
   - ADD: Use SpriteSheetManager.getInstance() to get sprite data
   - ADD: Call ctx.drawImage() with 9 parameters:
     - image, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH
   - Handle missing sprite gracefully (no-op or log warning)

**Modified Functions in Player Entity Factory:**

1. `createPlayer(world: World, x: number, y: number): Entity` - Add sprite component
   - EXISTING: All current component additions remain
   - NEW: Add Sprite component after Renderable
   - Reference "placeholder/player" frame
   - Set appropriate layer (match Renderable layer of 10)

**Modified Functions in Game:**

1. `private initialize(): void` - Load sprite sheets on game start
   - NEW: Create SpriteSheetManager.getInstance()
   - NEW: Generate placeholder sprite sheet config
   - NEW: await spriteSheetManager.loadSpriteSheet(placeholderConfig)
   - NEW: Store sprite manager reference in class field
   - EXISTING: All other initialization remains unchanged

## Classes

Define the Sprite component class and SpriteSheetManager service class.

**New Class: Sprite Component**
- File: `src/ecs/components/Sprite.ts`
- Purpose: ECS component for sprite-based rendering
- Properties:
  - `static readonly type: ComponentType<Sprite> = 'Sprite'`
  - `sheetId: string` - ID of sprite sheet containing this sprite
  - `frameName: string` - Name of frame within sprite sheet
  - `width?: number` - Optional width override (for scaling)
  - `height?: number` - Optional height override (for scaling)
  - `layer: number = 0` - Draw order (higher = drawn on top)
- Constructor:
  - `constructor(sheetId: string, frameName: string, width?: number, height?: number, layer?: number)`
- Methods:
  - `getSpriteReference(): SpriteReference` - Returns { sheetId, frameName }

**New Class: SpriteSheetManager**
- File: `src/managers/SpriteSheetManager.ts`
- Purpose: Singleton manager for loading and accessing sprite sheets
- Properties:
  - `private static instance: SpriteSheetManager | null = null`
  - `private spriteSheets: Map<string, SpriteSheet> = new Map()`
- Methods:
  - `static getInstance(): SpriteSheetManager` - Get singleton instance
  - `async loadSpriteSheet(config: SpriteSheetConfig): Promise<void>` - Load image and cache
  - `getSpriteSheet(sheetId: string): SpriteSheet | undefined` - Get loaded sheet
  - `getFrame(ref: SpriteReference): { sheet: SpriteSheet; frame: SpriteFrame } | undefined` - Get frame data
  - `isLoaded(sheetId: string): boolean` - Check if loaded
  - `clear(): void` - Clear all cached sprite sheets

**Modified Class: RenderSystem**
- File: `src/ecs/systems/RenderSystem.ts`
- Changes:
  - Import Sprite component
  - Import SpriteSheetManager
  - Add sprite entity query in update() method
  - Prioritize sprite rendering over shape rendering
  - Combine and sort all renderable entities by layer
  - Call renderer.drawSprite() for sprite entities

**Modified Class: HTMLCanvasRenderer**
- File: `src/managers/ui/HTMLCanvasRenderer.ts`
- Changes:
  - Import SpriteSheet types
  - Import SpriteSheetManager
  - Implement drawSprite() method using ctx.drawImage()
  - Handle sprite frame coordinates and scaling

**Modified Class: Game**
- File: `src/core/Game.ts`
- Changes:
  - Add private field: `private spriteManager!: SpriteSheetManager`
  - Initialize sprite manager in initialize()
  - Load placeholder sprite sheet
  - Make initialize() async if needed (or use .then() for promise)

## Dependencies

No new external dependencies required; uses existing Canvas API and TypeScript features.

The implementation uses only browser-native APIs (Canvas 2D context, HTMLImageElement) and existing project dependencies (TypeScript, Vite). No npm packages need to be added.

**Existing Dependencies Used:**
- TypeScript 5.3.3 - For type safety
- Canvas 2D API - For sprite rendering with ctx.drawImage()
- HTMLImageElement - For loading sprite sheet images
- Promise API - For async sprite sheet loading

**No New Dependencies Required**

## Testing

Manual testing approach with placeholder sprite sheet and visual verification.

**Test Strategy:**

1. **Placeholder Sprite Sheet Verification**
   - Run `npm run dev`
   - Verify placeholder sprite sheet loads in browser console
   - Check for no console errors related to image loading

2. **Player Sprite Rendering**
   - Verify player renders as yellow square (from sprite) instead of circle
   - Check player sprite moves correctly with keyboard/accelerometer
   - Verify sprite follows all physics (gravity, collisions)

3. **Sprite vs Shape Fallback**
   - Temporarily comment out sprite component from player
   - Verify player falls back to yellow circle (Renderable component)
   - Re-enable sprite component, verify sprite renders again

4. **Platform Rendering**
   - Verify platforms still render as blue rectangles (no sprite added)
   - Check mixed rendering works (sprite player + shape platforms)

5. **Layer Ordering**
   - Verify player sprite (layer 10) renders on top of platforms (layer 0)
   - Check no z-fighting or incorrect draw order

6. **Console Verification**
   - Check no errors in browser console
   - Verify sprite sheet loaded message
   - Check frame lookup success messages if debug logging added

**Manual Test Checklist:**
- [ ] Game loads without errors
- [ ] Placeholder sprite sheet generates and loads
- [ ] Player renders with sprite instead of circle
- [ ] Player movement and physics work correctly
- [ ] Platforms still render as rectangles
- [ ] Sprite layer ordering is correct
- [ ] No console errors or warnings
- [ ] Fallback to Renderable works if sprite missing

**Future Automated Testing:**
- Unit tests for SpriteSheetManager.loadSpriteSheet()
- Unit tests for frame lookup and caching
- Integration tests for RenderSystem sprite queries
- Mock image loading for deterministic tests

## Implementation Order

Step-by-step implementation sequence to minimize conflicts and ensure working code at each stage.

1. **Define Type System** - Complete sprite type definitions
   - Update `src/types/sprite.ts` with all interfaces
   - No dependencies on other code
   - Establishes contracts for implementation

2. **Create Sprite Component** - Add ECS component
   - Create `src/ecs/components/Sprite.ts`
   - Add to `src/ecs/components/index.ts` exports
   - Follows existing component patterns

3. **Create Placeholder Sprite Sheet** - Test asset generation
   - Create `src/utils/PlaceholderSpriteSheet.ts`
   - Generate canvas-based test sprites
   - Returns SpriteSheetConfig ready for loading

4. **Create SpriteSheetManager** - Asset loading system
   - Create `src/managers/SpriteSheetManager.ts`
   - Implement singleton pattern
   - Implement async image loading
   - Implement frame lookup methods

5. **Implement Renderer.drawSprite()** - Low-level rendering
   - Update `src/managers/ui/HTMLCanvasRenderer.ts`
   - Replace stub with actual ctx.drawImage() implementation
   - Add error handling for missing sprites

6. **Initialize Sprite System in Game** - Hook up to game lifecycle
   - Update `src/core/Game.ts` initialize()
   - Create SpriteSheetManager instance
   - Load placeholder sprite sheet
   - Handle async loading (await or .then())

7. **Update RenderSystem** - High-level sprite rendering
   - Update `src/ecs/systems/RenderSystem.ts`
   - Add sprite entity query
   - Combine with shape queries and sort by layer
   - Implement sprite rendering logic with fallback

8. **Add Sprite to Player Entity** - Example usage
   - Update `src/ecs/entities/Player.ts`
   - Add Sprite component to player
   - Reference placeholder sprite sheet frame
   - Keep Renderable for fallback

9. **Test and Verify** - Manual testing
   - Run game with `npm run dev`
   - Verify placeholder sprite loads
   - Verify player renders as sprite
   - Check all physics and rendering still work
   - Verify no console errors

10. **Documentation** - Code comments and examples
    - Add JSDoc comments to all new classes/functions
    - Add usage examples in comments
    - Update README if needed
    - Document placeholder sprite sheet format
