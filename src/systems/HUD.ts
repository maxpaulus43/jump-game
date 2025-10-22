/**
 * HUDRenderer.ts
 * 
 * Renders all UI/HUD elements including FPS counter, instructions,
 * pause indicator, and permission prompts.
 */

import { Renderer } from '../types/renderer.js';
import { HUDConfig, UIGameState } from '../types/ui.js';

/**
 * Manages UI/HUD rendering
 */
export class HUD {
  private config: HUDConfig;

  /**
   * Create a new HUD renderer
   * @param config - HUD configuration
   */
  constructor(config: HUDConfig = {
    showFPS: true,
    showInstructions: true,
    showPauseIndicator: true
  }) {
    this.config = config;
  }

  /**
   * Render all HUD elements
   * @param renderer - Renderer instance
   * @param state - Current game state
   */
  render(renderer: Renderer, state: UIGameState): void {
    // Render score (always visible)
    this.renderScore(renderer, state);

    if (this.config.showFPS) {
      this.renderFPS(renderer, state.fps);
    }

    if (this.config.showInstructions && !state.gameOver) {
      this.renderInstructions(renderer, state);
    }

    if (state.showPermissionPrompt && !state.gameOver) {
      this.renderPermissionPrompt(renderer);
    }

    if (this.config.showPauseIndicator && state.paused && !state.gameOver) {
      this.renderPauseIndicator(renderer);
    }

    // Render game over screen on top of everything
    if (state.gameOver) {
      this.renderGameOverScreen(renderer, state);
    }
  }

  /**
   * Render FPS counter
   * @param renderer - Renderer instance
   * @param fps - Current FPS value
   */
  renderFPS(renderer: Renderer, fps: number): void {
    renderer.drawText(
      `FPS: ${Math.round(fps)}`,
      10,
      30,
      '#ffffff',
      '20px monospace'
    );
  }

  /**
   * Render control instructions
   * @param renderer - Renderer instance
   * @param state - Current game state
   */
  renderInstructions(renderer: Renderer, state: UIGameState): void {
    let instructionY = 60;

    if (state.useAccelerometer) {
      // Accelerometer mode instructions
      renderer.drawText(
        'Tilt device to move',
        10,
        instructionY,
        '#00ff88',
        '16px monospace'
      );
      instructionY += 25;

      if (state.hasMotionSensors) {
        renderer.drawText(
          'Press T to use keyboard',
          10,
          instructionY,
          '#aaaaaa',
          '14px monospace'
        );
        instructionY += 25;
      }
    } else {
      // Keyboard mode instructions
      renderer.drawText(
        'Use WASD or Arrow Keys to move',
        10,
        instructionY,
        '#aaaaaa',
        '16px monospace'
      );
      instructionY += 25;

      if (state.hasMotionSensors && state.hasMotionPermission) {
        renderer.drawText(
          'Press T to use accelerometer',
          10,
          instructionY,
          '#aaaaaa',
          '14px monospace'
        );
        instructionY += 25;
      }
    }

    // Pause instruction
    renderer.drawText(
      'Press P to pause/resume',
      10,
      instructionY,
      '#aaaaaa',
      '16px monospace'
    );
    instructionY += 25;

    // Debug instruction
    renderer.drawText(
      `Press R to ${state.debugEnabled ? 'hide' : 'show'} raycast debug`,
      10,
      instructionY,
      '#aaaaaa',
      '14px monospace'
    );
  }

  /**
   * Render pause indicator overlay
   * @param renderer - Renderer instance
   */
  renderPauseIndicator(renderer: Renderer): void {
    renderer.drawText(
      'PAUSED',
      renderer.getWidth() / 2 - 50,
      renderer.getHeight() / 2,
      '#ff0000',
      'bold 32px monospace'
    );
  }

  /**
   * Render motion permission prompt
   * @param renderer - Renderer instance
   */
  renderPermissionPrompt(renderer: Renderer): void {
    renderer.drawText(
      'Tap screen to enable tilt controls',
      renderer.getWidth() / 2 - 150,
      renderer.getHeight() - 50,
      '#ffaa00',
      'bold 16px monospace'
    );
  }

  /**
   * Render score display (top center)
   * @param renderer - Renderer instance
   * @param state - Current game state
   */
  renderScore(renderer: Renderer, state: UIGameState): void {
    const centerX = renderer.getWidth() / 2;

    // Current score (large, centered)
    renderer.drawText(
      `${state.score}`,
      centerX - 60,
      40,
      '#00ff88',
      'bold 32px monospace'
    );

    // High score label (smaller, below current score)
    renderer.drawText(
      `Best: ${state.highScore}`,
      centerX - 60,
      70,
      '#ffbf00',
      '18px monospace'
    );
  }

  /**
   * Render game over screen overlay
   * @param renderer - Renderer instance
   * @param state - Current game state
   */
  renderGameOverScreen(renderer: Renderer, state: UIGameState): void {
    const centerX = renderer.getWidth() / 2;
    const centerY = renderer.getHeight() / 2;

    // Semi-transparent overlay
    const ctx = renderer.getCanvasContext();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, renderer.getWidth(), renderer.getHeight());

    // Game Over text
    renderer.drawText(
      'GAME OVER',
      centerX - 120,
      centerY - 80,
      '#ff4444',
      'bold 48px monospace'
    );

    // Final score
    renderer.drawText(
      `Score: ${state.score}`,
      centerX - 90,
      centerY - 20,
      '#00ff88',
      'bold 36px monospace'
    );

    // New high score indicator
    if (state.isNewHighScore && state.score > 0) {
      renderer.drawText(
        'NEW HIGH SCORE!',
        centerX - 140,
        centerY + 30,
        '#ffbf00',
        'bold 28px monospace'
      );
    } else {
      // Show high score if not a new record
      renderer.drawText(
        `High Score: ${state.highScore}`,
        centerX - 120,
        centerY + 30,
        '#ffbf00',
        '24px monospace'
      );
    }

    // Restart instruction
    renderer.drawText(
      'Press R to Restart',
      centerX - 120,
      centerY + 80,
      '#ffffff',
      '24px monospace'
    );
  }

  /**
   * Update HUD configuration
   * @param config - New configuration
   */
  setConfig(config: Partial<HUDConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current HUD configuration
   * @returns Current configuration
   */
  getConfig(): HUDConfig {
    return { ...this.config };
  }
}
