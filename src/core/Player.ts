import { Vec2 } from '../utils/Vec2.js';
import type { Renderer } from './Renderer.js';
import type { InputManager } from './InputManager.js';
import { CollisionShapeType } from '../types/index.js';
import type {
  Collidable,
  CollisionShape,
  CircleShape,
  CollisionMaterial,
  CollisionResult,
  Ray,
  RaycastResult
} from '../types/index.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';

/**
 * Configuration options for creating a Player
 */
export interface PlayerConfig {
  position?: { x: number; y: number };
  radius?: number;
  gravity?: number;
  restitution?: number;
  acceleration?: number;
  maxSpeed?: number;
  color?: string;
}

/**
 * Player class encapsulates all player-related logic
 * Handles physics, input, rendering, and collision
 */
export class Player implements Collidable {
  private position: Vec2;
  private velocity: Vec2;
  private radius: number;
  private gravity: number;
  private restitution: number;
  private acceleration: number;
  private color: string;
  private isGrounded: boolean = false;

  // Reusable raycast result (zero-allocation pattern)
  private groundRaycastResult: RaycastResult = {
    hit: false,
    distance: 0,
    point: { x: 0, y: 0 },
    normal: { x: 0, y: 0 },
    entity: null,
    shape: null
  };

  constructor(config: PlayerConfig = {}) {
    // Create Vec2 instances for position and velocity
    this.position = config.position
      ? new Vec2(config.position.x, config.position.y)
      : new Vec2(0, 0);
    this.velocity = new Vec2(0, 0);
    this.radius = config.radius || 20;
    this.gravity = config.gravity || 1500;
    this.restitution = config.restitution || 1.0;
    this.acceleration = config.acceleration || 1200;
    this.color = config.color || '#00ff88';
  }

  /**
   * Update player state for one physics step
   * @param dt - Delta time in seconds
   * @param inputManager - Input manager for reading controls
   * @param useAccelerometer - Whether to use accelerometer input
   * @param bounds - World boundaries for collision
   */
  update(
    dt: number,
    inputManager: InputManager,
    useAccelerometer: boolean,
    bounds: { width: number; height: number }
  ): void {
    // Calculate acceleration from input
    const inputAccel: Vec2 = this.getInputAcceleration(inputManager, useAccelerometer);

    // Update velocity with input acceleration (x axis) and gravity (y axis)
    this.velocity.x += inputAccel.x * dt;
    this.velocity.y += this.gravity * dt;

    // Update position 
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Handle boundary collisions with bouncing
    this.handleBoundaryCollisions(bounds);
  }

  /**
   * Get input acceleration from keyboard or accelerometer
   */
  private getInputAcceleration(inputManager: InputManager, useAccelerometer: boolean): Vec2 {
    const inputAccel = new Vec2(0, 0);

    // Use accelerometer if enabled, otherwise use keyboard
    if (useAccelerometer && inputManager.hasMotionPermission()) {
      // Get tilt vector from accelerometer
      const tilt = inputManager.getTiltVector();
      inputAccel.x = tilt.x * this.acceleration;
      inputAccel.y = tilt.y * this.acceleration;
    } else {
      // WASD or Arrow keys apply acceleration forces
      if (inputManager.isKeyPressed('w') || inputManager.isKeyPressed('ArrowUp')) {
        inputAccel.y -= this.acceleration;
      }
      if (inputManager.isKeyPressed('s') || inputManager.isKeyPressed('ArrowDown')) {
        inputAccel.y += this.acceleration;
      }
      if (inputManager.isKeyPressed('a') || inputManager.isKeyPressed('ArrowLeft')) {
        inputAccel.x -= this.acceleration;
      }
      if (inputManager.isKeyPressed('d') || inputManager.isKeyPressed('ArrowRight')) {
        inputAccel.x += this.acceleration;
      }
      if (inputManager.isKeyPressed(' ')) {
        // Spacebar resets velocity
        this.velocity.y += this.acceleration;
      }
    }

    return inputAccel;
  }

  /**
   * Handle collisions with world boundaries (with bouncing)
   * @returns true if a collision occurred, false otherwise
   */
  private handleBoundaryCollisions(bounds: { width: number; height: number }): void {

    // Left and right boundaries
    if (this.position.x - this.radius < 0) {
      this.position.x = this.radius;
      this.velocity.x = 0 // Math.abs(this.velocity.x) * this.restitution;
    } else if (this.position.x + this.radius > bounds.width) {
      this.position.x = bounds.width - this.radius;
      this.velocity.x = 0 // -Math.abs(this.velocity.x) * this.restitution;
    }

    // Top and bottom boundaries
    if (this.position.y - this.radius < 0) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y) * this.restitution;
    } else if (this.position.y + this.radius > bounds.height) {
      this.position.y = bounds.height - this.radius;
      this.velocity.y = -Math.abs(this.velocity.y) * this.restitution;
    }
  }

  /**
   * Render the player
   */
  render(renderer: Renderer): void {
    renderer.drawCircle(
      this.position.x,
      this.position.y,
      this.radius,
      this.color
    );
  }

  /**
   * Get collision shape for this player (Collidable interface)
   * 
   * @returns Circle collision shape
   */
  getCollisionShape(): CollisionShape {
    const shape: CircleShape = {
      type: CollisionShapeType.Circle,
      x: this.position.x,
      y: this.position.y,
      radius: this.radius
    };
    return shape;
  }

  /**
   * Get collision material properties (Collidable interface)
   * 
   * @returns Material with restitution and friction
   */
  getCollisionMaterial(): CollisionMaterial {
    return {
      restitution: this.restitution,
      friction: 0.1  // Low friction for smooth movement
    };
  }

  /**
   * Handle collision with another entity (Collidable interface)
   * 
   * For platform collisions, apply bounce physics only when landing on top.
   * 
   * @param other - The other collidable entity
   * @param result - Collision result data
   */
  onCollision(other: Collidable, result: CollisionResult): void {
    // Only apply bounce if hitting from above (normal pointing up)
    // This prevents sticking to sides/bottom of platforms
    if (result.normal.y < -0.5) {
      // Landing on top of platform
      // Calculate bounce velocity using combined restitution
      const combinedRestitution = this.restitution * other.getCollisionMaterial().restitution;

      // Reflect velocity along normal with restitution
      const velocityDotNormal = this.velocity.x * result.normal.x + this.velocity.y * result.normal.y;

      // Apply bounce (only if moving into the surface)
      if (velocityDotNormal < 0) {
        this.velocity.x -= (1 + combinedRestitution) * velocityDotNormal * result.normal.x;
        this.velocity.y -= (1 + combinedRestitution) * velocityDotNormal * result.normal.y;
      }

      // Separate shapes to prevent overlap
      this.position.x += result.normal.x * result.depth;
      this.position.y += result.normal.y * result.depth;
    }
  }

  /**
   * Check if player is grounded using raycast
   * This demonstrates how any entity can use raycasts for ground detection
   * 
   * @param platforms - Array of collidable platforms to check against
   * @returns True if player is standing on a platform
   */
  checkGrounded(platforms: Collidable[]): boolean {
    // Define ray: cast downward from player center
    const ray: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: { x: 0, y: 1 },  // Downward (canvas Y increases downward)
      maxDistance: this.radius + 5  // Slightly beyond radius to detect nearby ground
    };

    // Cast ray against all platforms (reuses result object for performance)
    CollisionDetector.raycast(ray, platforms, this.groundRaycastResult);

    // Consider grounded if hit is within acceptable range
    this.isGrounded = this.groundRaycastResult.hit &&
      this.groundRaycastResult.distance <= this.radius + 2;

    return this.isGrounded;
  }

  /**
   * Get whether player is currently grounded
   * 
   * @returns True if player is on ground
   */
  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  /**
   * Get the last ground raycast result for debugging
   * 
   * @returns The raycast result from last ground check
   */
  getGroundRaycastResult(): RaycastResult {
    return this.groundRaycastResult;
  }

  /**
   * Get player position (returns clone for safety)
   * 
   * @returns Position vector
   */
  getPosition(): Vec2 {
    return this.position.clone();
  }

  /**
   * Get player radius
   * 
   * @returns Radius in pixels
   */
  getRadius(): number {
    return this.radius;
  }
}
