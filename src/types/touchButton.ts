/**
 * touchButton.ts
 * 
 * Type definitions for the touch button UI system
 */

/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Button icon renderer interface
 */
export interface ButtonIcon {
  /**
   * Render the icon at the specified position
   * @param ctx - Canvas rendering context
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param size - Icon size (width/height)
   * @param color - Icon color
   */
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void;
}

/**
 * Touch button configuration
 */
export interface TouchButtonConfig {
  /** Unique identifier for the button */
  id: string;
  
  /** Button position (center point) */
  position: Position;
  
  /** Button diameter for circular buttons */
  size: number;
  
  /** Icon renderer */
  icon: ButtonIcon;
  
  /** Callback when button is pressed */
  onPress: () => void;
  
  /** Base opacity (0-1), default 0.7 */
  opacity?: number;
  
  /** Opacity when pressed (0-1), default 1.0 */
  pressedOpacity?: number;
  
  /** Background color, default '#ffffff' */
  color?: string;
  
  /** Background color when pressed, default '#00ff88' */
  pressedColor?: string;
  
  /** Whether button is enabled, default true */
  enabled?: boolean;
  
  /** Whether button is visible, default true */
  visible?: boolean;
  
  /** Extra touch area beyond visual size (pixels), default 10 */
  touchPadding?: number;
}

/**
 * Touch button manager configuration
 */
export interface TouchButtonManagerConfig {
  /** Auto-hide buttons after inactivity (milliseconds), default 3000 */
  hideButtonsDelay?: number;
  
  /** Fade out animation duration (milliseconds), default 500 */
  fadeOutDuration?: number;
  
  /** Enable auto-hide feature, default false */
  enableAutoHide?: boolean;
}

/**
 * Button visibility group
 */
export interface ButtonGroup {
  id: string;
  buttonIds: Set<string>;
}
