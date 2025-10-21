/**
 * AccelerometerController.ts
 * 
 * Accelerometer-based input controller
 * Converts device tilt to movement acceleration vectors
 */

import { InputController, AccelerometerControllerConfig } from '../types/input.js';
import { InputManager } from '../core/InputManager.js';
import { Vec2 } from '../utils/Vec2.js';

/**
 * AccelerometerController implements input control via device accelerometer
 * 
 * Reads accelerometer tilt data from InputManager and converts it to movement vectors.
 * Includes configurable sensitivity and dead zone to prevent unintended drift.
 */
export class AccelerometerController implements InputController {
  private inputManager: InputManager;
  private config: AccelerometerControllerConfig;

  /**
   * Create a new accelerometer controller
   * 
   * @param inputManager - Input manager to read accelerometer state from
   * @param config - Configuration for sensitivity, dead zone, and acceleration
   */
  constructor(inputManager: InputManager, config: AccelerometerControllerConfig) {
    this.inputManager = inputManager;
    this.config = config;
  }

  /**
   * Get movement input from accelerometer tilt
   * 
   * Reads device tilt, applies dead zone filtering, and scales by sensitivity
   * and acceleration to produce a movement vector.
   * 
   * @returns Acceleration vector based on device tilt
   */
  getMovementInput(): Vec2 {
    // Return zero vector if no motion permission
    if (!this.inputManager.hasMotionPermission()) {
      return new Vec2(0, 0);
    }

    // Get raw tilt vector from accelerometer
    const tilt = this.inputManager.getTiltVector();
    const input = new Vec2(tilt.x, tilt.y);

    // Apply dead zone to prevent drift from small tilts
    if (Math.abs(input.x) < this.config.deadZone) {
      input.x = 0;
    }
    if (Math.abs(input.y) < this.config.deadZone) {
      input.y = 0;
    }

    // Scale by acceleration and sensitivity
    input.multiply(this.config.acceleration * this.config.sensitivity);

    return input;
  }
}
