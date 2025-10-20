import type { RenderContext } from '../types/index.js';

/**
 * Renderer class handles all Canvas API interactions
 * Provides high-level drawing primitives and manages canvas state
 */
export class Renderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public readonly width: number;
  public readonly height: number;

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
   * Handle canvas resize to match window dimensions
   */
  resize(): void {
    // Set canvas size to match window
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
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
   */
  drawText(text: string, x: number, y: number, color: string, font: string = '16px Arial'): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Fill the entire canvas with a color
   */
  fillBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Get canvas width
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Get canvas height
   */
  getHeight(): number {
    return this.height;
  }
}
