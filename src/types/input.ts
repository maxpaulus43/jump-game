/**
 * input.ts
 * 
 * Type definitions for input controllers
 * Provides abstractions for different input sources (keyboard, accelerometer, etc.)
 */

import { Vec2 } from '../utils/Vec2.js';

/**
 * InputController interface for abstracting input sources
 * Provides movement input as acceleration vectors
 * 
 * This allows the Player class to be decoupled from specific input implementations,
 * making it easy to add new input types (gamepad, mouse, AI) in the future.
 */
export interface InputController {
  /**
   * Get movement acceleration vector for current frame
   * 
   * @returns Acceleration vector representing desired movement direction and magnitude
   */
  getMovementInput(): Vec2;
}

/**
 * Configuration for keyboard-based input controller
 */
export interface KeyboardControllerConfig {
  /** Base acceleration magnitude for movement */
  acceleration: number;

  /** Keys that trigger upward movement */
  upKeys: string[];

  /** Keys that trigger downward movement */
  downKeys: string[];

  /** Keys that trigger leftward movement */
  leftKeys: string[];

  /** Keys that trigger rightward movement */
  rightKeys: string[];

  jumpKeys: string[];
}

/**
 * Configuration for accelerometer-based input controller
 */
export interface AccelerometerControllerConfig {
  /** Base acceleration magnitude for movement */
  acceleration: number;

  /** Sensitivity multiplier for tilt input (higher = more sensitive) */
  sensitivity: number;

  /** Dead zone threshold - tilt below this value is ignored (prevents drift) */
  deadZone: number;
}
