/**
 * ui.ts
 * 
 * Type definitions for UI/HUD rendering system
 */

/**
 * Game state information for UI rendering
 */
export interface UIGameState {
  paused: boolean;
  useAccelerometer: boolean;
  showPermissionPrompt: boolean;
  hasMotionSensors: boolean;
  hasMotionPermission: boolean;
  score: number;
  highScore: number;
  gameOver: boolean;
  isNewHighScore: boolean;
}

/**
 * Configuration for HUD renderer
 */
export interface HUDConfig {
  showFPS: boolean;
  showInstructions: boolean;
  showPauseIndicator: boolean;
}
