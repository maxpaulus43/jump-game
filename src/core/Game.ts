import { GameLoop } from './GameLoop.js';
import { InputManager } from '../systems/input/InputManager.js';
import { FPSCounter } from '../systems/FPSCounter.js';
import { HUD } from '../systems/HUD.js';
import { InputCommandHandler } from '../systems/input/InputCommandHandler.js';
import { KeyboardController } from '../systems/input/KeyboardController.js';
import { AccelerometerController } from '../systems/input/AccelerometerController.js';
import { Camera } from '../systems/Camera.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { TouchButtonManager } from '../systems/ui/TouchButtonManager.js';
import { ButtonFactory } from '../systems/ui/ButtonFactory.js';
import type { InputController } from '../types/input.js';
import { DebugFeature, UIGameState } from '../types/index.js';
import { Renderer } from '../types/renderer.js';

// ECS imports
import { ECSWorld } from '../ecs/ECSWorld.js';
import { SystemScheduler } from '../ecs/SystemScheduler.js';
import { createPlayer } from '../ecs/prefabs/PlayerPrefab.js';
import {
  PhysicsSystem as ECSPhysicsSystem,
  RenderSystem as ECSRenderSystem,
  PlayerInputSystem,
  PlayerPhysicsSystem,
  VelocityCapSystem,
  BoundaryCollisionSystem,
  CollisionSystem,
  GroundDetectionSystem,
  CameraFollowSystem,
  PlatformSpawnSystem
} from '../ecs/systems/index.js';
import type { Entity } from '../ecs/types.js';
import { Transform } from '../ecs/components/Transform.js';

/**
 * Game class orchestrates all game systems
 * Manages the game lifecycle and coordinates between subsystems
 */
export class Game {
  public readonly renderer: Renderer;
  public readonly inputManager: InputManager;
  private gameLoop: GameLoop;

  // ECS integration (Phase 2.4)
  private ecsWorld!: ECSWorld;
  private systemScheduler!: SystemScheduler;
  private ecsPlayerEntity!: Entity;

  // Systems
  private camera!: Camera;
  private fpsCounter: FPSCounter;
  private hud: HUD;
  private inputCommandHandler: InputCommandHandler;
  private scoreSystem: ScoreSystem;
  private touchButtonManager!: TouchButtonManager;

  // Input controllers
  private keyboardController!: KeyboardController;
  private accelerometerController!: AccelerometerController;
  private activeController!: InputController;

  // Game state
  private gameOver: boolean = false;

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

    // Initialize systems
    this.fpsCounter = new FPSCounter();
    this.hud = new HUD();
    this.inputCommandHandler = new InputCommandHandler(this.inputManager);
    this.scoreSystem = new ScoreSystem();

    // Register input commands
    this.inputCommandHandler.registerCommand('p', () => {
      if (this.gameLoop.isPaused()) {
        this.resume();
      } else {
        this.pause();
      }
    });

    this.inputCommandHandler.registerCommand('r', () => {
      if (this.gameOver) {
        this.restart();
      }
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
    // // Initialize player at center of screen
    const h = this.renderer.getHeight();

    // // Initialize camera with smooth following
    this.camera = new Camera({
      smoothing: 0.1,
      followThreshold: h / 2,
      enabled: true
    }, h);

    // // Initialize input controllers
    this.keyboardController = new KeyboardController(this.inputManager, {
      acceleration: 1200,
      upKeys: ['w', 'ArrowUp'],
      downKeys: ['s', 'ArrowDown'],
      leftKeys: ['a', 'ArrowLeft'],
      rightKeys: ['d', 'ArrowRight'],
      jumpKeys: [' ', 'Space']
    });

    this.accelerometerController = new AccelerometerController(this.inputManager, {
      acceleration: 800,  // Velocity magnitude (pixels/second) for direct control
      sensitivity: 2.5,   // Increased sensitivity for more responsive tilt
      deadZone: 0.0      // Slightly reduced dead zone for better responsiveness
    });

    // // Set initial active controller based on device capabilities
    this.activeController = this.inputManager.hasMotionPermission()
      ? this.accelerometerController
      : this.keyboardController;

    // // Initialize touch buttons
    this.initializeTouchButtons();

    // ===== ECS INITIALIZATION (Phase 2.4) =====
    this.initializeECS();
  }

  /**
   * Initialize ECS world and systems (Phase 3.2 - full system integration)
   */
  private initializeECS(): void {
    // Create ECS world
    this.ecsWorld = new ECSWorld();
    this.systemScheduler = new SystemScheduler();

    // Create ECS player at same position as OOP player
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();
    this.ecsPlayerEntity = createPlayer(this.ecsWorld, w / 2, h / 2);
    console.log('Created ECS player entity:', this.ecsPlayerEntity);

    // Register ECS systems in execution order (Phase 3.2)
    // 1. Input - read keyboard/accelerometer input
    this.systemScheduler.addSystem(new PlayerInputSystem(this.activeController));

    // 2. Player Physics - apply gravity and jump physics
    this.systemScheduler.addSystem(new PlayerPhysicsSystem());

    // 3. General Physics - integrate velocity into position
    this.systemScheduler.addSystem(new ECSPhysicsSystem());

    // 4. Boundary Collisions - clamp to screen edges
    this.systemScheduler.addSystem(new BoundaryCollisionSystem(this.renderer));

    // 5. Entity Collisions - detect and resolve collisions
    this.systemScheduler.addSystem(new CollisionSystem());

    // 6. Ground Detection - raycast for jump detection
    this.systemScheduler.addSystem(new GroundDetectionSystem());

    // 7. Velocity Cap - enforce max speed limits
    this.systemScheduler.addSystem(new VelocityCapSystem());

    // 8. Camera Follow - update camera to follow player
    this.systemScheduler.addSystem(new CameraFollowSystem(this.camera));

    // 9. Platform Spawning - spawn/despawn platforms dynamically
    this.systemScheduler.addSystem(new PlatformSpawnSystem(this.camera, this.renderer, {
      worldWidth: this.renderer.getWidth(),
      spawnDistance: 800,
      despawnDistance: 1000,
      initialPlatformCount: 8
    }));

    console.log('ECS initialized with', this.ecsWorld.getEntityCount(), 'entities');
    console.log('Registered', this.systemScheduler['systems'].length, 'ECS systems');
  }

  /**
   * Initialize touch button UI system
   */
  private initializeTouchButtons(): void {
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();

    // Create touch button manager with auto-hide enabled
    this.touchButtonManager = new TouchButtonManager({
      enableAutoHide: true,
      hideButtonsDelay: 3000,
      fadeOutDuration: 500
    });

    // Create buttons
    const pauseBtn = ButtonFactory.createPauseButton(
      { x: 60, y: h - 60 },
      () => this.pause()
    );

    const resumeBtn = ButtonFactory.createResumeButton(
      { x: 60, y: h - 60 },
      () => this.resume()
    );

    const restartBtn = ButtonFactory.createRestartButton(
      { x: w / 2, y: h - 80 },
      () => this.restart()
    );

    const debugBtn = ButtonFactory.createDebugToggleButton(
      { x: w - 60, y: h - 60 },
      () => this.debugSystem.toggle(DebugFeature.Raycasts)
    );

    // Only create accelerometer toggle if device has motion sensors
    if (this.inputManager.hasMotionSensors()) {
      const accelToggleBtn = ButtonFactory.createAccelerometerToggleButton(
        { x: w - 60, y: 60 },
        () => this.toggleAccelerometer()
      );
      this.touchButtonManager.addButton(accelToggleBtn);
    }

    // Add buttons to manager
    this.touchButtonManager.addButton(pauseBtn);
    this.touchButtonManager.addButton(resumeBtn);
    this.touchButtonManager.addButton(restartBtn);
    this.touchButtonManager.addButton(debugBtn);

    // Create visibility groups
    this.touchButtonManager.createGroup('gameplay', ['pause', 'debug']);
    this.touchButtonManager.createGroup('paused', ['resume', 'debug']);
    this.touchButtonManager.createGroup('gameOver', ['restart']);

    // Show initial group
    this.updateButtonVisibility();
  }

  /**
   * Update button visibility based on game state
   */
  private updateButtonVisibility(): void {
    if (this.gameOver) {
      this.touchButtonManager.showGroup('gameOver');
    } else if (this.gameLoop.isPaused()) {
      this.touchButtonManager.showGroup('paused');
    } else {
      this.touchButtonManager.showGroup('gameplay');
    }
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
    this.updateButtonVisibility();
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameLoop.resume();
    this.updateButtonVisibility();
  }

  /**
   * Update game state (called at fixed timestep)
   * @param dt - Fixed delta time in seconds
   */
  private update(dt: number): void {
    // // Don't update game logic if game over
    if (this.gameOver) {
      return;
    }
    // Check for game over
    if (this.checkGameOver()) {
      this.handleGameOver();
    }
    // Update ECS physics systems (runs in parallel with OOP)
    this.systemScheduler.update(dt, this.ecsWorld);
  }

  /**
   * Render current frame
   */
  private render(): void {
    // Handle touch input for buttons (runs even when paused)
    if (this.inputManager.isTouchActive()) {
      const touches = this.inputManager.getTouches();
      this.touchButtonManager.handleTouchStart(touches);
    } else {
      // Release all button presses when no touches active
      this.touchButtonManager.handleAllTouchesEnd();
    }

    // Update button manager with frame time estimate (runs even when paused)
    // Using fixed 16.67ms (60 FPS) since we don't have dt in render
    this.fpsCounter.update();

    // Clear canvas
    this.renderer.clear();
    this.renderer.fillBackground('#1a1a2e');

    // Apply camera transform for world-space rendering
    const ctx = this.renderer.getCanvasContext();
    this.camera.applyTransform(ctx);

    // ===== ECS RENDERING (Phase 2.4) =====
    // Render ECS entities (runs in parallel with OOP)
    const ecsRenderSystem = new ECSRenderSystem(this.renderer);
    ecsRenderSystem.update(0, this.ecsWorld); // dt not used for rendering

    // Reset camera transform for UI rendering (screen space)
    this.camera.resetTransform(ctx);

    // Render HUD/UI
    const uiState: UIGameState = {
      fps: this.fpsCounter.getFPS(),
      paused: this.gameLoop.isPaused(),
      useAccelerometer: this.inputManager.hasMotionPermission(),
      showPermissionPrompt: this.showPermissionButton,
      hasMotionSensors: this.inputManager.hasMotionSensors(),
      hasMotionPermission: this.inputManager.hasMotionPermission(),
      score: this.scoreSystem.getCurrentScore(),
      highScore: this.scoreSystem.getHighScore(),
      gameOver: this.gameOver,
      isNewHighScore: this.scoreSystem.isNewHighScore()
    };

    this.hud.render(this.renderer, uiState);

    // Render touch buttons (last, on top of everything)
    this.touchButtonManager.render(this.renderer);
  }

  /**
   * Check if game over condition is met (player fell below camera)
   * 
   * @returns True if player has fallen below camera view
   */
  private checkGameOver(): boolean {
    const playerY = this.ecsWorld.getComponent(this.ecsPlayerEntity, Transform.type)?.y ?? 0;
    const cameraBottom = this.camera.getPosition().y + this.renderer.getHeight();
    // Player fell below camera view
    return playerY > cameraBottom;
  }

  /**
   * Handle game over state
   */
  private handleGameOver(): void {
    this.gameOver = true;
    this.updateButtonVisibility();
    console.log('Game Over! Final score:', this.scoreSystem.getCurrentScore());
  }

  /**
   * Restart the game
   */
  private restart(): void {
    console.log('Restarting game...');

    // Reset score system (keeps high score)
    this.scoreSystem.reset();

    // Reinitialize game state
    this.initialize();
  }

  /**
   * Get the game loop instance
   */
  getGameLoop(): GameLoop {
    return this.gameLoop;
  }
}
