import { GameLoop } from './GameLoop.js';
import { InputManager } from '../managers/input/InputManager.js';
import { AccelerometerController } from '../managers/input/AccelerometerController.js';
import { CameraManager } from '../managers/CameraManager.js';
import { ScoreManager } from '../managers/ScoreManager.js';
import { HUDRenderer } from '../managers/ui/HUDRenderer.js';
import { UIManager } from '../managers/ui/UIManager.js';
import { Renderer } from '../types/renderer.js';
import { World } from '../ecs/World.js';
import { SystemScheduler } from '../ecs/systems/SystemScheduler.js';
import { createPlayer } from '../ecs/entities/Player.js';
import type { Entity } from '../ecs/types.js';
import { Transform } from '../ecs/components/Transform.js';
import { PlayerInputSystem } from '../ecs/systems/PlayerInputSystem.js';
import { PlayerPhysicsSystem } from '../ecs/systems/PlayerPhysicsSystem.js';
import { PhysicsSystem } from '../ecs/systems/physics/PhysicsSystem.js';
import { BoundaryCollisionSystem } from '../ecs/systems/BoundaryCollisionSystem.js';
import { CollisionSystem } from '../ecs/systems/CollisionSystem.js';
import { GroundDetectionSystem } from '../ecs/systems/GroundDetectionSystem.js';
import { VelocityCapSystem } from '../ecs/systems/VelocityCapSystem.js';
import { CameraFollowSystem } from '../ecs/systems/CameraFollowSystem.js';
import { PlatformSpawnSystem } from '../ecs/systems/PlatformSpawnSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';

/**
 * Game class orchestrates all game systems
 * Manages the game lifecycle and coordinates between subsystems
 */
export class Game {
  public readonly renderer: Renderer;
  public readonly inputManager: InputManager;
  public readonly gameLoop: GameLoop;

  private world!: World;
  private systemScheduler!: SystemScheduler;
  private playerEntity!: Entity;

  // Manager
  private camera!: CameraManager;
  private scoreManager: ScoreManager;
  private renderManager: RenderSystem;
  private inputController: AccelerometerController;
  private hudRenderer: HUDRenderer;
  private uiManager: UIManager;

  // Game state
  private gameOver: boolean = false;

  constructor(renderer: Renderer, inputManager: InputManager) {
    this.renderer = renderer;
    this.inputManager = inputManager;
    this.renderManager = new RenderSystem(this.renderer);
    this.scoreManager = new ScoreManager();
    const h = this.renderer.getHeight();

    this.gameLoop = new GameLoop({
      targetFPS: 60,
      maxDeltaTime: 0.25 // Prevent spiral of death
    });
    this.camera = new CameraManager({
      smoothing: 0.1,
      followThreshold: h / 2,
      enabled: true
    }, h);
    this.inputController = new AccelerometerController(this.inputManager, {
      acceleration: 800,  // Velocity magnitude (pixels/second) for direct control
      sensitivity: 2.4,   // Increased sensitivity for more responsive tilt
      deadZone: 0.0      // Slightly reduced dead zone for better responsiveness
    });

    // Initialize UI systems
    this.hudRenderer = new HUDRenderer(
      this.renderer,
      this.scoreManager,
      {
        colors: {
          primary: '#00ff88',
          secondary: '#888888',
          highlight: '#ffffff'
        }
      }
    );

    this.uiManager = new UIManager({
      onResume: () => this.resume(),
      onRestart: () => this.restart(),
      onQuit: () => {
        this.stop();
        window.location.reload();
      }
    });

    // Add pause key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
      }
    });

    this.initializeECS();
  }

  /**
   * Initialize ECS world and systems (Phase 3.2 - full system integration)
   */
  private initializeECS(): void {
    // Create ECS world
    this.world = new World();
    this.systemScheduler = new SystemScheduler();

    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();
    this.playerEntity = createPlayer(this.world, w / 2, h / 2);
    console.log('Created ECS player entity:', this.playerEntity);

    // Register ECS systems in execution order (Phase 3.2)
    // 1. Input - read keyboard/accelerometer input
    this.systemScheduler.addSystem(new PlayerInputSystem(this.inputController));
    // 2. Player Physics - apply gravity and jump physics
    this.systemScheduler.addSystem(new PlayerPhysicsSystem());
    // 3. General Physics - integrate velocity into position
    this.systemScheduler.addSystem(new PhysicsSystem());
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

    console.log('ECS initialized with', this.world.getEntityCount(), 'entities');
    console.log('Registered', this.systemScheduler['systems'].length, 'ECS systems');
  }

  /**
   * Update game state (called at fixed timestep)
   * @param dt - Fixed delta time in seconds
   */
  private update(dt: number): void {
    // Don't update game logic if game over or paused
    if (this.gameOver || this.uiManager.getState() !== 'playing') {
      return;
    }

    // Update score based on player position
    const playerTransform = this.world.getComponent(
      this.playerEntity,
      Transform.type
    );
    if (playerTransform) {
      this.scoreManager.update(playerTransform.y);
    }

    // Update HUD FPS counter
    this.hudRenderer.updateFPS(dt);

    // Check for game over
    if (this.checkGameOver()) {
      this.gameOver = true;
      const score = this.scoreManager.getCurrentScore();
      const highScore = this.scoreManager.getHighScore();
      this.uiManager.showGameOver(score, highScore);
      console.log('Game Over! Final score:', score);
    }

    // Update ECS physics systems
    this.systemScheduler.update(dt, this.world);
  }

  /**
   * Render current frame
   */
  private render(): void {
    // Clear canvas
    this.renderer.clear();
    this.renderer.fillBackground('#1a1a2e');

    // Apply camera transform for world-space rendering
    const ctx = this.renderer.getCanvasContext();
    this.camera.applyTransform(ctx);

    this.renderManager.update(0, this.world);

    // Reset camera transform for UI rendering (screen space)
    this.camera.resetTransform(ctx);

    // Render HUD
    this.hudRenderer.render();
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
  * Check if game over condition is met (player fell below camera)
  * 
  * @returns True if player has fallen below camera view
  */
  private checkGameOver(): boolean {
    const playerY = this.world.getComponent(this.playerEntity, Transform.type)?.y ?? 0;
    const cameraBottom = this.camera.getPosition().y + this.renderer.getHeight();
    // Player fell below camera view
    return playerY > cameraBottom;
  }

  /**
   * Toggle pause state
   */
  private togglePause(): void {
    if (this.gameOver) return;

    if (this.uiManager.getState() === 'paused') {
      this.uiManager.hideOverlay();
      this.resume();
    } else if (this.uiManager.getState() === 'playing') {
      this.pause();
      this.uiManager.showPauseMenu();
    }
  }

  /**
   * Restart the game
   */
  private restart(): void {
    console.log('Restarting game...');
    this.gameOver = false;
    this.camera = new CameraManager({
      smoothing: 0.1,
      followThreshold: this.renderer.getHeight() / 2,
      enabled: true
    }, this.renderer.getHeight());
    this.scoreManager.reset();
    this.initializeECS();
    this.resume();
  }

  /**
   * Get the game loop instance
   */
  getGameLoop(): GameLoop {
    return this.gameLoop;
  }
}
