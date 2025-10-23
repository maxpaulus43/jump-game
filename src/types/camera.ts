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
export interface ICameraManager {
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
