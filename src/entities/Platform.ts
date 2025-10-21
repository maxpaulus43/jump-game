/**
 * Platform - Represents a platform entity that the player can collide with
 * 
 * Implements Collidable interface for collision detection system.
 * Designed to be extensible for future platform types (moving, weak, powerup, etc.)
 */

import { Vec2 } from '../utils/Vec2.js';
import {
  PlatformConfig,
  PlatformType,
  Collidable,
  CollisionShape,
  CollisionShapeType,
  RectangleShape,
  CollisionMaterial,
  CollisionResult
} from '../types/index.js';
import { Renderer } from '../types/renderer.js';

export class Platform implements Collidable {
  private position: Vec2;
  private width: number;
  private height: number;
  private type: PlatformType;
  private color: string;
  private material: CollisionMaterial;

  /**
   * Create a new platform
   * 
   * @param config - Platform configuration
   */
  constructor(config: PlatformConfig = {}) {
    // Initialize position
    this.position = new Vec2(
      config.position?.x ?? 100,
      config.position?.y ?? 500
    );

    // Initialize dimensions
    this.width = config.width ?? 150;
    this.height = config.height ?? 20;

    // Initialize type
    this.type = config.type ?? PlatformType.Standard;

    // Initialize color (different colors for different types)
    this.color = config.color ?? this.getDefaultColor();

    // Initialize material properties
    this.material = {
      restitution: config.material?.restitution ?? 0.3,
      friction: config.material?.friction ?? 0.5
    };
  }

  /**
   * Get default color based on platform type
   * 
   * @returns Default color for this platform type
   */
  private getDefaultColor(): string {
    switch (this.type) {
      case PlatformType.Standard:
        return '#4a90e2';  // Blue
      case PlatformType.Moving:
        return '#f39c12';  // Orange
      case PlatformType.Weak:
        return '#e74c3c';  // Red
      case PlatformType.Powerup:
        return '#9b59b6';  // Purple
      default:
        return '#4a90e2';
    }
  }

  /**
   * Get collision shape for this platform
   * 
   * @returns Rectangle collision shape
   */
  getCollisionShape(): CollisionShape {
    const shape: RectangleShape = {
      type: CollisionShapeType.Rectangle,
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height
    };
    return shape;
  }

  /**
   * Get collision material properties
   * 
   * @returns Material properties (restitution, friction)
   */
  getCollisionMaterial(): CollisionMaterial {
    return this.material;
  }

  /**
   * Handle collision with another entity
   * 
   * For static platforms, this does nothing.
   * Future moving/weak/powerup platforms can override or extend this behavior.
   * 
   * @param other - The other collidable entity
   * @param result - Collision result data
   */
  onCollision(_other: Collidable, _result: CollisionResult): void {
    // Static platforms don't react to collisions
    // Future platform types can add behavior here:
    // - Moving platforms: might adjust trajectory
    // - Weak platforms: might crack or break
    // - Powerup platforms: might activate effect
  }

  /**
   * Render the platform
   * 
   * @param renderer - Renderer instance
   */
  render(renderer: Renderer): void {
    renderer.drawRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height,
      this.color
    );
  }

  /**
   * Get platform position (returns clone for safety)
   * 
   * @returns Position vector (cloned)
   */
  getPosition(): Vec2 {
    return this.position.clone();
  }

  /**
   * Set platform position
   * 
   * @param position - New position
   */
  setPosition(position: Vec2): void {
    this.position.copy(position);
  }

  /**
   * Get platform bounds
   * 
   * @returns Bounding box { x, y, width, height }
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Get platform width
   * 
   * @returns Width in pixels
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Get platform height
   * 
   * @returns Height in pixels
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * Get platform type
   * 
   * @returns Platform type enum value
   */
  getType(): PlatformType {
    return this.type;
  }

  /**
   * Update platform state (for future moving platforms)
   * 
   * @param _dt - Delta time in seconds
   */
  update(_dt: number): void {
    // Static platforms don't update
    // Future moving platforms can implement movement here
  }
}
