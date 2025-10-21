import { GameLoop } from './GameLoop.js';
import { InputManager } from '../systems/input/InputManager.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { Platform } from '../entities/Platform.js';
import { Vec2 } from '../utils/Vec2.js';
import { FPSCounter } from '../systems/FPSCounter.js';
import { HUD } from '../systems/HUD.js';
import { DebugSystem } from '../systems/DebugSystem.js';
import { InputCommandHandler } from '../systems/input/InputCommandHandler.js';
import { PhysicsSystem } from '../systems/physics/PhysicsSystem.js';
import { KeyboardController } from '../systems/input/KeyboardController.js';
import { AccelerometerController } from '../systems/input/AccelerometerController.js';
import type { InputController } from '../types/input.js';
import { DebugFeature, DebugData, UIGameState } from '../types/index.js';
import { Renderer } from '../types/renderer.js';

/**
 * Game class orchestrates all game systems
 * Manages the game lifecycle and coordinates between subsystems
 */
export class Game {
  public readonly renderer: Renderer;
  public readonly inputManager: InputManager;
  private gameLoop: GameLoop;
  private player: Player = new Player();
  private world: World;

  // Systems
  private fpsCounter: FPSCounter;
  private hud: HUD;
  private debugSystem: DebugSystem;
  private inputCommandHandler: InputCommandHandler;
  private physicsSystem: PhysicsSystem;

  // Input controllers
  private keyboardController: KeyboardController;
  private accelerometerController: AccelerometerController;
  private activeController: InputController;

  // Mobile controls
  private showPermissionButton: boolean;

  constructor(renderer: Renderer, inputManager: InputManager) {
    this.renderer = renderer;
    this.inputManager = inputManager;

    // Create game loop with 60 FPS target
    this.gameLoop = new GameLoop({
      targetFPS: 60,
      maxDeltaTime: 0.25 // Prevent spiral of death
    });

    this.world = new World();

    // Initialize systems
    this.fpsCounter = new FPSCounter();
    this.hud = new HUD();
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
    this.showPermissionButton = false;

    this.initialize();
  }

  /**
   * Initialize game state
   */
  private initialize(): void {
    // Initialize player at center of screen
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();

    this.player = new Player({
      position: { x: w / 2, y: h / 2 },
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
      position: { x: 50, y: h - 50 },
      width: w - 100,
      height: 30,
      material: { restitution: 0.3, friction: 0.5 }
    }));

    // Staircase pattern
    this.world.addEntity(new Platform({
      position: { x: 100, y: h - 150 },
      width: 150,
      height: 20
    }));
    this.world.addEntity(new Platform({
      position: { x: 300, y: h - 250 },
      width: 150,
      height: 20
    }));
    this.world.addEntity(new Platform({
      position: { x: 500, y: h - 350 },
      width: 150,
      height: 20
    }));

    // Floating platforms in middle
    this.world.addEntity(new Platform({
      position: { x: w / 2 - 100, y: h / 2 },
      width: 200,
      height: 20
    }));

    // Small platform (edge case testing)
    this.world.addEntity(new Platform({
      position: { x: w - 200, y: h - 200 },
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

    // Set initial active controller based on device capabilities
    this.activeController = this.inputManager.hasMotionPermission()
      ? this.accelerometerController
      : this.keyboardController;
  }

  /**
   * Toggle accelerometer controls on/off
   */
  toggleAccelerometer(): void {
    this.activeController = this.activeController === this.accelerometerController
      ? this.keyboardController : this.accelerometerController;
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

    this.player.update(
      dt,
      this.activeController,
      { width: this.renderer.getWidth(), height: this.renderer.getHeight() }
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
      useAccelerometer: this.inputManager.hasMotionPermission(),
      showPermissionPrompt: this.showPermissionButton,
      debugEnabled: this.debugSystem.isFeatureEnabled(DebugFeature.Raycasts),
      hasMotionSensors: this.inputManager.hasMotionSensors(),
      hasMotionPermission: this.inputManager.hasMotionPermission()
    };

    this.hud.render(this.renderer, uiState);
  }

  /**
   * Get the game loop instance
   */
  getGameLoop(): GameLoop {
    return this.gameLoop;
  }
}
