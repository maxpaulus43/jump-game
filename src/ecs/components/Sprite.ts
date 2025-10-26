import type { ComponentType } from '../types.js';
import type { SpriteReference } from '../../types/sprite.js';

/**
 * ECS component for sprite-based rendering.
 * 
 * Entities with a Sprite component will be rendered using an image from a sprite sheet
 * instead of solid colored shapes. The sprite component references a specific frame
 * within a loaded sprite sheet.
 * 
 * @example
 * ```typescript
 * // Add sprite to entity
 * const sprite = new Sprite('placeholder', 'player', 32, 32, 10);
 * world.addComponent(entity, sprite);
 * ```
 */
export class Sprite {
  static readonly type: ComponentType<Sprite> = 'Sprite';

  /**
   * ID of the sprite sheet containing this sprite
   */
  public sheetId: string;

  /**
   * Name of the frame within the sprite sheet
   */
  public frameName: string;

  /**
   * Optional width override for scaling (pixels).
   * If not set, uses the frame's natural width.
   */
  public width?: number;

  /**
   * Optional height override for scaling (pixels).
   * If not set, uses the frame's natural height.
   */
  public height?: number;

  /**
   * Draw order layer (higher = drawn on top).
   * Similar to Renderable component's layer property.
   */
  public layer: number;

  /**
   * Creates a new Sprite component.
   * 
   * @param sheetId - ID of the sprite sheet containing this sprite
   * @param frameName - Name of the frame within the sprite sheet
   * @param width - Optional width override for scaling
   * @param height - Optional height override for scaling
   * @param layer - Draw order (default: 0, higher = on top)
   */
  constructor(
    sheetId: string,
    frameName: string,
    width?: number,
    height?: number,
    layer: number = 0
  ) {
    this.sheetId = sheetId;
    this.frameName = frameName;
    this.width = width;
    this.height = height;
    this.layer = layer;
  }

  /**
   * Returns a sprite reference object for this component.
   * Used by the SpriteSheetManager to look up the sprite frame.
   */
  getSpriteReference(): SpriteReference {
    return {
      sheetId: this.sheetId,
      frameName: this.frameName,
    };
  }
}
