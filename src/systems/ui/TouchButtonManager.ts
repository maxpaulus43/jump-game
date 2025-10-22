/**
 * TouchButtonManager.ts
 * 
 * Coordinates multiple touch buttons with group management and auto-hide functionality
 */

import { TouchButton } from './TouchButton.js';
import type { TouchButtonManagerConfig, ButtonGroup } from '../../types/touchButton.js';
import type { Renderer } from '../../types/renderer.js';

/**
 * Manages a collection of touch buttons
 * Handles touch routing, visibility groups, and auto-hide
 */
export class TouchButtonManager {
  private buttons: Map<string, TouchButton>;
  private groups: Map<string, ButtonGroup>;
  private config: Required<TouchButtonManagerConfig>;
  
  // Auto-hide state
  private lastInteractionTime: number;
  private currentFadeOpacity: number;
  private isFading: boolean;
  private activeTouches: Set<number>;
  
  /**
   * Create a new touch button manager
   * @param config - Manager configuration
   */
  constructor(config: TouchButtonManagerConfig = {}) {
    this.buttons = new Map();
    this.groups = new Map();
    this.activeTouches = new Set();
    
    // Apply defaults
    this.config = {
      hideButtonsDelay: config.hideButtonsDelay ?? 3000,
      fadeOutDuration: config.fadeOutDuration ?? 500,
      enableAutoHide: config.enableAutoHide ?? false
    };
    
    // Auto-hide state
    this.lastInteractionTime = performance.now();
    this.currentFadeOpacity = 1.0;
    this.isFading = false;
  }
  
  /**
   * Add a button to the manager
   * @param button - Button to add
   */
  addButton(button: TouchButton): void {
    this.buttons.set(button.getId(), button);
  }
  
  /**
   * Remove a button from the manager
   * @param id - Button ID to remove
   * @returns True if button was removed
   */
  removeButton(id: string): boolean {
    return this.buttons.delete(id);
  }
  
  /**
   * Get a button by ID
   * @param id - Button ID
   * @returns Button instance or undefined
   */
  getButton(id: string): TouchButton | undefined {
    return this.buttons.get(id);
  }
  
  /**
   * Get all buttons
   * @returns Array of all buttons
   */
  getAllButtons(): TouchButton[] {
    return Array.from(this.buttons.values());
  }
  
  /**
   * Create a visibility group
   * @param groupId - Unique group identifier
   * @param buttonIds - Array of button IDs in this group
   */
  createGroup(groupId: string, buttonIds: string[]): void {
    this.groups.set(groupId, {
      id: groupId,
      buttonIds: new Set(buttonIds)
    });
  }
  
  /**
   * Show a visibility group (hide all others)
   * @param groupId - Group to show
   */
  showGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      console.warn(`Button group "${groupId}" not found`);
      return;
    }
    
    // Hide all buttons first
    for (const button of this.buttons.values()) {
      button.setVisible(false);
    }
    
    // Show buttons in this group
    for (const buttonId of group.buttonIds) {
      const button = this.buttons.get(buttonId);
      if (button) {
        button.setVisible(true);
      }
    }
    
    // Reset auto-hide timer when showing new group
    this.resetHideTimer();
  }
  
  /**
   * Hide a visibility group
   * @param groupId - Group to hide
   */
  hideGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      console.warn(`Button group "${groupId}" not found`);
      return;
    }
    
    // Hide buttons in this group
    for (const buttonId of group.buttonIds) {
      const button = this.buttons.get(buttonId);
      if (button) {
        button.setVisible(false);
      }
    }
  }
  
  /**
   * Show all buttons
   */
  showAllButtons(): void {
    for (const button of this.buttons.values()) {
      button.setVisible(true);
    }
    this.resetHideTimer();
  }
  
  /**
   * Hide all buttons
   */
  hideAllButtons(): void {
    for (const button of this.buttons.values()) {
      button.setVisible(false);
    }
  }
  
  /**
   * Enable or disable auto-hide feature
   * @param enabled - Auto-hide state
   */
  setAutoHide(enabled: boolean): void {
    this.config.enableAutoHide = enabled;
    
    if (enabled) {
      this.resetHideTimer();
    } else {
      // Reset opacity when disabling auto-hide
      this.currentFadeOpacity = 1.0;
      this.isFading = false;
      this.updateButtonOpacity();
    }
  }
  
  /**
   * Reset the auto-hide timer
   * Call this when user interacts with the game
   */
  resetHideTimer(): void {
    this.lastInteractionTime = performance.now();
    this.currentFadeOpacity = 1.0;
    this.isFading = false;
    this.updateButtonOpacity();
  }
  
  /**
   * Handle touch start event
   * Routes touch to appropriate button
   * @param touches - Map of active touches
   */
  handleTouchStart(touches: Map<number, { x: number; y: number }>): void {
    for (const [touchId, touch] of touches) {
      // Skip if already handling this touch
      if (this.activeTouches.has(touchId)) {
        continue;
      }
      
      // Try to find a button that handles this touch
      for (const button of this.buttons.values()) {
        if (button.handleTouchStart(touch.x, touch.y)) {
          this.activeTouches.add(touchId);
          this.resetHideTimer();
          break; // Touch handled, stop checking other buttons
        }
      }
    }
  }
  
  /**
   * Handle touch end event
   * @param touchId - Touch identifier that ended
   */
  handleTouchEnd(touchId: number): void {
    if (this.activeTouches.has(touchId)) {
      // Release all buttons (simple approach - more sophisticated would track which button per touch)
      for (const button of this.buttons.values()) {
        button.handleTouchEnd();
      }
      this.activeTouches.delete(touchId);
    }
  }
  
  /**
   * Handle all touches ending
   */
  handleAllTouchesEnd(): void {
    for (const button of this.buttons.values()) {
      button.handleTouchEnd();
    }
    this.activeTouches.clear();
  }
  
  /**
   * Update button manager state
   * Handles auto-hide timing and fade animations
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    if (!this.config.enableAutoHide) {
      return;
    }
    
    const now = performance.now();
    const timeSinceInteraction = now - this.lastInteractionTime;
    
    // Check if we should start fading
    if (timeSinceInteraction >= this.config.hideButtonsDelay && !this.isFading) {
      this.isFading = true;
    }
    
    // Update fade animation
    if (this.isFading) {
      const fadeTime = timeSinceInteraction - this.config.hideButtonsDelay;
      const fadeProgress = Math.min(1.0, fadeTime / this.config.fadeOutDuration);
      
      // Ease out cubic for smooth fade
      this.currentFadeOpacity = 1.0 - (fadeProgress * fadeProgress * fadeProgress);
      
      this.updateButtonOpacity();
    }
    
    // Update individual buttons
    for (const button of this.buttons.values()) {
      button.update(dt);
    }
  }
  
  /**
   * Render all visible buttons
   * @param renderer - Renderer instance
   */
  render(renderer: Renderer): void {
    for (const button of this.buttons.values()) {
      if (button.isVisible()) {
        button.render(renderer);
      }
    }
  }
  
  /**
   * Update opacity of all buttons based on fade state
   */
  private updateButtonOpacity(): void {
    for (const button of this.buttons.values()) {
      button.setOpacity(this.currentFadeOpacity);
    }
  }
  
  /**
   * Clear all buttons and groups
   */
  clear(): void {
    this.buttons.clear();
    this.groups.clear();
    this.activeTouches.clear();
  }
  
  /**
   * Get configuration
   */
  getConfig(): Required<TouchButtonManagerConfig> {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<TouchButtonManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
