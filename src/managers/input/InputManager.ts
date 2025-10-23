import { Vec2 } from '../../utils/Vec2.js';
import type { InputState, AccelerometerData, OrientationData } from '../../types/index.js';

// enum DeviceCapability {
//   ACCELEROMETER,
// }

// export interface InputManagerConfig {
//   requestedCapabilities: DeviceCapability[];
// }

/**
 * InputManager handles all input: keyboard, mouse, accelerometer, and touch
 * Provides a query interface for checking input state
 */
export class InputManager {
  private inputState: InputState;
  private motionSensorsEnabled: boolean;

  constructor() {
    this.inputState = {
      keys: new Map<string, boolean>(),
      mouse: {
        x: 0,
        y: 0,
        buttons: new Map<number, boolean>()
      },
      accelerometer: null,
      orientation: null,
      touch: {
        touches: new Map<number, { x: number; y: number }>(),
        isActive: false
      },
      hasMotionSensors: false,
      motionPermissionGranted: false
    };
    this.motionSensorsEnabled = false;

    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse events
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // Touch events
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Check if motion sensors are available
    this.checkMotionSensorAvailability();
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
  getMousePosition(): Vec2 {
    return new Vec2(this.inputState.mouse.x, this.inputState.mouse.y);
  }

  /**
   * Get accelerometer data (null if not available)
   */
  getAccelerometer(): AccelerometerData | null {
    return this.inputState.accelerometer;
  }

  /**
   * Get device orientation data (null if not available)
   */
  getOrientation(): OrientationData | null {
    return this.inputState.orientation;
  }

  /**
   * Get tilt as a normalized 2D vector for game controls
   * Returns { x: -1 to 1, y: -1 to 1 } based on device tilt
   */
  getTiltVector(): Vec2 {
    if (!this.inputState.orientation) {
      return new Vec2(0, 0);
    }

    const { beta, gamma } = this.inputState.orientation;

    if (beta === null || gamma === null) {
      return new Vec2(0, 0);
    }

    // Map tilt angles to -1 to 1 range
    // gamma: left-to-right tilt (-90 to 90) -> x-axis
    // beta: front-to-back tilt (-180 to 180) -> y-axis
    // Clamp to reasonable tilt range (±45 degrees)
    const maxTilt = 45;
    const x = Math.max(-1, Math.min(1, gamma / maxTilt));
    const y = Math.max(-1, Math.min(1, beta / maxTilt));

    // Apply dead zone to prevent drift
    const deadZone = 0.05;
    const finalX = Math.abs(x) < deadZone ? 0 : x;
    const finalY = Math.abs(y) < deadZone ? 0 : y;

    return new Vec2(finalX, finalY);
  }

  /**
   * Check if touch input is active
   */
  isTouchActive(): boolean {
    return this.inputState.touch.isActive;
  }

  /**
   * Get all active touch points
   */
  getTouches(): Map<number, { x: number; y: number }> {
    return this.inputState.touch.touches;
  }

  /**
   * Check if motion sensors are available
   */
  hasMotionSensors(): boolean {
    return this.inputState.hasMotionSensors;
  }

  /**
   * Check if motion permission has been granted
   */
  hasMotionPermission(): boolean {
    return this.inputState.motionPermissionGranted;
  }

  /**
   * Request permission to access motion sensors (required for iOS 13+)
   * Returns a promise that resolves to true if permission granted
   */
  async requestMotionPermission(): Promise<boolean> {
    // Check if DeviceMotionEvent.requestPermission exists (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        this.inputState.motionPermissionGranted = permission === 'granted';

        if (this.inputState.motionPermissionGranted) {
          this.enableMotionSensors();
        }

        return this.inputState.motionPermissionGranted;
      } catch (error) {
        console.error('Error requesting motion permission:', error);
        return false;
      }
    } else {
      // Not iOS or older iOS version - permission not required
      this.inputState.motionPermissionGranted = true;
      this.enableMotionSensors();
      return true;
    }
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
    this.inputState.touch.touches.clear();
    this.inputState.touch.isActive = false;
  }

  /**
   * Check if motion sensors are available on this device
   */
  private checkMotionSensorAvailability(): void {
    this.inputState.hasMotionSensors =
      'DeviceMotionEvent' in window &&
      'DeviceOrientationEvent' in window;
  }

  /**
   * Enable motion sensor event listeners
   */
  private enableMotionSensors(): void {
    if (!this.inputState.hasMotionSensors || this.motionSensorsEnabled) {
      return;
    }

    window.addEventListener('devicemotion', (e) => this.handleDeviceMotion(e));
    window.addEventListener('deviceorientation', (e) => this.handleDeviceOrientation(e));
    this.motionSensorsEnabled = true;
  }

  /**
   * Handle device motion event (accelerometer)
   */
  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (event.accelerationIncludingGravity) {
      this.inputState.accelerometer = {
        x: event.accelerationIncludingGravity.x || 0,
        y: event.accelerationIncludingGravity.y || 0,
        z: event.accelerationIncludingGravity.z || 0
      };
    }
  }

  /**
   * Handle device orientation event (gyroscope/tilt)
   */
  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    this.inputState.orientation = {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    };
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.inputState.touch.isActive = true;

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.inputState.touch.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
    }
  }

  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.inputState.touch.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
    }
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    // Remove ended touches
    const activeTouchIds = new Set<number>();
    for (let i = 0; i < event.touches.length; i++) {
      activeTouchIds.add(event.touches[i].identifier);
    }

    // Remove touches that are no longer active
    for (const [id] of this.inputState.touch.touches) {
      if (!activeTouchIds.has(id)) {
        this.inputState.touch.touches.delete(id);
      }
    }

    this.inputState.touch.isActive = this.inputState.touch.touches.size > 0;
  }
}
