import type { Renderer } from '../../types/renderer.js';
import type { ScoreManager } from '../ScoreManager.js';

export interface HUDConfig {
  position?: {
    score: { x: number; y: number };
    highScore: { x: number; y: number };
    fps: { x: number; y: number };
  };
  colors?: {
    primary: string;
    secondary: string;
    highlight: string;
  };
  fonts?: {
    large: string;
    medium: string;
    small: string;
  };
}

/**
 * HUDRenderer handles canvas-based HUD elements
 * Renders score, FPS, and other real-time info directly to canvas
 */
export class HUDRenderer {
  private renderer: Renderer;
  private scoreManager: ScoreManager;
  private config: Required<HUDConfig>;
  private fps: number = 60;
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;

  constructor(
    renderer: Renderer,
    scoreManager: ScoreManager,
    config: HUDConfig = {}
  ) {
    this.renderer = renderer;
    this.scoreManager = scoreManager;
    
    // Default configuration
    this.config = {
      position: config.position ?? {
        score: { x: 20, y: 40 },
        highScore: { x: 20, y: 75 },
        fps: { x: 20, y: 110 }
      },
      colors: config.colors ?? {
        primary: '#00ff88',
        secondary: '#888888',
        highlight: '#ffffff'
      },
      fonts: config.fonts ?? {
        large: 'bold 28px monospace',
        medium: 'bold 20px monospace',
        small: '16px monospace'
      }
    };
  }

  /**
   * Update FPS counter
   * Call this every frame
   */
  updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.lastFPSUpdate += deltaTime;

    // Update FPS every 0.5 seconds
    if (this.lastFPSUpdate >= 0.5) {
      this.fps = this.frameCount / this.lastFPSUpdate;
      this.frameCount = 0;
      this.lastFPSUpdate = 0;
    }
  }

  /**
   * Render the HUD
   * Call this after camera.resetTransform() to render in screen-space
   */
  render(): void {
    this.drawScore();
    this.drawHighScore();
    this.drawFPS();
  }

  private drawScore(): void {
    const score = this.scoreManager.getCurrentScore();
    const pos = this.config.position.score;
    
    // Draw label
    this.renderer.drawText(
      'Score',
      pos.x,
      pos.y - 20,
      this.config.colors.secondary,
      this.config.fonts.small
    );
    
    // Draw value
    this.renderer.drawText(
      score.toString(),
      pos.x,
      pos.y,
      this.config.colors.primary,
      this.config.fonts.large
    );
  }

  private drawHighScore(): void {
    const highScore = this.scoreManager.getHighScore();
    const pos = this.config.position.highScore;
    
    // Draw label and value on same line
    this.renderer.drawText(
      `High: ${highScore}`,
      pos.x,
      pos.y,
      this.config.colors.secondary,
      this.config.fonts.medium
    );
  }

  private drawFPS(): void {
    const pos = this.config.position.fps;
    
    // Color-code FPS (green > 55, yellow > 45, red otherwise)
    let color = this.config.colors.primary;
    if (this.fps < 45) {
      color = '#ff4444';
    } else if (this.fps < 55) {
      color = '#ffaa00';
    }
    
    this.renderer.drawText(
      `FPS: ${this.fps.toFixed(1)}`,
      pos.x,
      pos.y,
      color,
      this.config.fonts.small
    );
  }

  /**
   * Draw a temporary floating text message
   * Useful for feedback (e.g., "Jump!")
   */
  drawFloatingText(
    text: string,
    x: number,
    y: number,
    color: string = this.config.colors.highlight
  ): void {
    this.renderer.drawText(
      text,
      x,
      y,
      color,
      this.config.fonts.medium
    );
  }
}
