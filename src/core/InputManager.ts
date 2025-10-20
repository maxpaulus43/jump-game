import type { InputState, Vector2D } from '../types/index.js';

/**
 * InputManager handles all keyboard and mouse input
 * Provides a query interface for checking input state
 */
export class InputManager {
  private inputState: InputState;

  constructor() {
    this.inputState = {
      keys: new Map<string, boolean>(),
      mouse: {
        x: 0,
        y: 0,
        buttons: new Map<number, boolean>()
      }
    };
  }

  /**
   * Initialize event listeners for input handling
   * Should be called once during game setup
   */
  initialize(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse events
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Check if a key is currently pressed
   * @param key - Key code (e.g., 'w', 'ArrowUp', ' ')
   */
  isKeyPressed(key: string): boolean {
    return this.inputState.keys.get(key) || false;
  }

  /**
   * Check if a mouse button is currently pressed
   * @param button - Mouse button index (0 = left, 1 = middle, 2 = right)
   */
  isMouseButtonPressed(button: number): boolean {
    return this.inputState.mouse.buttons.get(button) || false;
  }

  /**
   * Get current mouse position
   */
  getMousePosition(): Vector2D {
    return {
      x: this.inputState.mouse.x,
      y: this.inputState.mouse.y
    };
  }

  /**
   * Handle key press event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    this.inputState.keys.set(event.key, true);
    
    // Prevent default behavior for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle key release event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.inputState.keys.set(event.key, false);
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    this.inputState.mouse.x = event.clientX;
    this.inputState.mouse.y = event.clientY;
  }

  /**
   * Handle mouse button press event
   */
  private handleMouseDown(event: MouseEvent): void {
    this.inputState.mouse.buttons.set(event.button, true);
    event.preventDefault();
  }

  /**
   * Handle mouse button release event
   */
  private handleMouseUp(event: MouseEvent): void {
    this.inputState.mouse.buttons.set(event.button, false);
  }

  /**
   * Clear all input state (useful for cleanup or reset)
   */
  clear(): void {
    this.inputState.keys.clear();
    this.inputState.mouse.buttons.clear();
  }
}
