import { System } from '../System.js';
import type { ECSWorld } from '../ECSWorld.js';
import { Transform } from '../components/Transform.js';
import { CameraTarget } from '../components/CameraTarget.js';
import { Platform, PlatformType } from '../components/Platform.js';
import { createPlatform } from '../prefabs/PlatformPrefab.js';
import type { Camera } from '../../systems/Camera.js';
import type { Renderer } from '../../types/renderer.js';

/**
 * Configuration for platform spawner
 */
export interface PlatformSpawnSystemConfig {
    worldWidth: number;
    spawnDistance: number;        // How far ahead to spawn platforms
    despawnDistance: number;      // How far below camera to remove platforms
    initialPlatformCount: number; // Number of platforms to spawn at start
}

/**
 * PlatformSpawnSystem manages procedural platform generation
 * 
 * Spawns platforms ahead of player and despawns platforms below camera
 * Implements difficulty scaling based on height climbed
 */
export class PlatformSpawnSystem extends System {
    readonly name = 'PlatformSpawnSystem';

    private camera: Camera;
    private spawnDistance: number;
    private despawnDistance: number;
    private worldWidth: number;
    private initialPlatformCount: number = 8;

    private lastSpawnY: number = 0;
    private lastPlatformX: number = 0;
    private lastPlatformWidth: number = 150;
    private initialized: boolean = false;

    constructor(camera: Camera, renderer: Renderer, config?: Partial<PlatformSpawnSystemConfig>) {
        super();
        this.camera = camera;
        this.worldWidth = config?.worldWidth || renderer.getWidth();
        this.spawnDistance = config?.spawnDistance || 800;
        this.despawnDistance = config?.despawnDistance || 1000;
    }

    update(_dt: number, world: ECSWorld): void {
        // Initialize if needed
        if (!this.initialized) {
            this.initialize(world);
            this.initialized = true;
        }

        // Get player position
        const playerTargets = world.query({
            with: [Transform.type, CameraTarget.type]
        });

        if (playerTargets.length === 0) {
            return; // No player to spawn around
        }

        const playerTransform = world.getComponent(playerTargets[0], Transform.type)!;
        const playerY = playerTransform.y;
        const cameraY = this.camera.getPosition().y;

        // Spawn new platforms if player is getting close to spawn threshold
        const spawnThreshold = this.lastSpawnY + this.spawnDistance;
        if (playerY < spawnThreshold) {
            this.spawnPlatformBatch(world);
        }

        // Despawn platforms below camera
        this.despawnPlatformsBelowCamera(world, cameraY);
    }

    /**
     * Initialize spawner with player position
     */
    private initialize(world: ECSWorld): void {
        const playerTargets = world.query({
            with: [Transform.type, CameraTarget.type]
        });

        if (playerTargets.length > 0) {
            const playerTransform = world.getComponent(playerTargets[0], Transform.type)!;
            this.lastSpawnY = playerTransform.y;
            this.lastPlatformX = this.worldWidth / 2;
        }

        if (this.initialPlatformCount) {
            for (let i = 0; i < this.initialPlatformCount; i++) {
                this.spawnPlatform(world);
            }
        }
    }

    /**
     * Spawn a batch of platforms (3-5 at a time)
     */
    private spawnPlatformBatch(world: ECSWorld): void {
        const batchSize = this.randomInt(3, 5);
        for (let i = 0; i < batchSize; i++) {
            this.spawnPlatform(world);
        }
    }

    /**
     * Spawn a single platform with difficulty scaling
     */
    private spawnPlatform(world: ECSWorld): void {
        // Calculate difficulty based on height climbed
        const difficulty = this.calculateDifficulty();

        // Generate platform properties with difficulty scaling
        const spacing = this.calculateSpacing(difficulty);
        const width = this.calculateWidth(difficulty);
        const x = this.calculateXPosition(width);
        const y = this.lastSpawnY - spacing;

        // Create platform entity
        createPlatform(world, x, y, width, 20, PlatformType.Standard);

        // Update state for next platform
        this.lastSpawnY = y;
        this.lastPlatformX = x;
        this.lastPlatformWidth = width;
    }

    /**
     * Calculate difficulty multiplier based on height climbed
     * Returns value from 1.0 (easy) to 2.0 (hard)
     */
    private calculateDifficulty(): number {
        const heightClimbed = Math.abs(this.lastSpawnY);
        // Difficulty increases linearly up to 5000 pixels height
        const difficultyFactor = Math.min(heightClimbed / 5000, 1.0);
        return 1.0 + difficultyFactor;
    }

    /**
     * Calculate vertical spacing between platforms based on difficulty
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
     */
    private calculateXPosition(platformWidth: number): number {
        // Maximum horizontal distance player can travel while jumping
        const maxHorizontalReach = 350;

        // Calculate valid X range (within reach of last platform)
        const lastPlatformCenter = this.lastPlatformX + this.lastPlatformWidth / 2;
        const minX = Math.max(20, lastPlatformCenter - maxHorizontalReach);
        const maxX = Math.min(this.worldWidth - platformWidth - 20, lastPlatformCenter + maxHorizontalReach);

        // Ensure valid range
        if (minX >= maxX) {
            // Fallback to center if range is invalid
            return (this.worldWidth - platformWidth) / 2;
        }

        // Random position within valid range
        return this.randomFloat(minX, maxX);
    }

    /**
     * Remove platforms that have fallen below the camera view
     */
    private despawnPlatformsBelowCamera(world: ECSWorld, cameraY: number): void {
        const despawnThreshold = cameraY + this.despawnDistance;
        const platforms = world.query({
            with: [Transform.type, Platform.type]
        });

        // Remove platforms below threshold
        for (const platform of platforms) {
            const transform = world.getComponent(platform, Transform.type)!;
            if (transform.y > despawnThreshold) {
                world.destroyEntity(platform);
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
}
