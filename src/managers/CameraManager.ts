import { Vec2 } from '../utils/Vec2.js';
import type { CameraConfig, CameraBounds, ICameraManager } from '../types/camera.js';

/**
 * Camera system for smooth vertical player tracking
 * 
 * Follows the player's Y position with lerp-based smoothing, activating only
 * when the player exceeds the screen center threshold. X-axis remains fixed.
 */
export class CameraManager implements ICameraManager {
  private position: Vec2;
  private smoothing: number;
  private followThreshold: number;
  private isActive: boolean;
  private bounds: CameraBounds | null;
  private enabled: boolean;

  /**
   * Create a new camera
   * @param config Camera configuration options
   * @param screenHeight Screen height for threshold calculation
   */
  constructor(config: CameraConfig, screenHeight: number) {
    this.position = new Vec2(0, 0);
    this.smoothing = config.smoothing ?? 0.1;
    this.followThreshold = config.followThreshold ?? screenHeight / 2;
    this.enabled = config.enabled ?? true;
    this.isActive = false;
    this.bounds = null;
  }

  /**
   * Update camera position to follow target
   * @param dt Delta time (not used for lerp but kept for API consistency)
   * @param targetY Target Y position in world space
   */
  update(_dt: number, targetY: number): void {
    if (!this.enabled) {
      return;
    }

    // Activate camera when player exceeds threshold (Y < threshold means higher up)
    if (targetY < this.followThreshold) {
      this.isActive = true;
    }

    // Only follow if active
    if (!this.isActive) {
      return;
    }

    // Calculate desired camera Y (camera should center on target)
    // In canvas coordinates, Y=0 is top, so lower Y means higher position
    const desiredY = targetY - this.followThreshold;

    // Apply lerp smoothing: move camera toward desired position
    const deltaY = desiredY - this.position.y;
    this.position.y += deltaY * this.smoothing;

    // Clamp to bounds if set
    if (this.bounds !== null) {
      if (this.position.y < this.bounds.minY) {
        this.position.y = this.bounds.minY;
      }
      if (this.position.y > this.bounds.maxY) {
        this.position.y = this.bounds.maxY;
      }
    }
  }

  /**
   * Apply camera transform to rendering context
   * 
   * Translates the context so that world coordinates are rendered relative
   * to the camera position. Call before rendering world entities.
   * 
   * @param ctx Canvas 2D rendering context
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.isActive) {
      return;
    }

    ctx.save();
    // Translate by negative camera position (move world opposite to camera)
    // Only Y-axis is affected
    ctx.translate(0, -this.position.y);
  }

  /**
   * Reset camera transform on rendering context
   * 
   * Restores the context to its state before applyTransform was called.
   * Call before rendering UI elements that should remain in screen space.
   * 
   * @param ctx Canvas 2D rendering context
   */
  resetTransform(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.isActive) {
      return;
    }

    ctx.restore();
  }

  /**
   * Get current camera Y offset in world space
   * @returns Current Y offset
   */
  getOffsetY(): number {
    return this.position.y;
  }

  /**
   * Get camera position as object
   * @returns Camera position {x, y}
   */
  getPosition(): { x: number; y: number } {
    return {
      x: this.position.x,
      y: this.position.y
    };
  }

  /**
   * Set camera bounds to limit vertical movement
   * @param bounds Camera bounds with min/max Y
   */
  setBounds(bounds: CameraBounds): void {
    this.bounds = bounds;
  }

  /**
   * Check if camera is actively following target
   * @returns True if camera has been activated
   */
  isFollowing(): boolean {
    return this.enabled && this.isActive;
  }

  /**
   * Enable or disable camera
   * @param enabled Whether camera should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Reset camera to initial state
   */
  reset(): void {
    this.position.set(0, 0);
    this.isActive = false;
  }
}
