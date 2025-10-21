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
    if (this.config.showFPS) {
      this.renderFPS(renderer, state.fps);
    }

    if (this.config.showInstructions) {
      this.renderInstructions(renderer, state);
    }

    if (state.showPermissionPrompt) {
      this.renderPermissionPrompt(renderer);
    }

    if (this.config.showPauseIndicator && state.paused) {
      this.renderPauseIndicator(renderer);
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
