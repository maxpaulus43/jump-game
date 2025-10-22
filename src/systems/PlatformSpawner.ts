/**
 * PlatformSpawner.ts
 * 
 * Manages procedural platform generation for infinite climbing gameplay
 * Spawns platforms ahead of player and despawns platforms below camera
 */

import { Platform } from '../entities/Platform.js';
import { World } from '../core/World.js';
import { Vec2 } from '../utils/Vec2.js';
import type { PlatformConfig } from '../types/index.js';

/**
 * Configuration for platform spawner
 */
export interface PlatformSpawnerConfig {
  worldWidth: number;
  spawnDistance: number;        // How far ahead to spawn platforms
  despawnDistance: number;      // How far below camera to remove platforms
  initialPlatformCount: number; // Number of platforms to spawn at start
}

/**
 * PlatformSpawner generates and manages platforms procedurally
 */
export class PlatformSpawner {
  private config: PlatformSpawnerConfig;
  private world: World | null = null;
  private lastSpawnY: number = 0;
  private lastPlatformX: number = 0;
  private lastPlatformWidth: number = 150;

  constructor(config: PlatformSpawnerConfig) {
    this.config = config;
  }

  /**
   * Initialize spawner and create initial platforms
   * 
   * @param world - World instance to add platforms to
   * @param startY - Starting Y position (player's initial Y)
   */
  initialize(world: World, startY: number): void {
    this.world = world;
    this.lastSpawnY = startY;
    this.lastPlatformX = this.config.worldWidth / 2;

    // Spawn initial batch of platforms
    for (let i = 0; i < this.config.initialPlatformCount; i++) {
      this.spawnPlatform();
    }
  }

  /**
   * Reset spawner state for new game
   * 
   * @param startY - Starting Y position
   */
  reset(startY: number): void {
    this.lastSpawnY = startY;
    this.lastPlatformX = this.config.worldWidth / 2;
    this.lastPlatformWidth = 150;
  }

  /**
   * Update spawner - spawn new platforms and despawn old ones
   * 
   * @param playerY - Current player Y position
   * @param cameraY - Current camera Y position
   */
  update(playerY: number, cameraY: number): void {
    if (!this.world) {
      console.warn('PlatformSpawner not initialized');
      return;
    }

    // Spawn new platforms if player is getting close to spawn threshold
    const spawnThreshold = this.lastSpawnY + this.config.spawnDistance;
    if (playerY < spawnThreshold) {
      this.spawnPlatformBatch();
    }

    // Despawn platforms below camera
    this.despawnPlatformsBelowCamera(cameraY);
  }

  /**
   * Spawn a batch of platforms (3-5 at a time)
   */
  private spawnPlatformBatch(): void {
    const batchSize = this.randomInt(3, 5);
    for (let i = 0; i < batchSize; i++) {
      this.spawnPlatform();
    }
  }

  /**
   * Spawn a single platform with difficulty scaling
   */
  private spawnPlatform(): void {
    if (!this.world) return;

    // Calculate difficulty based on height climbed
    const difficulty = this.calculateDifficulty();

    // Generate platform properties with difficulty scaling
    const spacing = this.calculateSpacing(difficulty);
    const width = this.calculateWidth(difficulty);
    const x = this.calculateXPosition(width);
    const y = this.lastSpawnY - spacing;

    // Create and add platform
    const platformConfig: PlatformConfig = {
      position: { x, y },
      width: width,
      height: 20
    };

    const platform = new Platform(platformConfig);
    this.world.addEntity(platform);

    // Update state for next platform
    this.lastSpawnY = y;
    this.lastPlatformX = x;
    this.lastPlatformWidth = width;
  }

  /**
   * Calculate difficulty multiplier based on height climbed
   * Returns value from 1.0 (easy) to 2.0 (hard)
   * 
   * @returns Difficulty multiplier
   */
  private calculateDifficulty(): number {
    const heightClimbed = Math.abs(this.lastSpawnY);
    // Difficulty increases linearly up to 5000 pixels height
    const difficultyFactor = Math.min(heightClimbed / 5000, 1.0);
    return 1.0 + difficultyFactor;
  }

  /**
   * Calculate vertical spacing between platforms based on difficulty
   * 
   * @param difficulty - Difficulty multiplier (1.0 - 2.0)
   * @returns Spacing in pixels
   */
  private calculateSpacing(difficulty: number): number {
    const baseSpacing = 120;
    const maxSpacing = 280;
    const spacing = baseSpacing + (maxSpacing - baseSpacing) * (difficulty - 1.0);
    
    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    return spacing * randomFactor;
  }

  /**
   * Calculate platform width based on difficulty
   * 
   * @param difficulty - Difficulty multiplier (1.0 - 2.0)
   * @returns Width in pixels
   */
  private calculateWidth(difficulty: number): number {
    const baseWidth = 150;
    const minWidth = 80;
    const width = baseWidth - (baseWidth - minWidth) * (difficulty - 1.0);
    
    // Add some randomness (±15%)
    const randomFactor = 0.85 + Math.random() * 0.3;
    return Math.max(minWidth, width * randomFactor);
  }

  /**
   * Calculate X position ensuring platform is reachable
   * 
   * @param platformWidth - Width of the platform to spawn
   * @returns X position
   */
  private calculateXPosition(platformWidth: number): number {
    // Maximum horizontal distance player can travel while jumping
    // Based on player physics: max horizontal velocity * jump time
    const maxHorizontalReach = 350;

    // Calculate valid X range (within reach of last platform)
    const lastPlatformCenter = this.lastPlatformX + this.lastPlatformWidth / 2;
    const minX = Math.max(20, lastPlatformCenter - maxHorizontalReach);
    const maxX = Math.min(this.config.worldWidth - platformWidth - 20, lastPlatformCenter + maxHorizontalReach);

    // Ensure valid range
    if (minX >= maxX) {
      // Fallback to center if range is invalid
      return (this.config.worldWidth - platformWidth) / 2;
    }

    // Random position within valid range
    return this.randomFloat(minX, maxX);
  }

  /**
   * Remove platforms that have fallen below the camera view
   * 
   * @param cameraY - Current camera Y position (top edge)
   */
  private despawnPlatformsBelowCamera(cameraY: number): void {
    if (!this.world) return;

    const despawnThreshold = cameraY + this.config.despawnDistance;
    const platforms = this.world.getPlatforms();

    // Remove platforms below threshold
    for (const platform of platforms) {
      if (platform.getPosition().y > despawnThreshold) {
        this.world.removeEntity(platform);
      }
    }
  }

  /**
   * Get random integer between min and max (inclusive)
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get random float between min and max
   */
  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Get the last spawned Y position (for debugging)
   */
  getLastSpawnY(): number {
    return this.lastSpawnY;
  }
}
