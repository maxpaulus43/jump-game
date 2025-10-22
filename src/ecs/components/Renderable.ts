import type { ComponentType } from '../types.js';

/**
 * Renderable component - defines visual appearance
 * 
 * Contains color and layer for rendering.
 * Layer determines draw order: lower layers drawn first (background),
 * higher layers drawn last (foreground).
 * 
 * @example
 * // Platform: blue, background layer
 * const platformRender = new Renderable('#4a90e2', 0);
 * 
 * // Player: yellow, foreground layer
 * const playerRender = new Renderable('#ffbf00ff', 10);
 */
export class Renderable {
  static readonly type: ComponentType<Renderable> = 'Renderable' as ComponentType<Renderable>;
  
  constructor(
    public color: string = '#ffffff',
    public layer: number = 0  // for draw order (higher = drawn later/on top)
  ) {}
}
