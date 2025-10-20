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
    this.playerSpeed = 1; // pixels per second
    this.playerRadius = 20;

    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.currentFps = 0;

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
    this.renderer.drawText(
      'Use WASD or Arrow Keys to move',
      10,
      60,
      '#aaaaaa',
      '16px monospace'
    );

    this.renderer.drawText(
      'Press P to pause/resume',
      10,
      85,
      '#aaaaaa',
      '16px monospace'
    );

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
