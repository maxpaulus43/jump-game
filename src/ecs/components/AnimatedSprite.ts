import type { ComponentType } from '../types.js';
import type {
  Animation,
  AnimationConfig,
  AnimationEventHandlers,
  AnimationPlaybackMode,
  AnimationState,
  SpriteReference
} from '../../types/sprite.js';

/**
 * ECS component for animated sprite rendering.
 * 
 * Manages multiple named animations and handles frame advancement based on time.
 * Supports looping, one-shot, and ping-pong playback modes, as well as
 * pause/resume/stop controls and event callbacks.
 * 
 * @example
 * ```typescript
 * const animConfig: AnimationConfig = {
 *   defaultAnimation: 'idle',
 *   animations: {
 *     'idle': createAnimation('idle', idleFrames, AnimationPlaybackMode.Loop),
 *     'jump': createAnimation('jump', jumpFrames, AnimationPlaybackMode.Once)
 *   },
 *   handlers: {
 *     onComplete: (name) => console.log(`${name} completed`),
 *     onLoop: (name) => console.log(`${name} looped`)
 *   }
 * };
 * 
 * const animSprite = new AnimatedSprite(animConfig, 10);
 * world.addComponent(entity, animSprite);
 * ```
 */
export class AnimatedSprite {
  static readonly type: ComponentType<AnimatedSprite> = 'AnimatedSprite';

  /** All available animations indexed by name */
  private animations: Map<string, Animation>;

  /** Name of currently playing animation */
  private currentAnimationName: string;

  /** Current frame index within the animation */
  private currentFrameIndex: number;

  /** Time accumulated since last frame change (seconds) */
  private timeAccumulator: number;

  /** Current playback state */
  private state: AnimationState;

  /** Event callback handlers */
  private eventHandlers: AnimationEventHandlers;

  /** Draw order layer (higher = drawn on top) */
  public layer: number;

  /** Direction for ping-pong playback (1 = forward, -1 = backward) */
  private pingPongDirection: number;

  /**
   * Creates a new AnimatedSprite component.
   * 
   * @param config - Animation configuration
   * @param layer - Draw order (default: 0, higher = on top)
   */
  constructor(config: AnimationConfig, layer: number = 0) {
    // Store animations
    this.animations = new Map();
    for (const [name, animation] of Object.entries(config.animations)) {
      this.animations.set(name, animation);
    }

    // Validate default animation exists
    if (!this.animations.has(config.defaultAnimation)) {
      console.warn(
        `Default animation "${config.defaultAnimation}" not found. Using first available animation.`
      );
      const firstAnimation = this.animations.keys().next().value;
      this.currentAnimationName = firstAnimation || '';
    } else {
      this.currentAnimationName = config.defaultAnimation;
    }

    // Initialize state
    this.currentFrameIndex = 0;
    this.timeAccumulator = 0;
    this.state = 'playing' as AnimationState;
    this.layer = layer;
    this.pingPongDirection = 1;

    // Store event handlers
    this.eventHandlers = config.handlers || {};

    // Trigger onStart for default animation
    if (this.eventHandlers.onStart) {
      this.eventHandlers.onStart(this.currentAnimationName);
    }
  }

  /**
   * Start or switch to a different animation.
   * 
   * @param animationName - Name of animation to play
   * @param restart - If true, restart animation even if already playing
   */
  play(animationName: string, restart: boolean = false): void {
    // Check if animation exists
    if (!this.animations.has(animationName)) {
      console.warn(`Animation "${animationName}" not found. Keeping current animation.`);
      return;
    }

    // Check if we need to switch animations
    const switchingAnimation = animationName !== this.currentAnimationName;

    if (switchingAnimation || restart) {
      this.currentAnimationName = animationName;
      this.currentFrameIndex = 0;
      this.timeAccumulator = 0;
      this.pingPongDirection = 1;
    }

    this.state = 'playing' as AnimationState;

    // Trigger onStart callback
    if (this.eventHandlers.onStart) {
      this.eventHandlers.onStart(animationName);
    }
  }

  /**
   * Pause the current animation.
   * Preserves current frame and time accumulator.
   */
  pause(): void {
    this.state = 'paused' as AnimationState;
  }

  /**
   * Resume a paused animation.
   * Only works if current state is Paused.
   */
  resume(): void {
    if (this.state === ('paused' as AnimationState)) {
      this.state = 'playing' as AnimationState;
    }
  }

  /**
   * Stop the animation and reset to first frame.
   */
  stop(): void {
    this.state = 'stopped' as AnimationState;
    this.currentFrameIndex = 0;
    this.timeAccumulator = 0;
    this.pingPongDirection = 1;

    // Trigger onStop callback
    if (this.eventHandlers.onStop) {
      this.eventHandlers.onStop(this.currentAnimationName);
    }
  }

  /**
   * Get the sprite reference for the current frame.
   * 
   * @returns Current frame's sprite reference, or undefined if no animation
   */
  getCurrentFrame(): SpriteReference | undefined {
    const animation = this.animations.get(this.currentAnimationName);
    if (!animation || animation.frames.length === 0) {
      return undefined;
    }

    // Clamp frame index to valid range
    const frameIndex = Math.max(0, Math.min(this.currentFrameIndex, animation.frames.length - 1));
    return animation.frames[frameIndex].sprite;
  }

  /**
   * Update animation timing and advance frames.
   * Called by AnimationSystem each frame.
   * 
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    // Only update if playing
    if (this.state !== ('playing' as AnimationState)) {
      return;
    }

    const animation = this.animations.get(this.currentAnimationName);
    if (!animation || animation.frames.length === 0) {
      return;
    }

    // Accumulate time
    this.timeAccumulator += dt;

    // Get current frame duration
    const currentFrame = animation.frames[this.currentFrameIndex];
    if (!currentFrame) {
      return;
    }

    // Check if we should advance to next frame
    while (this.timeAccumulator >= currentFrame.duration) {
      this.timeAccumulator -= currentFrame.duration;
      this.advanceFrame(animation);
    }
  }

  /**
   * Advance to the next frame based on playback mode.
   * 
   * @param animation - Current animation
   */
  private advanceFrame(animation: Animation): void {
    const frameCount = animation.frames.length;

    if (animation.mode === ('loop' as AnimationPlaybackMode)) {
      // Loop mode: wrap to beginning
      this.currentFrameIndex = (this.currentFrameIndex + 1) % frameCount;

      // Trigger onLoop when wrapping
      if (this.currentFrameIndex === 0 && this.eventHandlers.onLoop) {
        this.eventHandlers.onLoop(this.currentAnimationName);
      }
    } else if (animation.mode === ('once' as AnimationPlaybackMode)) {
      // Once mode: stop on last frame
      if (this.currentFrameIndex < frameCount - 1) {
        this.currentFrameIndex++;
      } else {
        // Reached last frame - complete animation
        this.state = 'complete' as AnimationState;
        if (this.eventHandlers.onComplete) {
          this.eventHandlers.onComplete(this.currentAnimationName);
        }
      }
    } else if (animation.mode === ('pingpong' as AnimationPlaybackMode)) {
      // Ping-pong mode: bounce back and forth
      this.currentFrameIndex += this.pingPongDirection;

      // Check bounds and reverse direction
      if (this.currentFrameIndex >= frameCount - 1) {
        this.currentFrameIndex = frameCount - 1;
        this.pingPongDirection = -1;
      } else if (this.currentFrameIndex <= 0) {
        this.currentFrameIndex = 0;
        this.pingPongDirection = 1;

        // Trigger onLoop when completing a full cycle
        if (this.eventHandlers.onLoop) {
          this.eventHandlers.onLoop(this.currentAnimationName);
        }
      }
    }
  }

  /**
   * Set or update event handlers.
   * 
   * @param handlers - Event callback handlers to merge with existing
   */
  setEventHandlers(handlers: AnimationEventHandlers): void {
    this.eventHandlers = {
      ...this.eventHandlers,
      ...handlers
    };
  }

  /**
   * Get the name of the currently playing animation.
   * 
   * @returns Current animation name
   */
  getCurrentAnimationName(): string {
    return this.currentAnimationName;
  }

  /**
   * Get the current playback state.
   * 
   * @returns Current animation state
   */
  getState(): AnimationState {
    return this.state;
  }

  /**
   * Check if an animation with the given name exists.
   * 
   * @param name - Animation name to check
   * @returns True if animation exists
   */
  hasAnimation(name: string): boolean {
    return this.animations.has(name);
  }
}
