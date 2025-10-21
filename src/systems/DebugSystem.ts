/**
 * DebugSystem.ts
 * 
 * Manages debug visualization state and rendering.
 * Handles toggling debug features and rendering debug overlays.
 */

import { DebugConfig, DebugData, DebugFeature, RaycastDebugInfo, DebugEntity } from '../types/debug.js';
import { Renderer } from '../types/renderer.js';

/**
 * Manages debug visualization
 */
export class DebugSystem {
  private config: DebugConfig;

  /**
   * Create a new debug system
   * @param config - Debug configuration
   */
  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      features: config.features ?? new Set([DebugFeature.Raycasts])
    };
  }

  /**
   * Check if debug system is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable debug system
   * @param enabled - Enable state
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Toggle a specific debug feature
   * @param feature - Feature to toggle
   */
  toggle(feature: DebugFeature): void {
    if (this.config.features.has(feature)) {
      this.config.features.delete(feature);
    } else {
      this.config.features.add(feature);
    }
  }

  /**
   * Check if a specific feature is enabled
   * @param feature - Feature to check
   * @returns True if feature is enabled
   */
  isFeatureEnabled(feature: DebugFeature): boolean {
    return this.config.enabled && this.config.features.has(feature);
  }

  /**
   * Update debug state (placeholder for future extensions)
   * @param _dt - Delta time (unused, reserved for future use)
   */
  update(_dt: number): void {
    // Placeholder for future debug update logic
  }

  /**
   * Render all enabled debug visualizations
   * @param renderer - Renderer instance
   * @param debugData - Debug data to visualize
   */
  render(renderer: Renderer, debugData: DebugData): void {
    if (!this.config.enabled) {
      return;
    }

    if (this.isFeatureEnabled(DebugFeature.Raycasts)) {
      this.renderRaycasts(renderer, debugData.raycasts);
      this.renderGroundedStatus(renderer, debugData.entities);
    }

    if (this.isFeatureEnabled(DebugFeature.Velocity)) {
      this.renderVelocity(renderer, debugData.entities);
    }
  }

  /**
   * Render raycast visualizations
   * @param renderer - Renderer instance
   * @param raycasts - Raycast information
   */
  private renderRaycasts(renderer: Renderer, raycasts: RaycastDebugInfo[]): void {
    for (const raycast of raycasts) {
      // Draw the ray
      renderer.drawRay(
        raycast.origin.x,
        raycast.origin.y,
        raycast.direction.x,
        raycast.direction.y,
        raycast.maxDistance,
        raycast.color,
        2
      );

      // If ray hit something, draw hit point and normal
      if (raycast.result.hit) {
        renderer.drawRaycastHit(
          raycast.result.point.x,
          raycast.result.point.y,
          raycast.result.normal.x,
          raycast.result.normal.y,
          '#00ff00',
          20
        );
      }
    }
  }

  /**
   * Render grounded status for entities
   * @param renderer - Renderer instance
   * @param entities - Entity debug information
   */
  private renderGroundedStatus(renderer: Renderer, entities: DebugEntity[]): void {
    for (const entity of entities) {
      if (entity.isGrounded !== undefined) {
        renderer.drawText(
          `Grounded: ${entity.isGrounded ? 'YES' : 'NO'}`,
          10,
          renderer.getHeight() - 30,
          entity.isGrounded ? '#00ff00' : '#ff0000',
          '16px monospace'
        );
      }
    }
  }

  /**
   * Render velocity vectors for entities
   * @param renderer - Renderer instance
   * @param entities - Entity debug information
   */
  private renderVelocity(renderer: Renderer, entities: DebugEntity[]): void {
    for (const entity of entities) {
      if (entity.velocity) {
        const velocityScale = 0.1; // Scale down velocity for visibility
        renderer.drawLine(
          entity.position.x,
          entity.position.y,
          entity.position.x + entity.velocity.x * velocityScale,
          entity.position.y + entity.velocity.y * velocityScale,
          '#ff00ff',
          2
        );
      }
    }
  }

  /**
   * Get current debug configuration
   * @returns Debug configuration
   */
  getConfig(): DebugConfig {
    return {
      enabled: this.config.enabled,
      features: new Set(this.config.features)
    };
  }
}
