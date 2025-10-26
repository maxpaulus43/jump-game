/**
 * Represents a rectangular region within a sprite sheet
 */
export interface SpriteFrame {
  /** X position of top-left corner in sprite sheet (pixels) */
  x: number;
  /** Y position of top-left corner in sprite sheet (pixels) */
  y: number;
  /** Width of the sprite frame (pixels) */
  width: number;
  /** Height of the sprite frame (pixels) */
  height: number;
}

/**
 * A loaded sprite sheet image with metadata
 */
export interface SpriteSheet {
  /** Unique identifier for this sprite sheet */
  id: string;
  /** The loaded HTMLImageElement */
  image: HTMLImageElement;
  /** Width of the entire sprite sheet */
  width: number;
  /** Height of the entire sprite sheet */
  height: number;
  /** Map of named sprite frames within this sheet */
  frames: Map<string, SpriteFrame>;
}

/**
 * Configuration for loading a sprite sheet
 */
export interface SpriteSheetConfig {
  /** Unique ID for this sprite sheet */
  id: string;
  /** Path or URL to the image file */
  imagePath: string;
  /** Frame definitions within the sheet */
  frames: Record<string, SpriteFrame>;
}

/**
 * Reference to a specific sprite frame
 */
export interface SpriteReference {
  /** ID of the sprite sheet containing this sprite */
  sheetId: string;
  /** Name of the frame within the sprite sheet */
  frameName: string;
}

/**
 * Animation frame definition (placeholder for future animation support)
 */
export interface AnimationFrame {
  /** Sprite reference for this frame */
  sprite: SpriteReference;
  /** Duration to display this frame (seconds) */
  duration: number;
}

/**
 * Animation definition (placeholder for future animation support)
 */
export interface Animation {
  /** Unique name for this animation */
  name: string;
  /** Array of frames in the animation */
  frames: AnimationFrame[];
  /** Whether the animation should loop */
  loop: boolean;
}
