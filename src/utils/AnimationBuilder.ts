import type { Animation, AnimationFrame, AnimationPlaybackMode } from '../types/sprite.js';

/**
 * Create an animation definition
 * 
 * @param name - Unique name for this animation
 * @param frames - Array of animation frames
 * @param mode - Playback mode (loop, once, pingpong)
 * @returns Animation object
 * 
 * @example
 * ```typescript
 * const idleFrames = createFrameSequence('player', ['idle_0', 'idle_1'], 0.15);
 * const idleAnim = createAnimation('idle', idleFrames, AnimationPlaybackMode.Loop);
 * ```
 */
export function createAnimation(
  name: string,
  frames: AnimationFrame[],
  mode: AnimationPlaybackMode
): Animation {
  return {
    name,
    frames,
    mode
  };
}

/**
 * Create animation frames from a list of frame names
 * 
 * All frames will use the same duration and come from the same sprite sheet.
 * 
 * @param sheetId - ID of the sprite sheet containing these frames
 * @param frameNames - Array of frame names within the sprite sheet
 * @param duration - Duration for each frame (seconds)
 * @returns Array of AnimationFrame objects
 * 
 * @example
 * ```typescript
 * const frames = createFrameSequence('player', ['idle_0', 'idle_1', 'idle_2'], 0.15);
 * // Each frame displays for 0.15 seconds (6.67 fps)
 * ```
 */
export function createFrameSequence(
  sheetId: string,
  frameNames: string[],
  duration: number
): AnimationFrame[] {
  return frameNames.map(frameName => ({
    sprite: {
      sheetId,
      frameName
    },
    duration
  }));
}

/**
 * Create animation frames from a numbered sequence
 * 
 * Generates frame names like "prefix_0", "prefix_1", "prefix_2", etc.
 * All frames will use the same duration and come from the same sprite sheet.
 * 
 * @param sheetId - ID of the sprite sheet containing these frames
 * @param prefix - Prefix for frame names (e.g., "idle", "walk", "jump")
 * @param count - Number of frames to generate
 * @param duration - Duration for each frame (seconds)
 * @returns Array of AnimationFrame objects
 * 
 * @example
 * ```typescript
 * const frames = createNumberedSequence('player', 'walk', 8, 0.1);
 * // Generates: walk_0, walk_1, walk_2, walk_3, walk_4, walk_5, walk_6, walk_7
 * // Each frame displays for 0.1 seconds (10 fps)
 * ```
 */
export function createNumberedSequence(
  sheetId: string,
  prefix: string,
  count: number,
  duration: number
): AnimationFrame[] {
  const frameNames: string[] = [];
  for (let i = 0; i < count; i++) {
    frameNames.push(`${prefix}_${i}`);
  }
  return createFrameSequence(sheetId, frameNames, duration);
}
