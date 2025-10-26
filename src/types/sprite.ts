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
 * Animation playback mode
 */
export enum AnimationPlaybackMode {
  /** Play once and stop on last frame */
  Once = 'once',
  /** Loop continuously */
  Loop = 'loop',
  /** Play forward then backward repeatedly */
  PingPong = 'pingpong'
}

/**
 * Current state of animation playback
 */
export enum AnimationState {
  /** Animation is playing */
  Playing = 'playing',
  /** Animation is paused (can resume) */
  Paused = 'paused',
  /** Animation is stopped (reset to first frame) */
  Stopped = 'stopped',
  /** Animation completed (one-shot animations only) */
  Complete = 'complete'
}

/**
 * Animation frame definition
 */
export interface AnimationFrame {
  /** Sprite reference for this frame */
  sprite: SpriteReference;
  /** Duration to display this frame (seconds) */
  duration: number;
}

/**
 * Animation definition
 */
export interface Animation {
  /** Unique name for this animation */
  name: string;
  /** Array of frames in the animation */
  frames: AnimationFrame[];
  /** Playback mode (loop, once, pingpong) */
  mode: AnimationPlaybackMode;
}

/**
 * Animation event callback types
 */
export type AnimationEventCallback = (animationName: string) => void;

/**
 * Animation event handlers
 */
export interface AnimationEventHandlers {
  /** Called when animation completes (one-shot only) */
  onComplete?: AnimationEventCallback;
  /** Called each time animation loops */
  onLoop?: AnimationEventCallback;
  /** Called when animation starts playing */
  onStart?: AnimationEventCallback;
  /** Called when animation is stopped */
  onStop?: AnimationEventCallback;
}

/**
 * Configuration for loading multiple animations
 */
export interface AnimationConfig {
  /** Default animation to play on start */
  defaultAnimation: string;
  /** Map of animation definitions */
  animations: Record<string, Animation>;
  /** Optional event handlers */
  handlers?: AnimationEventHandlers;
}
