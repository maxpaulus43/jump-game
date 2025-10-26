import type {
  SpriteSheet,
  SpriteSheetConfig,
  SpriteReference,
  SpriteFrame,
} from '../types/sprite.js';

/**
 * Centralized manager for loading and accessing sprite sheets.
 * 
 * Uses singleton pattern to ensure a single source of truth for all sprite sheet data.
 * Handles async image loading and provides efficient lookup methods for sprite frames.
 * 
 * @example
 * ```typescript
 * const manager = SpriteSheetManager.getInstance();
 * await manager.loadSpriteSheet(config);
 * const frame = manager.getFrame({ sheetId: 'placeholder', frameName: 'player' });
 * ```
 */
export class SpriteSheetManager {
  private static instance: SpriteSheetManager | null = null;
  
  /**
   * Map of loaded sprite sheets, keyed by sheet ID
   */
  private spriteSheets: Map<string, SpriteSheet> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Gets the singleton instance of the SpriteSheetManager.
   * Creates the instance if it doesn't exist.
   * 
   * @returns The singleton SpriteSheetManager instance
   */
  static getInstance(): SpriteSheetManager {
    if (!SpriteSheetManager.instance) {
      SpriteSheetManager.instance = new SpriteSheetManager();
    }
    return SpriteSheetManager.instance;
  }

  /**
   * Loads a sprite sheet from a configuration.
   * 
   * Creates an HTMLImageElement, loads the image from the provided path,
   * and caches the sprite sheet data for future lookups. If a sprite sheet
   * with the same ID is already loaded, it will be replaced.
   * 
   * @param config - Configuration object containing image path and frame definitions
   * @returns Promise that resolves when the image is loaded
   * @throws Error if image fails to load
   * 
   * @example
   * ```typescript
   * const config = {
   *   id: 'characters',
   *   imagePath: 'assets/characters.png',
   *   frames: {
   *     'player': { x: 0, y: 0, width: 32, height: 32 },
   *     'enemy': { x: 32, y: 0, width: 32, height: 32 }
   *   }
   * };
   * await manager.loadSpriteSheet(config);
   * ```
   */
  async loadSpriteSheet(config: SpriteSheetConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        // Convert frames Record to Map for efficient lookups
        const framesMap = new Map<string, SpriteFrame>();
        for (const [name, frame] of Object.entries(config.frames)) {
          framesMap.set(name, frame);
        }

        // Create and store sprite sheet
        const spriteSheet: SpriteSheet = {
          id: config.id,
          image,
          width: image.width,
          height: image.height,
          frames: framesMap,
        };

        this.spriteSheets.set(config.id, spriteSheet);
        console.log(`Loaded sprite sheet: ${config.id} (${image.width}x${image.height})`);
        resolve();
      };

      image.onerror = () => {
        reject(new Error(`Failed to load sprite sheet: ${config.id} from ${config.imagePath}`));
      };

      // Start loading the image
      image.src = config.imagePath;
    });
  }

  /**
   * Retrieves a loaded sprite sheet by ID.
   * 
   * @param sheetId - The unique identifier of the sprite sheet
   * @returns The sprite sheet if found, undefined otherwise
   * 
   * @example
   * ```typescript
   * const sheet = manager.getSpriteSheet('placeholder');
   * if (sheet) {
   *   console.log(`Sheet dimensions: ${sheet.width}x${sheet.height}`);
   * }
   * ```
   */
  getSpriteSheet(sheetId: string): SpriteSheet | undefined {
    return this.spriteSheets.get(sheetId);
  }

  /**
   * Gets a specific frame from a sprite sheet.
   * 
   * Looks up both the sprite sheet and the frame within it, returning
   * both if found. This is the primary method used by the rendering system.
   * 
   * @param ref - Reference containing sheet ID and frame name
   * @returns Object with sheet and frame, or undefined if not found
   * 
   * @example
   * ```typescript
   * const result = manager.getFrame({
   *   sheetId: 'placeholder',
   *   frameName: 'player'
   * });
   * if (result) {
   *   const { sheet, frame } = result;
   *   // Use sheet.image and frame coordinates for rendering
   * }
   * ```
   */
  getFrame(ref: SpriteReference): { sheet: SpriteSheet; frame: SpriteFrame } | undefined {
    const sheet = this.spriteSheets.get(ref.sheetId);
    if (!sheet) {
      return undefined;
    }

    const frame = sheet.frames.get(ref.frameName);
    if (!frame) {
      return undefined;
    }

    return { sheet, frame };
  }

  /**
   * Checks if a sprite sheet is loaded.
   * 
   * @param sheetId - The ID of the sprite sheet to check
   * @returns true if the sprite sheet is loaded, false otherwise
   * 
   * @example
   * ```typescript
   * if (manager.isLoaded('placeholder')) {
   *   // Safe to use the sprite sheet
   * }
   * ```
   */
  isLoaded(sheetId: string): boolean {
    return this.spriteSheets.has(sheetId);
  }

  /**
   * Clears all cached sprite sheets.
   * 
   * Useful for freeing memory or reloading assets.
   * 
   * @example
   * ```typescript
   * manager.clear();
   * // All sprite sheets must be reloaded
   * ```
   */
  clear(): void {
    this.spriteSheets.clear();
    console.log('Cleared all sprite sheets');
  }

  /**
   * Gets the total number of loaded sprite sheets.
   * 
   * @returns The number of loaded sprite sheets
   */
  getLoadedCount(): number {
    return this.spriteSheets.size;
  }
}
