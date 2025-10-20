import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { Platform } from '../entities/Platform.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { CollisionResolver } from '../physics/CollisionResolver.js';

/**
 * Game class orchestrates all game systems
 * Manages the game lifecycle and coordinates between subsystems
 */
export class Game {
  private gameLoop: GameLoop;
  public readonly renderer: Renderer;
  public readonly inputManager: InputManager;
  public readonly canvas: HTMLCanvasElement;
  private player: Player = new Player();
  private platforms: Platform[] = [];

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
    // Initialize player at center of screen
    const context = this.renderer.getContext();
    this.player = new Player({
      position: { x: context.width / 2, y: context.height / 2 },
      radius: 20,
      gravity: 3000,
      restitution: 1.0,
      acceleration: 1200,
      maxSpeed: 800,
      color: '#ffbf00ff'
    });

    // Initialize platforms
    this.platforms = [
      // Bottom platform (ground)
      new Platform({
        position: { x: 50, y: context.height - 50 },
        width: context.width - 100,
        height: 30,
        material: { restitution: 0.3, friction: 0.5 }
      }),

      // Staircase pattern
      new Platform({
        position: { x: 100, y: context.height - 150 },
        width: 150,
        height: 20
      }),
      new Platform({
        position: { x: 300, y: context.height - 250 },
        width: 150,
        height: 20
      }),
      new Platform({
        position: { x: 500, y: context.height - 350 },
        width: 150,
        height: 20
      }),

      // Floating platforms in middle
      new Platform({
        position: { x: context.width / 2 - 100, y: context.height / 2 },
        width: 200,
        height: 20
      }),

      // Small platform (edge case testing)
      new Platform({
        position: { x: context.width - 200, y: context.height - 200 },
        width: 80,
        height: 15
      })
    ];

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
   * Returns true if permission was granted, false otherwise
   */
  async requestMotionPermission(): Promise<boolean> {
    const granted = await this.inputManager.requestMotionPermission();
    if (granted) {
      this.useAccelerometer = true;
      this.showPermissionButton = false;
      console.log('Motion sensors enabled');
    } else {
      console.log('Motion permission denied');
    }
    return granted;
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
    // Update player
    const context = this.renderer.context;

    this.player.update(
      dt,
      this.inputManager,
      this.useAccelerometer,
      { width: context.width, height: context.height }
    );

    // Check collisions between player and platforms
    for (const platform of this.platforms) {
      const playerShape = this.player.getCollisionShape();
      const platformShape = platform.getCollisionShape();

      const collisionResult = CollisionDetector.checkCollision(
        playerShape,
        platformShape
      );

      if (collisionResult.colliding) {
        // Resolve collision using CollisionResolver
        CollisionResolver.resolveCollision(this.player, platform, collisionResult);
      }
    }

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

    // Draw platforms
    for (const platform of this.platforms) {
      platform.render(this.renderer);
    }

    // Draw player
    this.player.render(this.renderer);

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
