import type { RenderContext } from '../../types/index.js';
import type { Renderer } from "../../types/renderer.js";
import { Sprite } from '../../ecs/components/Sprite.js';
import { SpriteSheetManager } from '../SpriteSheetManager.js';

/**
 * Renderer class handles all Canvas API interactions
 * Provides high-level drawing primitives and manages canvas state
 */
export class HTMLCanvasRenderer implements Renderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = context;

    // Initialize canvas size
    this.width = canvas.width;
    this.height = canvas.height;

    // Set up resize handling
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Draw a sprite from a sprite sheet.
   * 
   * Renders a sprite at the specified position with optional scaling.
   * Uses the SpriteSheetManager to look up the sprite frame data.
   * 
   * @param sprite - Sprite component with sheet ID and frame name
   * @param x - X position to draw (center)
   * @param y - Y position to draw (center)
   * @param width - Width to draw (if undefined, uses sprite's width or frame's width)
   * @param height - Height to draw (if undefined, uses sprite's height or frame's height)
   * 
   * @example
   * ```typescript
   * const sprite = new Sprite('placeholder', 'player', 32, 32);
   * renderer.drawSprite(sprite, 100, 100, 32, 32);
   * ```
   */
  drawSprite(sprite: Sprite, x: number, y: number, width: number, height: number): void {
    const spriteManager = SpriteSheetManager.getInstance();
    const spriteRef = sprite.getSpriteReference();
    const frameData = spriteManager.getFrame(spriteRef);

    if (!frameData) {
      // Sprite not found - fail silently or log warning
      // This allows fallback to Renderable component
      return;
    }

    const { sheet, frame } = frameData;

    // Determine final dimensions
    const finalWidth = width ?? sprite.width ?? frame.width;
    const finalHeight = height ?? sprite.height ?? frame.height;

    // Draw sprite centered at (x, y)
    const drawX = x - finalWidth / 2;
    const drawY = y - finalHeight / 2;

    // Use ctx.drawImage with 9 parameters for precise control
    // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
    this.ctx.drawImage(
      sheet.image,           // Source image
      frame.x,               // Source X
      frame.y,               // Source Y
      frame.width,           // Source width
      frame.height,          // Source height
      drawX,                 // Destination X
      drawY,                 // Destination Y
      finalWidth,            // Destination width
      finalHeight            // Destination height
    );
  }

  /**
   * Clear the entire canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Get the rendering context with current dimensions
   */
  getContext(): RenderContext {
    return {
      ctx: this.ctx,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Get the canvas 2D rendering context
   * Used by systems that need direct access to canvas transforms (e.g., Camera)
   */
  getCanvasContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Handle canvas resize to match window dimensions
   */
  resize(): void {
    // Set canvas size to match window
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Sync body height to prevent iOS Safari viewport stretching
    // This ensures consistency between CSS viewport units and JS measurements
    document.body.style.height = `${window.innerHeight}px`;

    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  /**
   * Draw a filled rectangle
   */
  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw a filled circle
   */
  drawCircle(x: number, y: number, radius: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw a line between two points
   */
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number = 1): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * Draw text on the canvas
   * 
   * @param text - Text to draw
   * @param x - X position
   * @param y - Y position
   * @param color - Text color
   * @param font - Font specification (e.g. "16px Arial")
   */
  drawText(text: string, x: number, y: number, color: string = '#ffffff', font: string = '16px Arial'): void {
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Fill the entire canvas with a solid color
   * 
   * @param color - Fill color
   */
  fillBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw a ray for debug visualization
   * 
   * @param originX - Ray origin X
   * @param originY - Ray origin Y
   * @param directionX - Ray direction X (should be normalized)
   * @param directionY - Ray direction Y (should be normalized)
   * @param maxDistance - Maximum ray length
   * @param color - Ray color
   * @param lineWidth - Line width
   */
  drawRay(
    originX: number,
    originY: number,
    directionX: number,
    directionY: number,
    maxDistance: number,
    color: string = '#ff00ff',
    lineWidth: number = 2
  ): void {
    const endX = originX + directionX * maxDistance;
    const endY = originY + directionY * maxDistance;

    // Draw the ray line
    this.drawLine(originX, originY, endX, endY, color, lineWidth);

    // Draw arrow head to show direction
    const arrowSize = 8;
    const arrowAngle = Math.PI / 6; // 30 degrees

    // Calculate arrow direction
    const angle = Math.atan2(directionY, directionX);

    // Calculate arrow points
    const arrow1X = endX - arrowSize * Math.cos(angle - arrowAngle);
    const arrow1Y = endY - arrowSize * Math.sin(angle - arrowAngle);
    const arrow2X = endX - arrowSize * Math.cos(angle + arrowAngle);
    const arrow2Y = endY - arrowSize * Math.sin(angle + arrowAngle);

    // Draw arrow head
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(arrow1X, arrow1Y);
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(arrow2X, arrow2Y);
    this.ctx.stroke();
  }

  /**
   * Draw a raycast hit point for debug visualization
   * 
   * @param hitX - Hit point X
   * @param hitY - Hit point Y
   * @param normalX - Surface normal X
   * @param normalY - Surface normal Y
   * @param color - Color for the hit point
   * @param normalLength - Length of the normal vector to draw
   */
  drawRaycastHit(
    hitX: number,
    hitY: number,
    normalX: number,
    normalY: number,
    color: string = '#00ff00',
    normalLength: number = 20
  ): void {
    // Draw hit point as a circle
    this.drawCircle(hitX, hitY, 4, color);

    // Draw surface normal
    const normalEndX = hitX + normalX * normalLength;
    const normalEndY = hitY + normalY * normalLength;
    this.drawLine(hitX, hitY, normalEndX, normalEndY, color, 2);

    // Draw small circle at end of normal
    this.drawCircle(normalEndX, normalEndY, 2, color);
  }

  getHeight(): number {
    return this.height;
  }
  getWidth(): number {
    return this.width;
  }
}
