/**
 * KeyboardController.ts
 * 
 * Keyboard-based input controller
 * Maps keyboard input to movement acceleration vectors
 */

import { InputController, KeyboardControllerConfig } from '../types/input.js';
import { InputManager } from '../core/InputManager.js';
import { Vec2 } from '../utils/Vec2.js';

/**
 * KeyboardController implements input control via keyboard
 * 
 * Reads keyboard state from InputManager and converts it to movement vectors.
 * Supports configurable key bindings for all directions.
 */
export class KeyboardController implements InputController {
  private inputManager: InputManager;
  private config: KeyboardControllerConfig;

  /**
   * Create a new keyboard controller
   * 
   * @param inputManager - Input manager to read keyboard state from
   * @param config - Configuration for key bindings and acceleration
   */
  constructor(inputManager: InputManager, config: KeyboardControllerConfig) {
    this.inputManager = inputManager;
    this.config = config;
  }

  /**
   * Get movement input from keyboard state
   * 
   * Checks all configured keys and returns an acceleration vector
   * representing the desired movement direction and magnitude.
   * 
   * @returns Acceleration vector based on currently pressed keys
   */
  getMovementInput(): Vec2 {
    const input = new Vec2(0, 0);

    // Check vertical input
    if (this.isAnyKeyPressed(this.config.upKeys)) {
      input.y -= this.config.acceleration;
    }
    if (this.isAnyKeyPressed(this.config.downKeys)) {
      input.y += this.config.acceleration;
    }

    // Check horizontal input
    if (this.isAnyKeyPressed(this.config.leftKeys)) {
      input.x -= this.config.acceleration;
    }
    if (this.isAnyKeyPressed(this.config.rightKeys)) {
      input.x += this.config.acceleration;
    }
    if (this.isAnyKeyPressed(this.config.jumpKeys)) {
      input.y -= this.config.acceleration;
    }


    return input;
  }

  /**
   * Check if any key in the provided array is currently pressed
   * 
   * @param keys - Array of key codes to check
   * @returns True if at least one key is pressed
   */
  private isAnyKeyPressed(keys: string[]): boolean {
    return keys.some(key => this.inputManager.isKeyPressed(key));
  }
}
