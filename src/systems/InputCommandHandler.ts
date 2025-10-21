/**
 * InputCommandHandler.ts
 * 
 * Maps input keys to game commands with debouncing support.
 * Handles command registration and execution.
 */

import { InputManager } from '../core/InputManager.js';

/**
 * Command callback function type
 */
type CommandCallback = () => void;

/**
 * Command registration information
 */
interface CommandRegistration {
  callback: CommandCallback;
  debounceMs: number;
  lastExecutionTime: number;
}

/**
 * Manages input command handling and debouncing
 */
export class InputCommandHandler {
  private inputManager: InputManager;
  private commands: Map<string, CommandRegistration>;

  /**
   * Create a new input command handler
   * @param inputManager - Input manager instance
   */
  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    this.commands = new Map();
  }

  /**
   * Register a command for a specific key
   * @param key - Key to bind (e.g., 'p', 'r', 't')
   * @param callback - Function to call when key is pressed
   * @param debounceMs - Debounce time in milliseconds (default: 200ms)
   */
  registerCommand(key: string, callback: CommandCallback, debounceMs: number = 200): void {
    this.commands.set(key, {
      callback,
      debounceMs,
      lastExecutionTime: 0
    });
  }

  /**
   * Unregister a command for a specific key
   * @param key - Key to unbind
   */
  unregisterCommand(key: string): void {
    this.commands.delete(key);
  }

  /**
   * Update and execute commands based on input state
   * Should be called once per frame
   */
  update(): void {
    const now = performance.now();

    for (const [key, registration] of this.commands) {
      if (this.inputManager.isKeyPressed(key)) {
        if (this.shouldExecute(registration, now)) {
          registration.callback();
          registration.lastExecutionTime = now;
        }
      }
    }
  }

  /**
   * Check if a command should execute based on debouncing
   * @param registration - Command registration
   * @param now - Current timestamp
   * @returns True if command should execute
   */
  private shouldExecute(registration: CommandRegistration, now: number): boolean {
    const timeSinceLastExecution = now - registration.lastExecutionTime;
    return timeSinceLastExecution >= registration.debounceMs;
  }

  /**
   * Clear all registered commands
   */
  clearCommands(): void {
    this.commands.clear();
  }

  /**
   * Get list of registered command keys
   * @returns Array of registered keys
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.commands.keys());
  }
}
