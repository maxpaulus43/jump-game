/**
 * TouchButton.ts
 * 
 * Self-contained touch button component with rendering, hit detection, and state management
 */

import type { TouchButtonConfig, Position } from '../../types/touchButton.js';
import type { Renderer } from '../../types/renderer.js';

/**
 * Touch button component
 * Handles rendering, hit detection, and visual feedback
 */
export class TouchButton {
  private id: string;
  private position: Position;
  private size: number;
  private icon: TouchButtonConfig['icon'];
  private onPress: () => void;
  
  // Visual properties
  private opacity: number;
  private pressedOpacity: number;
  private color: string;
  private pressedColor: string;
  private touchPadding: number;
  
  // State
  private pressed: boolean;
  private enabled: boolean;
  private visible: boolean;
  private currentOpacity: number;
  
  /**
   * Create a new touch button
   * @param config - Button configuration
   */
  constructor(config: TouchButtonConfig) {
    this.id = config.id;
    this.position = { ...config.position };
    this.size = config.size;
    this.icon = config.icon;
    this.onPress = config.onPress;
    
    // Visual properties with defaults
    this.opacity = config.opacity ?? 0.7;
    this.pressedOpacity = config.pressedOpacity ?? 1.0;
    this.color = config.color ?? '#ffffff';
    this.pressedColor = config.pressedColor ?? '#00ff88';
    this.touchPadding = config.touchPadding ?? 10;
    
    // Initial state
    this.pressed = false;
    this.enabled = config.enabled ?? true;
    this.visible = config.visible ?? true;
    this.currentOpacity = this.opacity;
  }
  
  /**
   * Get button ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * Get button position
   */
  getPosition(): Position {
    return { ...this.position };
  }
  
  /**
   * Set button position
   * @param position - New position
   */
  setPosition(position: Position): void {
    this.position = { ...position };
  }
  
  /**
   * Check if button is visible
   */
  isVisible(): boolean {
    return this.visible;
  }
  
  /**
   * Set button visibility
   * @param visible - Visibility state
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }
  
  /**
   * Check if button is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Set button enabled state
   * @param enabled - Enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressed = false;
    }
  }
  
  /**
   * Set button opacity (for fade animations)
   * @param opacity - Opacity value (0-1)
   */
  setOpacity(opacity: number): void {
    this.currentOpacity = Math.max(0, Math.min(1, opacity));
  }
  
  /**
   * Check if a point is inside the button's touch area
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns True if point is inside touch area
   */
  isPointInside(x: number, y: number): boolean {
    if (!this.visible || !this.enabled) {
      return false;
    }
    
    const touchRadius = (this.size / 2) + this.touchPadding;
    const dx = x - this.position.x;
    const dy = y - this.position.y;
    const distanceSquared = dx * dx + dy * dy;
    
    return distanceSquared <= touchRadius * touchRadius;
  }
  
  /**
   * Handle touch start event
   * @param x - Touch X coordinate
   * @param y - Touch Y coordinate
   * @returns True if touch was handled by this button
   */
  handleTouchStart(x: number, y: number): boolean {
    if (!this.isPointInside(x, y)) {
      return false;
    }
    
    this.pressed = true;
    this.onPress();
    return true;
  }
  
  /**
   * Handle touch end event
   * Resets pressed state
   */
  handleTouchEnd(): void {
    this.pressed = false;
  }
  
  /**
   * Render the button
   * @param renderer - Renderer instance
   */
  render(renderer: Renderer): void {
    if (!this.visible) {
      return;
    }
    
    const ctx = renderer.getCanvasContext();
    const radius = this.size / 2;
    
    // Determine current color and opacity
    const currentColor = this.pressed ? this.pressedColor : this.color;
    const displayOpacity = this.pressed ? this.pressedOpacity : this.currentOpacity;
    
    // Save context state
    ctx.save();
    ctx.globalAlpha = displayOpacity;
    
    // Draw button background (circle)
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = currentColor;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = this.pressed ? '#ffffff' : '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw icon
    const iconColor = this.pressed ? '#000000' : '#000000';
    this.icon.render(
      ctx,
      this.position.x,
      this.position.y,
      this.size * 0.5,
      iconColor
    );
    
    // Restore context state
    ctx.restore();
  }
  
  /**
   * Update button state (for animations, etc.)
   * @param _dt - Delta time in seconds
   */
  update(_dt: number): void {
    // Future: Could add animation logic here
    // For now, this is a placeholder for future enhancements
  }
}
