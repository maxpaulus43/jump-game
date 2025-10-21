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
 * Accelerometer data from device motion sensors
 */
export interface AccelerometerData {
  /** Acceleration along X-axis (m/s²) */
  x: number;
  /** Acceleration along Y-axis (m/s²) */
  y: number;
  /** Acceleration along Z-axis (m/s²) */
  z: number;
}

/**
 * Device orientation data (tilt angles)
 */
export interface OrientationData {
  /** Rotation around Z-axis (0-360°) */
  alpha: number | null;
  /** Front-to-back tilt (-180 to 180°) */
  beta: number | null;
  /** Left-to-right tilt (-90 to 90°) */
  gamma: number | null;
}

/**
 * Touch input data
 */
export interface TouchData {
  /** Active touch points */
  touches: Map<number, { x: number; y: number }>;
  /** Whether any touch is active */
  isActive: boolean;
}

/**
 * Input state tracking for keyboard, mouse, accelerometer, and touch
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
  /** Accelerometer data (null if not available) */
  accelerometer: AccelerometerData | null;
  /** Device orientation data (null if not available) */
  orientation: OrientationData | null;
  /** Touch input data */
  touch: TouchData;
  /** Whether motion sensors are available */
  hasMotionSensors: boolean;
  /** Whether motion permission has been granted (iOS) */
  motionPermissionGranted: boolean;
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

// Re-export collision types
export * from './collision.js';
export * from './debug.js';
export * from './ui.js';
