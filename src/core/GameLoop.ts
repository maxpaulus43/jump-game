import type { GameLoopConfig, GameState } from '../types/index.js';

/**
 * GameLoop implements a fixed timestep game loop using the accumulator pattern
 * This ensures consistent gameplay across different frame rates
 */
export class GameLoop {
  private config: GameLoopConfig;
  private state: GameState;
  private updateCallback: ((dt: number) => void) | null;
  private renderCallback: (() => void) | null;
  private animationFrameId: number | null;
  private fixedDeltaTime: number;

  constructor(config: GameLoopConfig) {
    this.config = config;
    this.fixedDeltaTime = 1 / config.targetFPS;
    
    this.state = {
      running: false,
      paused: false,
      lastTimestamp: 0,
      accumulator: 0
    };

    this.updateCallback = null;
    this.renderCallback = null;
    this.animationFrameId = null;
  }

  /**
   * Start the game loop with update and render callbacks
   * @param updateFn - Function called at fixed timestep for game logic
   * @param renderFn - Function called every frame for rendering
   */
  start(updateFn: (dt: number) => void, renderFn: () => void): void {
    if (this.state.running) {
      console.warn('GameLoop is already running');
      return;
    }

    this.updateCallback = updateFn;
    this.renderCallback = renderFn;
    this.state.running = true;
    this.state.paused = false;
    this.state.lastTimestamp = performance.now();
    this.state.accumulator = 0;

    // Start the loop
    this.animationFrameId = requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause game updates (rendering continues)
   */
  pause(): void {
    this.state.paused = true;
  }

  /**
   * Resume game updates
   */
  resume(): void {
    this.state.paused = false;
    // Reset timestamp to prevent large delta time spike
    this.state.lastTimestamp = performance.now();
    this.state.accumulator = 0;
  }

  /**
   * Check if the game loop is running
   */
  isRunning(): boolean {
    return this.state.running;
  }

  /**
   * Check if the game loop is paused
   */
  isPaused(): boolean {
    return this.state.paused;
  }

  /**
   * Main game loop using fixed timestep with accumulator
   * This is called by requestAnimationFrame
   */
  private loop(timestamp: number): void {
    if (!this.state.running) {
      return;
    }

    // Calculate frame time in seconds
    const frameTime = (timestamp - this.state.lastTimestamp) / 1000;
    this.state.lastTimestamp = timestamp;

    // Clamp frame time to prevent spiral of death
    const clampedFrameTime = Math.min(frameTime, this.config.maxDeltaTime);

    // Add frame time to accumulator
    this.state.accumulator += clampedFrameTime;

    // Update game logic at fixed timestep
    if (!this.state.paused && this.updateCallback) {
      // Process all accumulated time in fixed steps
      while (this.state.accumulator >= this.fixedDeltaTime) {
        this.updateCallback(this.fixedDeltaTime);
        this.state.accumulator -= this.fixedDeltaTime;
      }
    }

    // Render every frame (even when paused)
    if (this.renderCallback) {
      this.renderCallback();
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  /**
   * Get the fixed delta time used for updates
   */
  getFixedDeltaTime(): number {
    return this.fixedDeltaTime;
  }

  /**
   * Get current configuration
   */
  getConfig(): GameLoopConfig {
    return { ...this.config };
  }
}
