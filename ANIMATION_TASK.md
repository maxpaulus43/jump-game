# Animation System Implementation Task

Implement a complete sprite animation system for the ECS-based game, following the comprehensive implementation plan documented in `animation_implementation_plan.md`.

## Reference Document

Refer to @animation_implementation_plan.md for a complete breakdown of the task requirements and steps.

## Commands to Read Implementation Plan Sections

Use these commands to read specific sections of the plan as needed:

```bash
# Read Overview section
sed -n '/## Overview/,/## Types/p' animation_implementation_plan.md | head -n -1 | cat

# Read Types section
sed -n '/## Types/,/## Files/p' animation_implementation_plan.md | head -n -1 | cat

# Read Files section
sed -n '/## Files/,/## Functions/p' animation_implementation_plan.md | head -n -1 | cat

# Read Functions section
sed -n '/## Functions/,/## Classes/p' animation_implementation_plan.md | head -n -1 | cat

# Read Classes section
sed -n '/## Classes/,/## Dependencies/p' animation_implementation_plan.md | head -n -1 | cat

# Read Dependencies section
sed -n '/## Dependencies/,/## Testing/p' animation_implementation_plan.md | head -n -1 | cat

# Read Testing section
sed -n '/## Testing/,/## Implementation Order/p' animation_implementation_plan.md | head -n -1 | cat

# Read Implementation Order section
sed -n '/## Implementation Order/,/## Example Usage Patterns/p' animation_implementation_plan.md | head -n -1 | cat

# Read Example Usage section
sed -n '/## Example Usage Patterns/,$p' animation_implementation_plan.md | cat
```

## Task Overview

Add sprite animation capabilities to the existing ECS architecture. The implementation must:
- Create an AnimatedSprite component that manages multiple named animations
- Build an AnimationSystem that updates animation timing and frame advancement
- Create AnimationBuilder utilities for easy animation definition
- Update RenderSystem to render animated sprites
- Support both looping and one-shot animations
- Implement animation event callbacks (onComplete, onLoop, onStart, onStop)
- Enable state-based animation switching for entities
- Follow all existing architectural patterns (ECS, component-based, type-safe)

## Key Requirements

1. **Component-Based Design**: Adding animations should be as simple as `world.addComponent(entity, new AnimatedSprite(config))`
2. **Zero Breaking Changes**: Existing static sprite rendering must continue to work
3. **Time-Based Animation**: Frame advancement based on delta time with configurable frame durations
4. **State-Based Switching**: Animations automatically switch based on entity state (grounded, moving, etc.)
5. **Event Callbacks**: Support onComplete, onLoop, onStart, onStop callbacks
6. **Playback Control**: play(), pause(), resume(), stop() methods
7. **Type Safety**: Full TypeScript strict mode, no `any` types
8. **Performance**: Efficient frame lookups, minimal allocation overhead
9. **Backward Compatible**: Static Sprite component still works alongside AnimatedSprite

## Architecture Context

The game uses:
- **ECS Architecture**: World, Entity, Component, System pattern
- **ComponentRegistry**: SparseSet-based component storage
- **SystemScheduler**: Ordered system execution (AnimationSystem must run BEFORE RenderSystem)
- **Fixed Timestep Loop**: 60Hz update rate provides consistent dt for animations
- **Existing Sprite System**: AnimatedSprite builds on top of static sprite rendering

## Implementation Sequence

Follow the 11-step implementation order documented in the plan:
1. Extend type system in `src/types/sprite.ts` (AnimationPlaybackMode, AnimationState, etc.)
2. Create AnimationBuilder utilities in `src/utils/AnimationBuilder.ts`
3. Create AnimatedSprite component in `src/ecs/components/AnimatedSprite.ts`
4. Create AnimationSystem in `src/ecs/systems/AnimationSystem.ts`
5. Update RenderSystem to handle AnimatedSprite rendering
6. Register AnimationSystem in Game.initialize() (BEFORE RenderSystem)
7. Create player animations (idle, jump) in Player entity
8. Test basic animation playback
9. Add state-based animation switching
10. Add event callbacks and test
11. Add JSDoc comments and documentation

## Design Decisions

### Animation vs AnimatedSprite
- **AnimationPlaybackMode**: Enum for Loop/Once/PingPong modes
- **AnimationState**: Enum for Playing/Paused/Stopped/Complete states
- **Animation**: Definition of a named animation sequence
- **AnimatedSprite**: Component that holds multiple animations and current state

### Timing & Frame Advancement
- Time accumulator pattern for frame-rate independence
- Each frame has its own duration (flexible timing)
- Frame advancement happens in AnimatedSprite.update()
- AnimationSystem delegates to component's update method

### State-Based Switching
- Animations switch instantly (no blending in initial implementation)
- Check current state and switch if different
- Example: grounded + still = idle, not grounded = jump

### Event Callbacks
- Optional callbacks stored in AnimatedSprite
- Triggered at appropriate times: onStart, onLoop, onComplete, onStop
- Callbacks receive animation name as parameter

## Example Usage

```typescript
// Define animations using builder utilities
import { createAnimation, createFrameSequence, AnimationPlaybackMode } from '...';

const idleFrames = createFrameSequence('player', ['idle_0', 'idle_1'], 0.15);
const jumpFrames = createFrameSequence('player', ['jump_0', 'jump_1'], 0.1);

const animConfig: AnimationConfig = {
  defaultAnimation: 'idle',
  animations: {
    'idle': createAnimation('idle', idleFrames, AnimationPlaybackMode.Loop),
    'jump': createAnimation('jump', jumpFrames, AnimationPlaybackMode.Once)
  },
  handlers: {
    onComplete: (name) => console.log(`${name} completed`),
    onLoop: (name) => console.log(`${name} looped`)
  }
};

// Add to entity
const animSprite = new AnimatedSprite(animConfig, 10);
world.addComponent(entity, animSprite);

// Control playback
animSprite.play('jump');
animSprite.pause();
animSprite.resume();
animSprite.stop();

// Query state
const frame = animSprite.getCurrentFrame();
const state = animSprite.getState();
```

## Testing Checklist

- [ ] Game loads without errors
- [ ] AnimationSystem registers and runs before RenderSystem
- [ ] Simple looping animation plays at correct speed
- [ ] One-shot animation completes and stops
- [ ] Animation switching works instantly
- [ ] Pause/resume preserves frame state
- [ ] Stop resets to first frame
- [ ] onComplete callback fires for one-shot animations
- [ ] onLoop callback fires each loop iteration
- [ ] onStart callback fires when playing
- [ ] Player animations switch based on state (idle/jump)
- [ ] No console errors or warnings
- [ ] Static Sprite component still works (backward compatibility)

## File Structure

```
game-ts/
├── animation_implementation_plan.md    # This detailed plan
├── ANIMATION_TASK.md                   # This task file
├── src/
│   ├── types/
│   │   └── sprite.ts                   # ADD animation types/enums
│   ├── utils/
│   │   └── AnimationBuilder.ts         # NEW helper utilities
│   ├── ecs/
│   │   ├── components/
│   │   │   ├── AnimatedSprite.ts       # NEW component
│   │   │   └── index.ts                # EXPORT AnimatedSprite
│   │   └── systems/
│   │       ├── AnimationSystem.ts      # NEW system
│   │       └── RenderSystem.ts         # UPDATE for AnimatedSprite
│   ├── core/
│   │   └── Game.ts                     # REGISTER AnimationSystem
│   └── ecs/entities/
│       └── Player.ts                   # ADD AnimatedSprite to player
```

## Success Criteria

The implementation is complete when:
1. ✅ All type definitions added to `src/types/sprite.ts`
2. ✅ AnimationBuilder utilities work correctly
3. ✅ AnimatedSprite component implements all required methods
4. ✅ AnimationSystem updates animations each frame
5. ✅ RenderSystem renders animated sprites correctly
6. ✅ AnimationSystem runs before RenderSystem in execution order
7. ✅ Player has working idle and jump animations
8. ✅ Animations switch based on player state
9. ✅ Event callbacks fire at correct times
10. ✅ All tests pass (manual checklist)
11. ✅ Code has JSDoc comments and examples
12. ✅ No breaking changes to existing sprite system

## Notes

- AnimatedSprite takes precedence over Sprite if both exist on an entity
- Existing static Sprite components continue to work unchanged
- Animation timing is frame-rate independent (uses fixed dt)
- Callbacks are optional - system works fine without them
- PingPong mode is defined but not required for initial implementation (can be added later)
