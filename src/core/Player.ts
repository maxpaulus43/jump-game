import { Vec2 } from '../utils/Vec2.js';
import type { Renderer } from './Renderer.js';
import type { InputManager } from './InputManager.js';

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
export class Player {
  private position: Vec2;
  private velocity: Vec2;
  private radius: number;
  private gravity: number;
  private restitution: number;
  private acceleration: number;
  private maxSpeed: number;
  private color: string;

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
    this.maxSpeed = config.maxSpeed || 800;
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
    }

    return inputAccel;
  }

  /**
   * Cap velocity to maximum speed
   */
  private capVelocity(): void {
    const speed = this.velocity.magnitude();
    if (speed > this.maxSpeed) {
      // Normalize and scale to max speed (mutates velocity in-place)
      this.velocity.normalize().multiply(this.maxSpeed);
    }
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
   * Get current position (returns clone to prevent external mutation)
   */
  getPosition(): Vec2 {
    return this.position.clone();
  }

  /**
   * Set position
   */
  setPosition(pos: { x: number; y: number }): void {
    this.position.set(pos.x, pos.y);
  }

  /**
   * Get current velocity (returns clone to prevent external mutation)
   */
  getVelocity(): Vec2 {
    return this.velocity.clone();
  }

  /**
   * Get radius
   */
  getRadius(): number {
    return this.radius;
  }
}
