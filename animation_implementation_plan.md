# Animation System Implementation Plan

## Overview

Add sprite animation support to the ECS-based game, allowing entities to display animated sequences of sprite frames with state-based automatic switching, callbacks, and flexible playback modes.

This implementation builds on the existing sprite rendering system to add time-based frame animation. Entities will use an `AnimatedSprite` component that manages multiple named animations (e.g., "idle", "walk", "jump"). An `AnimationSystem` updates animation state each frame, advancing through frames based on elapsed time. Animations can loop continuously or play once, and callbacks trigger on completion/loop events. The system integrates with entity state (grounded, moving, jumping) to automatically switch animations.

## Types

Extend and enhance the existing sprite type system with animation-specific types.

```typescript
// src/types/sprite.ts - ADD to existing types

/**
 * Animation playback mode
 */
export enum AnimationPlaybackMode {
  /** Play once and stop on last frame */
  Once = 'once',
  /** Loop continuously */
  Loop = 'loop',
  /** Play forward then backward repeatedly */
  PingPong = 'pingpong'
}

/**
 * Current state of animation playback
 */
export enum AnimationState {
  /** Animation is playing */
  Playing = 'playing',
  /** Animation is paused (can resume) */
  Paused = 'paused',
  /** Animation is stopped (reset to first frame) */
  Stopped = 'stopped',
  /** Animation completed (one-shot animations only) */
  Complete = 'complete'
}

/**
 * Animation frame definition (UPDATED from placeholder)
 */
export interface AnimationFrame {
  /** Sprite reference for this frame */
  sprite: SpriteReference;
  /** Duration to display this frame (seconds) */
  duration: number;
}

/**
 * Animation definition (UPDATED from placeholder)
 */
export interface Animation {
  /** Unique name for this animation */
  name: string;
  /** Array of frames in the animation */
  frames: AnimationFrame[];
  /** Playback mode (loop, once, pingpong) */
  mode: AnimationPlaybackMode;
}

/**
 * Animation event callback types
 */
export type AnimationEventCallback = (animationName: string) => void;

/**
 * Animation event handlers
 */
export interface AnimationEventHandlers {
  /** Called when animation completes (one-shot only) */
  onComplete?: AnimationEventCallback;
  /** Called each time animation loops */
  onLoop?: AnimationEventCallback;
  /** Called when animation starts playing */
  onStart?: AnimationEventCallback;
  /** Called when animation is stopped */
  onStop?: AnimationEventCallback;
}

/**
 * Configuration for loading multiple animations
 */
export interface AnimationConfig {
  /** Default animation to play on start */
  defaultAnimation: string;
  /** Map of animation definitions */
  animations: Record<string, Animation>;
  /** Optional event handlers */
  handlers?: AnimationEventHandlers;
}
```

## Files

Create new animation system files and update existing rendering pipeline to support animations.

**New Files to Create:**

1. `src/ecs/components/AnimatedSprite.ts` - ECS component for animated sprites
   - Stores multiple animations by name
   - Tracks current animation, frame index, and timing
   - Provides play/pause/stop methods
   - Stores event callbacks
   - Layer property for draw order

2. `src/ecs/systems/AnimationSystem.ts` - Updates animation state each frame
   - Queries entities with Transform + AnimatedSprite
   - Updates time accumulators based on delta time
   - Advances frames when duration elapsed
   - Handles loop/complete logic
   - Triggers event callbacks
   - Runs BEFORE RenderSystem

3. `src/utils/AnimationBuilder.ts` - Helper utilities for creating animations
   - `createAnimation(name, frames, mode)` - Simple animation factory
   - `createFrameSequence(sheetId, frameNames, duration)` - Create frames from name list
   - `createNumberedSequence(sheetId, prefix, count, duration)` - e.g., "idle_0", "idle_1", etc.

**Existing Files to Modify:**

1. `src/types/sprite.ts` - Add animation types (see Types section above)

2. `src/ecs/components/index.ts` - Export AnimatedSprite component
   - Add: `export * from './AnimatedSprite.js';`

3. `src/ecs/systems/RenderSystem.ts` - Support AnimatedSprite rendering
   - Query for entities with Transform + AnimatedSprite
   - Get current frame from AnimatedSprite.getCurrentFrame()
   - Render current frame like a static sprite
   - AnimatedSprite takes precedence over Sprite component

4. `src/core/Game.ts` - Register AnimationSystem
   - Add AnimationSystem to SystemScheduler
   - Must run BEFORE RenderSystem in execution order

5. `src/ecs/entities/Player.ts` - Add example animated sprite
   - Replace or supplement Sprite with AnimatedSprite
   - Define idle, walk, jump animations
   - Set up state-based animation switching (later phase)

## Functions

Define key functions and methods for animation management and playback.

**New Functions in AnimatedSprite Component:**

1. `constructor(config: AnimationConfig)` - Initialize with animations
   - Store animations Map
   - Set default animation as current
   - Initialize timing state
   - Store event handlers

2. `play(animationName: string, restart?: boolean): void` - Start/switch animation
   - Validate animation exists
   - Set current animation
   - Reset frame index if restart or different animation
   - Set state to Playing
   - Trigger onStart callback

3. `pause(): void` - Pause current animation
   - Set state to Paused
   - Preserve current frame and accumulator

4. `stop(): void` - Stop and reset animation
   - Set state to Stopped
   - Reset frame index to 0
   - Reset time accumulator
   - Trigger onStop callback

5. `resume(): void` - Resume paused animation
   - Only works if state is Paused
   - Set state to Playing

6. `getCurrentFrame(): SpriteReference | undefined` - Get current frame sprite
   - Return sprite reference for current frame index
   - Return undefined if no animation or stopped

7. `update(dt: number): void` - Update animation timing (called by AnimationSystem)
   - Only update if state is Playing
   - Increment time accumulator by dt
   - Check if frame duration exceeded
   - Advance to next frame
   - Handle loop/complete logic
   - Trigger callbacks

8. `setEventHandlers(handlers: AnimationEventHandlers): void` - Update callbacks
   - Merge with existing handlers

**New Functions in AnimationSystem:**

1. `constructor()` - Initialize system
   - Set system name to 'AnimationSystem'

2. `update(dt: number, world: World): void` - Update all animated sprites
   - Query entities with AnimatedSprite component
   - For each entity:
     - Get AnimatedSprite component
     - Call animatedSprite.update(dt)
   - System must run BEFORE RenderSystem

**New Functions in AnimationBuilder:**

1. `export function createAnimation(name, frames, mode): Animation` - Create animation
   - Simple factory function
   - Returns Animation object

2. `export function createFrameSequence(sheetId, frameNames, duration): AnimationFrame[]` - Frame array factory
   - Map frame names to AnimationFrame objects
   - Use same duration for all frames

3. `export function createNumberedSequence(sheetId, prefix, count, duration): AnimationFrame[]` - Numbered frames
   - Generate frame names like "idle_0", "idle_1", "idle_2"
   - Use same duration for all frames

**Modified Functions in RenderSystem:**

1. `update(dt: number, world: World): void` - Update to handle animated sprites
   - ADD: Query for entities with Transform + AnimatedSprite
   - For AnimatedSprite entities:
     - Call animatedSprite.getCurrentFrame()
     - Render like a static sprite using the returned frame
   - AnimatedSprite takes precedence over Sprite component

**Modified Functions in Player Entity Factory:**

1. `createPlayer(world: World, x: number, y: number): Entity` - Add animated sprite
   - REPLACE: Sprite component with AnimatedSprite component
   - Define animations: idle, jump (walk optional)
   - Set default to idle
   - Keep other components unchanged

**Modified Functions in Game:**

1. `private initialize(): void` - Register AnimationSystem
   - ADD: this.systemScheduler.addSystem(new AnimationSystem())
   - Place AFTER input systems, BEFORE RenderSystem
   - Critical: AnimationSystem must update before rendering

## Classes

Define the AnimatedSprite component class and AnimationSystem class.

**New Class: AnimatedSprite Component**
- File: `src/ecs/components/AnimatedSprite.ts`
- Purpose: ECS component for animated sprite rendering
- Properties:
  - `static readonly type: ComponentType<AnimatedSprite> = 'AnimatedSprite'`
  - `private animations: Map<string, Animation>` - All available animations
  - `private currentAnimationName: string` - Name of active animation
  - `private currentFrameIndex: number` - Current frame in animation
  - `private timeAccumulator: number` - Time since last frame change
  - `private state: AnimationState` - Playback state
  - `private eventHandlers: AnimationEventHandlers` - Callbacks
  - `public layer: number` - Draw order (like Sprite component)
- Constructor:
  - `constructor(config: AnimationConfig, layer?: number)`
- Methods:
  - `play(animationName: string, restart?: boolean): void`
  - `pause(): void`
  - `stop(): void`
  - `resume(): void`
  - `getCurrentFrame(): SpriteReference | undefined`
  - `update(dt: number): void` - Internal timing logic
  - `setEventHandlers(handlers: AnimationEventHandlers): void`
  - `getCurrentAnimationName(): string`
  - `getState(): AnimationState`
  - `hasAnimation(name: string): boolean`

**New Class: AnimationSystem**
- File: `src/ecs/systems/AnimationSystem.ts`
- Purpose: ECS system that updates all animated sprite timings
- Properties:
  - `readonly name = 'AnimationSystem'`
- Methods:
  - `update(dt: number, world: World): void` - Update all animations
  - `onDestroy(): void` - Cleanup (no-op)

**Modified Class: RenderSystem**
- File: `src/ecs/systems/RenderSystem.ts`
- Changes:
  - Import AnimatedSprite component
  - Query for AnimatedSprite entities
  - Prioritize AnimatedSprite over Sprite component
  - Use getCurrentFrame() to get sprite reference
  - Render frame using existing drawSprite() method

**Modified Class: Game**
- File: `src/core/Game.ts`
- Changes:
  - Import AnimationSystem
  - Register AnimationSystem in initialize()
  - Place BEFORE RenderSystem in execution order

## Dependencies

No new external dependencies required; uses existing Canvas API and TypeScript features.

The animation system builds entirely on the existing sprite system infrastructure. No new npm packages are needed.

**Existing Dependencies Used:**
- TypeScript 5.3.3 - For type safety with enums
- Existing Sprite System - AnimatedSprite extends sprite rendering
- ECS Architecture - Component and System pattern
- GameLoop - Fixed timestep provides dt for animation timing

**No New Dependencies Required**

## Testing

Manual testing approach with animated sprites and callback verification.

**Test Strategy:**

1. **Static Animation Playback**
   - Create simple 2-frame looping animation
   - Verify frames alternate at correct timing
   - Check loop restart works correctly

2. **One-Shot Animation**
   - Create non-looping animation (e.g., jump)
   - Verify animation plays once and stops on last frame
   - Check onComplete callback fires

3. **Animation Switching**
   - Switch between two animations
   - Verify instant transition (no delay)
   - Check frame resets correctly

4. **Playback Controls**
   - Test play(), pause(), resume(), stop()
   - Verify state transitions work correctly
   - Check time accumulator preservation on pause

5. **Event Callbacks**
   - Test onStart fires when animation begins
   - Test onComplete fires for one-shot animations
   - Test onLoop fires each loop iteration
   - Test onStop fires when stopped

6. **State-Based Switching** (Player Integration)
   - Player grounded and still → idle animation
   - Player jumping → jump animation
   - Verify automatic switching based on state

7. **Edge Cases**
   - Switch to non-existent animation (should warn, keep current)
   - AnimatedSprite with no animations (should not crash)
   - Zero-duration frames (should advance immediately)

**Manual Test Checklist:**
- [ ] Game loads without errors
- [ ] AnimationSystem registers correctly
- [ ] Simple looping animation plays at correct speed
- [ ] Animation completes and stops (non-looping)
- [ ] Animation switching works instantly
- [ ] Pause/resume preserves frame state
- [ ] Stop resets to first frame
- [ ] onComplete callback fires
- [ ] onLoop callback fires
- [ ] onStart callback fires
- [ ] Player animations switch based on state
- [ ] No console errors or warnings

**Future Automated Testing:**
- Unit tests for AnimatedSprite timing logic
- Unit tests for frame advancement
- Unit tests for callback triggering
- Mock delta time for deterministic tests

## Implementation Order

Step-by-step implementation sequence to minimize conflicts and ensure working code at each stage.

1. **Extend Type System** - Add animation types to sprite.ts
   - Update `src/types/sprite.ts` with all new interfaces/enums
   - Enhance existing Animation and AnimationFrame interfaces
   - Add AnimationPlaybackMode, AnimationState enums
   - Add AnimationEventHandlers and AnimationConfig
   - No dependencies on other code

2. **Create AnimationBuilder Utilities** - Helper functions
   - Create `src/utils/AnimationBuilder.ts`
   - Implement createAnimation factory
   - Implement createFrameSequence helper
   - Implement createNumberedSequence helper
   - Makes animation creation easier

3. **Create AnimatedSprite Component** - Core component
   - Create `src/ecs/components/AnimatedSprite.ts`
   - Implement all playback control methods
   - Implement internal update logic
   - Implement event callback system
   - Export from `src/ecs/components/index.ts`

4. **Create AnimationSystem** - Animation updater
   - Create `src/ecs/systems/AnimationSystem.ts`
   - Query for AnimatedSprite components
   - Call update() on each AnimatedSprite
   - Simple system, delegates to component

5. **Update RenderSystem** - Support animated sprites
   - Update `src/ecs/systems/RenderSystem.ts`
   - Add AnimatedSprite query
   - Prioritize AnimatedSprite over Sprite
   - Use getCurrentFrame() for rendering
   - Maintain backward compatibility with Sprite

6. **Register AnimationSystem** - Add to game lifecycle
   - Update `src/core/Game.ts` initialize()
   - Import AnimationSystem
   - Add to SystemScheduler BEFORE RenderSystem
   - Critical: animation must update before render

7. **Create Player Animations** - Example implementation
   - Update `src/ecs/entities/Player.ts`
   - Define idle animation (2-4 frames, looping)
   - Define jump animation (2-3 frames, one-shot)
   - Replace Sprite with AnimatedSprite
   - Set default to idle

8. **Test Basic Playback** - Verify animation works
   - Run game with `npm run dev`
   - Verify player has looping idle animation
   - Check animation timing is correct
   - Verify no console errors

9. **Add State-Based Switching** - Automatic animation control
   - Create helper function in Player.ts or new system
   - Switch to jump animation when not grounded
   - Switch to idle when grounded and still
   - Test transitions are smooth

10. **Add Event Callbacks** - Test callback system
    - Add onComplete callback to jump animation
    - Log or trigger effect when jump completes
    - Add onLoop callback to idle animation
    - Verify callbacks fire at correct times

11. **Documentation** - Code comments and examples
    - Add JSDoc comments to all new classes/methods
    - Add usage examples in comments
    - Document animation config format
    - Update README if needed

## Example Usage Patterns

### Basic Animation Setup

```typescript
import { AnimatedSprite } from '../components/AnimatedSprite.js';
import { createAnimation, createFrameSequence } from '../../utils/AnimationBuilder.js';

// Define animations
const idleFrames = createFrameSequence('player', ['idle_0', 'idle_1', 'idle_2'], 0.15);
const jumpFrames = createFrameSequence('player', ['jump_0', 'jump_1'], 0.1);

const animConfig: AnimationConfig = {
  defaultAnimation: 'idle',
  animations: {
    'idle': createAnimation('idle', idleFrames, AnimationPlaybackMode.Loop),
    'jump': createAnimation('jump', jumpFrames, AnimationPlaybackMode.Once)
  },
  handlers: {
    onComplete: (name) => console.log(`${name} animation completed`),
    onLoop: (name) => console.log(`${name} animation looped`)
  }
};

// Add to entity
const animSprite = new AnimatedSprite(animConfig, 10);
world.addComponent(entity, animSprite);
```

### Manual Animation Control

```typescript
// Switch animations
animSprite.play('jump', true); // Start jump, restart if already playing

// Playback control
animSprite.pause();
animSprite.resume();
animSprite.stop();

// Query state
const currentFrame = animSprite.getCurrentFrame();
const state = animSprite.getState();
const animName = animSprite.getCurrentAnimationName();
```

### State-Based Animation Switching (Player)

```typescript
// In PlayerInputSystem or similar
const animSprite = world.getComponent(entity, AnimatedSprite.type);
const velocity = world.getComponent(entity, Velocity.type);
const controller = world.getComponent(entity, PlayerController.type);

if (!controller.isGrounded) {
  // In air - play jump
  if (animSprite.getCurrentAnimationName() !== 'jump') {
    animSprite.play('jump');
  }
} else if (Math.abs(velocity.x) > 10) {
  // Moving - play walk
  if (animSprite.getCurrentAnimationName() !== 'walk') {
    animSprite.play('walk');
  }
} else {
  // Idle
  if (animSprite.getCurrentAnimationName() !== 'idle') {
    animSprite.play('idle');
  }
}
```

## Performance Considerations

### Animation Update Rate

- AnimationSystem runs at fixed 60 Hz (16.67ms per update)
- Time accumulator pattern ensures frame-rate independence
- Animations play at consistent speed regardless of render FPS

### Memory Footprint

- Each AnimatedSprite stores:
  - Map of animations (~100 bytes per animation)
  - Current state (< 50 bytes)
  - Event callbacks (optional, minimal)
- Typical entity: ~1-5 KB per AnimatedSprite
- 1000 animated entities: ~1-5 MB (acceptable)

### Optimization Strategies

1. **Shared animations**: Multiple entities can reference same animation definitions
2. **Animation pooling**: Reuse animation configs across entities
3. **Lazy evaluation**: getCurrentFrame() only when rendering
4. **Event callback overhead**: Optional, only allocate if needed

### Benchmarks (Estimated)

- **Animation updates**: ~0.1ms per 1000 entities
- **Frame advancement**: O(1) operation
- **State transitions**: O(1) operation
- **Callback overhead**: ~0.01ms if used

## Future Enhancements

### Phase 2 Features (Not in initial implementation)

1. **Animation Blending**: Smooth transitions between animations
2. **Animation Speed Control**: playbackSpeed multiplier
3. **Frame Events**: Trigger callbacks on specific frames
4. **Animation Layers**: Multiple simultaneous animations (body + weapon)
5. **Animation Conditions**: State machine integration
6. **Sprite Flipping**: Horizontal/vertical flip support
7. **Animation Editor**: Visual tool for defining animations

### Integration Opportunities

1. **State Machine System**: Dedicated FSM for animation control
2. **Audio System**: Sync sound effects with animation frames
3. **Particle System**: Emit particles on specific frames
4. **Hit Detection**: Frame-specific hitboxes for combat

## Migration Path

### From Static Sprites to Animated Sprites

Existing code using `Sprite` component continues to work unchanged. To migrate:

```typescript
// Before (static sprite)
world.addComponent(entity, new Sprite('sheet', 'frame', 32, 32, 10));

// After (animated sprite)
const animConfig: AnimationConfig = {
  defaultAnimation: 'idle',
  animations: {
    'idle': createAnimation('idle', [
      { sprite: { sheetId: 'sheet', frameName: 'frame' }, duration: 0.1 }
    ], AnimationPlaybackMode.Loop)
  }
};
world.addComponent(entity, new AnimatedSprite(animConfig, 10));
```

### Backward Compatibility

- RenderSystem supports both Sprite and AnimatedSprite
- AnimatedSprite takes precedence if both exist
- No breaking changes to existing systems
- Gradual migration possible (entity by entity)
