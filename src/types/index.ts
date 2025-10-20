/**
 * Core type definitions for the game loop architecture
 */

/**
 * Configuration for the game loop timing
 */
export interface GameLoopConfig {
  /** Target frames per second (e.g., 60) */
  targetFPS: number;
  /** Maximum time step to prevent spiral of death (e.g., 0.25s) */
  maxDeltaTime: number;
}

/**
 * Internal game state for update/render cycle
 */
export interface GameState {
  /** Whether the game loop is running */
  running: boolean;
  /** Whether game updates are paused */
  paused: boolean;
  /** Last timestamp from requestAnimationFrame */
  lastTimestamp: number;
  /** Accumulated time for fixed timestep updates */
  accumulator: number;
}

/**
 * Input state tracking for keyboard and mouse
 */
export interface InputState {
  /** Map of key codes to pressed state */
  keys: Map<string, boolean>;
  /** Mouse state */
  mouse: {
    /** Mouse X position */
    x: number;
    /** Mouse Y position */
    y: number;
    /** Map of mouse button indices to pressed state */
    buttons: Map<number, boolean>;
  };
}

/**
 * 2D vector for positions, velocities, and directions
 */
export interface Vector2D {
  /** X component */
  x: number;
  /** Y component */
  y: number;
}

/**
 * Canvas rendering context wrapper
 */
export interface RenderContext {
  /** Canvas 2D rendering context */
  ctx: CanvasRenderingContext2D;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
}
