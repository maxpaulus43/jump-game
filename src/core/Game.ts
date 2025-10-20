import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { Vector2DUtils } from '../utils/Vector2D.js';
import type { Vector2D } from '../types/index.js';

/**
 * Game class orchestrates all game systems
 * Manages the game lifecycle and coordinates between subsystems
 */
export class Game {
  private gameLoop: GameLoop;
  private renderer: Renderer;
  private inputManager: InputManager;
  private canvas: HTMLCanvasElement;

  // Test game state - a moving circle
  private playerPosition: Vector2D;
  private playerVelocity: Vector2D;
  private playerSpeed: number;
  private playerRadius: number;

  // FPS tracking
  private frameCount: number;
  private lastFpsUpdate: number;
  private currentFps: number;

  // Mobile controls
  private useAccelerometer: boolean;
  private showPermissionButton: boolean;

  constructor(canvasId: string) {
    // Get canvas element
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;

    // Initialize subsystems
    this.renderer = new Renderer(this.canvas);
    this.inputManager = new InputManager();
    this.inputManager.initialize();

    // Create game loop with 60 FPS target
    this.gameLoop = new GameLoop({
      targetFPS: 60,
      maxDeltaTime: 0.25 // Prevent spiral of death
    });

    // Initialize test game state
    this.playerPosition = { x: 0, y: 0 };
    this.playerVelocity = { x: 0, y: 0 };
    this.playerSpeed = 300; // pixels per second (increased for better mobile feel)
    this.playerRadius = 20;

    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.currentFps = 0;

    // Mobile controls
    this.useAccelerometer = false;
    this.showPermissionButton = false;

    this.initialize();
  }

  /**
   * Initialize game state
   */
  private initialize(): void {
    // Center player on screen
    const context = this.renderer.getContext();
    this.playerPosition = {
      x: context.width / 2,
      y: context.height / 2
    };

    // Check if motion sensors are available and request permission if needed
    if (this.inputManager.hasMotionSensors()) {
      this.showPermissionButton = !this.inputManager.hasMotionPermission();
      
      // Auto-enable accelerometer on Android (no permission needed)
      if (this.inputManager.hasMotionPermission()) {
        this.useAccelerometer = true;
      }
    }
  }

  /**
   * Request motion sensor permission (for iOS)
   */
  async requestMotionPermission(): Promise<void> {
    const granted = await this.inputManager.requestMotionPermission();
    if (granted) {
      this.useAccelerometer = true;
      this.showPermissionButton = false;
      console.log('Motion sensors enabled');
    } else {
      console.log('Motion permission denied');
    }
  }

  /**
   * Toggle accelerometer controls on/off
   */
  toggleAccelerometer(): void {
    if (this.inputManager.hasMotionSensors() && this.inputManager.hasMotionPermission()) {
      this.useAccelerometer = !this.useAccelerometer;
    }
  }

  /**
   * Start the game
   */
  start(): void {
    console.log('Starting game...');
    this.gameLoop.start(
      (dt) => this.update(dt),
      () => this.render()
    );
  }

  /**
   * Stop the game
   */
  stop(): void {
    console.log('Stopping game...');
    this.gameLoop.stop();
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.gameLoop.pause();
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameLoop.resume();
  }

  /**
   * Update game state (called at fixed timestep)
   * @param dt - Fixed delta time in seconds
   */
  private update(dt: number): void {
    // Handle input for player movement
    this.playerVelocity = { x: 0, y: 0 };

    // Use accelerometer if enabled, otherwise use keyboard
    if (this.useAccelerometer && this.inputManager.hasMotionPermission()) {
      // Get tilt vector from accelerometer
      const tilt = this.inputManager.getTiltVector();
      this.playerVelocity.x = tilt.x;
      this.playerVelocity.y = tilt.y;
    } else {
      // WASD or Arrow keys for movement
      if (this.inputManager.isKeyPressed('w') || this.inputManager.isKeyPressed('ArrowUp')) {
        this.playerVelocity.y -= 1;
      }
      if (this.inputManager.isKeyPressed('s') || this.inputManager.isKeyPressed('ArrowDown')) {
        this.playerVelocity.y += 1;
      }
      if (this.inputManager.isKeyPressed('a') || this.inputManager.isKeyPressed('ArrowLeft')) {
        this.playerVelocity.x -= 1;
      }
      if (this.inputManager.isKeyPressed('d') || this.inputManager.isKeyPressed('ArrowRight')) {
        this.playerVelocity.x += 1;
      }

      // Normalize velocity for consistent diagonal movement
      if (this.playerVelocity.x !== 0 || this.playerVelocity.y !== 0) {
        this.playerVelocity = Vector2DUtils.normalize(this.playerVelocity);
      }
    }

    // Apply velocity to position (frame-rate independent)
    const movement = Vector2DUtils.multiply(this.playerVelocity, this.playerSpeed * dt);
    this.playerPosition = Vector2DUtils.add(this.playerPosition, movement);

    // Keep player within screen bounds
    const context = this.renderer.getContext();
    this.playerPosition.x = Math.max(this.playerRadius, Math.min(context.width - this.playerRadius, this.playerPosition.x));
    this.playerPosition.y = Math.max(this.playerRadius, Math.min(context.height - this.playerRadius, this.playerPosition.y));

    // Pause/unpause with P key
    if (this.inputManager.isKeyPressed('p')) {
      if (this.gameLoop.isPaused()) {
        this.resume();
      } else {
        this.pause();
      }
      // Small delay to prevent rapid toggling
      setTimeout(() => { }, 200);
    }

    // Toggle accelerometer with T key
    if (this.inputManager.isKeyPressed('t')) {
      this.toggleAccelerometer();
      // Small delay to prevent rapid toggling
      setTimeout(() => { }, 200);
    }
  }

  /**
   * Render current frame
   */
  private render(): void {
    // Clear canvas
    this.renderer.clear();

    // Fill background
    this.renderer.fillBackground('#1a1a2e');

    // Draw player
    this.renderer.drawCircle(
      this.playerPosition.x,
      this.playerPosition.y,
      this.playerRadius,
      '#00ff88'
    );

    // Update FPS counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Draw FPS counter
    this.renderer.drawText(
      `FPS: ${this.currentFps}`,
      10,
      30,
      '#ffffff',
      '20px monospace'
    );

    // Draw instructions
    let instructionY = 60;
    
    if (this.useAccelerometer) {
      this.renderer.drawText(
        'Tilt device to move',
        10,
        instructionY,
        '#00ff88',
        '16px monospace'
      );
      instructionY += 25;
      
      if (this.inputManager.hasMotionSensors()) {
        this.renderer.drawText(
          'Press T to use keyboard',
          10,
          instructionY,
          '#aaaaaa',
          '14px monospace'
        );
        instructionY += 25;
      }
    } else {
      this.renderer.drawText(
        'Use WASD or Arrow Keys to move',
        10,
        instructionY,
        '#aaaaaa',
        '16px monospace'
      );
      instructionY += 25;
      
      if (this.inputManager.hasMotionSensors() && this.inputManager.hasMotionPermission()) {
        this.renderer.drawText(
          'Press T to use accelerometer',
          10,
          instructionY,
          '#aaaaaa',
          '14px monospace'
        );
        instructionY += 25;
      }
    }

    this.renderer.drawText(
      'Press P to pause/resume',
      10,
      instructionY,
      '#aaaaaa',
      '16px monospace'
    );

    // Show permission button message if needed
    if (this.showPermissionButton) {
      const context = this.renderer.getContext();
      this.renderer.drawText(
        'Tap screen to enable tilt controls',
        context.width / 2 - 150,
        context.height - 50,
        '#ffaa00',
        'bold 16px monospace'
      );
    }

    // Draw pause indicator
    if (this.gameLoop.isPaused()) {
      const context = this.renderer.getContext();
      this.renderer.drawText(
        'PAUSED',
        context.width / 2 - 50,
        context.height / 2,
        '#ff0000',
        'bold 32px monospace'
      );
    }
  }

  /**
   * Get the game loop instance
   */
  getGameLoop(): GameLoop {
    return this.gameLoop;
  }

  /**
   * Get the renderer instance
   */
  getRenderer(): Renderer {
    return this.renderer;
  }

  /**
   * Get the input manager instance
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }
}
