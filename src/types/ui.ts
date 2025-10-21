/**
 * ui.ts
 * 
 * Type definitions for UI/HUD rendering system
 */

/**
 * Game state information for UI rendering
 */
export interface UIGameState {
  fps: number;
  paused: boolean;
  useAccelerometer: boolean;
  showPermissionPrompt: boolean;
  debugEnabled: boolean;
  hasMotionSensors: boolean;
  hasMotionPermission: boolean;
}

/**
 * Configuration for HUD renderer
 */
export interface HUDConfig {
  showFPS: boolean;
  showInstructions: boolean;
  showPauseIndicator: boolean;
}
