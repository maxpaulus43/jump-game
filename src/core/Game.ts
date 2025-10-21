import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { Platform } from '../entities/Platform.js';
import { Vec2 } from '../utils/Vec2.js';
import { FPSCounter } from '../systems/FPSCounter.js';
import { HUDRenderer } from '../systems/HUDRenderer.js';
import { DebugSystem } from '../systems/DebugSystem.js';
import { InputCommandHandler } from '../systems/InputCommandHandler.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { KeyboardController } from '../input/KeyboardController.js';
import { AccelerometerController } from '../input/AccelerometerController.js';
import type { InputController } from '../types/input.js';
import { DebugFeature, DebugData, UIGameState } from '../types/index.js';

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
  private world: World;

  // Systems
  private fpsCounter: FPSCounter;
  private hudRenderer: HUDRenderer;
  private debugSystem: DebugSystem;
  private inputCommandHandler: InputCommandHandler;
  private physicsSystem: PhysicsSystem;

  // Input controllers
  private keyboardController: KeyboardController;
  private accelerometerController: AccelerometerController;
  private activeController: InputController;

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

    // Initialize world
    this.world = new World();

    // Initialize systems
    this.fpsCounter = new FPSCounter();
    this.hudRenderer = new HUDRenderer();
    this.debugSystem = new DebugSystem();
    this.inputCommandHandler = new InputCommandHandler(this.inputManager);
    this.physicsSystem = new PhysicsSystem({
      gravity: new Vec2(0, 0), // Gravity handled by player for now
      enableCollisions: true
    });

    // Register input commands
    this.inputCommandHandler.registerCommand('p', () => {
      if (this.gameLoop.isPaused()) {
        this.resume();
      } else {
        this.pause();
      }
    });

    this.inputCommandHandler.registerCommand('r', () => {
      this.debugSystem.toggle(DebugFeature.Raycasts);
    });

    this.inputCommandHandler.registerCommand('t', () => {
      this.toggleAccelerometer();
    });

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

    // Initialize platforms and add them to world
    // Bottom platform (ground)
    this.world.addEntity(new Platform({
      position: { x: 50, y: context.height - 50 },
      width: context.width - 100,
      height: 30,
      material: { restitution: 0.3, friction: 0.5 }
    }));

    // Staircase pattern
    this.world.addEntity(new Platform({
      position: { x: 100, y: context.height - 150 },
      width: 150,
      height: 20
    }));
    this.world.addEntity(new Platform({
      position: { x: 300, y: context.height - 250 },
      width: 150,
      height: 20
    }));
    this.world.addEntity(new Platform({
      position: { x: 500, y: context.height - 350 },
      width: 150,
      height: 20
    }));

    // Floating platforms in middle
    this.world.addEntity(new Platform({
      position: { x: context.width / 2 - 100, y: context.height / 2 },
      width: 200,
      height: 20
    }));

    // Small platform (edge case testing)
    this.world.addEntity(new Platform({
      position: { x: context.width - 200, y: context.height - 200 },
      width: 80,
      height: 15
    }));

    // Initialize input controllers
    this.keyboardController = new KeyboardController(this.inputManager, {
      acceleration: 1200,
      upKeys: ['w', 'ArrowUp'],
      downKeys: ['s', 'ArrowDown'],
      leftKeys: ['a', 'ArrowLeft'],
      rightKeys: ['d', 'ArrowRight'],
      jumpKeys: [' ', 'Space']
    });

    this.accelerometerController = new AccelerometerController(this.inputManager, {
      acceleration: 1200,
      sensitivity: 1.0,
      deadZone: 0.1
    });

    // Check if motion sensors are available and request permission if needed
    if (this.inputManager.hasMotionSensors()) {
      this.showPermissionButton = !this.inputManager.hasMotionPermission();

      // Auto-enable accelerometer on Android (no permission needed)
      if (this.inputManager.hasMotionPermission()) {
        this.useAccelerometer = true;
      }
    }

    // Set initial active controller based on device capabilities
    this.activeController = this.useAccelerometer 
      ? this.accelerometerController 
      : this.keyboardController;
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
      
      // Switch active controller reference
      this.activeController = this.useAccelerometer
        ? this.accelerometerController
        : this.keyboardController;
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
    // Handle input commands (pause, debug toggle, etc.)
    this.inputCommandHandler.update();

    // Update player
    const context = this.renderer.getContext();

    this.player.update(
      dt,
      this.activeController,
      { width: context.width, height: context.height }
    );

    // Get platforms from world for ground detection
    const platforms = this.world.getPlatforms();
    
    // Raycast ground detection (demonstrates raycast usage)
    this.player.checkGrounded(platforms as any[]);

    // Use PhysicsSystem to handle collisions
    // Get collidables (player is not in world, so add manually)
    const collidables = [this.player, ...this.world.getCollidables()];
    this.physicsSystem.update(dt, [], collidables);
  }

  /**
   * Render current frame
   */
  private render(): void {
    // Update FPS counter
    this.fpsCounter.update();

    // Clear canvas
    this.renderer.clear();
    this.renderer.fillBackground('#1a1a2e');

    // Draw all entities in world (platforms)
    this.world.render(this.renderer);

    // Draw player
    this.player.render(this.renderer);

    // Render debug visualizations
    if (this.debugSystem.isEnabled()) {
      const playerPos = this.player.getPosition();
      const playerRadius = this.player.getRadius();
      const raycastResult = this.player.getGroundRaycastResult();

      const debugData: DebugData = {
        entities: [{
          position: { x: playerPos.x, y: playerPos.y },
          radius: playerRadius,
          isGrounded: this.player.getIsGrounded()
        }],
        raycasts: [{
          origin: { x: playerPos.x, y: playerPos.y },
          direction: { x: 0, y: 1 },
          maxDistance: playerRadius + 5,
          result: raycastResult,
          color: this.player.getIsGrounded() ? '#00ff00' : '#ff00ff'
        }],
        fps: this.fpsCounter.getFPS()
      };

      this.debugSystem.render(this.renderer, debugData);
    }

    // Render HUD/UI
    const uiState: UIGameState = {
      fps: this.fpsCounter.getFPS(),
      paused: this.gameLoop.isPaused(),
      useAccelerometer: this.useAccelerometer,
      showPermissionPrompt: this.showPermissionButton,
      debugEnabled: this.debugSystem.isFeatureEnabled(DebugFeature.Raycasts),
      hasMotionSensors: this.inputManager.hasMotionSensors(),
      hasMotionPermission: this.inputManager.hasMotionPermission()
    };

    this.hudRenderer.render(this.renderer, uiState);
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
