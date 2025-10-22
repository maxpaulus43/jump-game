/**
 * ButtonIcons.ts
 * 
 * Icon renderers for touch buttons
 * Each icon implements the ButtonIcon interface
 */

import type { ButtonIcon } from '../../types/touchButton.js';

/**
 * Pause icon (⏸)
 * Two vertical bars
 */
export class PauseIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    const barWidth = size * 0.25;
    const barHeight = size * 0.6;
    const spacing = size * 0.2;
    
    ctx.fillStyle = color;
    
    // Left bar
    ctx.fillRect(
      x - spacing - barWidth,
      y - barHeight / 2,
      barWidth,
      barHeight
    );
    
    // Right bar
    ctx.fillRect(
      x + spacing,
      y - barHeight / 2,
      barWidth,
      barHeight
    );
  }
}

/**
 * Play/Resume icon (▶)
 * Triangle pointing right
 */
export class PlayIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    const triangleSize = size * 0.6;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - triangleSize / 3, y - triangleSize / 2);
    ctx.lineTo(x - triangleSize / 3, y + triangleSize / 2);
    ctx.lineTo(x + triangleSize * 2 / 3, y);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Restart icon (🔄)
 * Circular arrow
 */
export class RestartIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    const radius = size * 0.35;
    const arrowSize = size * 0.15;
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.1;
    
    // Draw circular arc
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI * 0.5, Math.PI * 1.5, false);
    ctx.stroke();
    
    // Draw arrow head at the end
    const arrowX = x;
    const arrowY = y - radius;
    
    ctx.beginPath();
    ctx.moveTo(arrowX - arrowSize, arrowY - arrowSize);
    ctx.lineTo(arrowX, arrowY);
    ctx.lineTo(arrowX + arrowSize, arrowY - arrowSize);
    ctx.lineWidth = size * 0.08;
    ctx.stroke();
  }
}

/**
 * Debug icon (letter D or bug symbol)
 * Simple letter D for now
 */
export class DebugIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    // Draw letter "D"
    ctx.fillStyle = color;
    ctx.font = `bold ${size * 0.8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', x, y);
  }
}

/**
 * Accelerometer icon (📱)
 * Phone/device symbol
 */
export class AccelerometerIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    const phoneWidth = size * 0.5;
    const phoneHeight = size * 0.8;
    const cornerRadius = size * 0.05;
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.08;
    
    // Draw phone outline (rounded rectangle)
    ctx.beginPath();
    ctx.roundRect(
      x - phoneWidth / 2,
      y - phoneHeight / 2,
      phoneWidth,
      phoneHeight,
      cornerRadius
    );
    ctx.stroke();
    
    // Draw home button/indicator
    const buttonRadius = size * 0.08;
    ctx.beginPath();
    ctx.arc(x, y + phoneHeight / 2 - buttonRadius * 2, buttonRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Keyboard icon (⌨)
 * Simple keyboard representation
 */
export class KeyboardIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    // Draw letter "K"
    ctx.fillStyle = color;
    ctx.font = `bold ${size * 0.8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('K', x, y);
  }
}

/**
 * Settings/Gear icon
 * Simple gear/cog symbol
 */
export class SettingsIcon implements ButtonIcon {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.2;
    const teeth = 8;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    
    // Draw gear teeth
    for (let i = 0; i < teeth; i++) {
      const angle1 = (i / teeth) * Math.PI * 2;
      const angle2 = ((i + 0.5) / teeth) * Math.PI * 2;
      const angle3 = ((i + 1) / teeth) * Math.PI * 2;
      
      // Outer point
      ctx.lineTo(
        x + Math.cos(angle1) * outerRadius,
        y + Math.sin(angle1) * outerRadius
      );
      
      // Mid point
      ctx.lineTo(
        x + Math.cos(angle2) * (outerRadius * 0.85),
        y + Math.sin(angle2) * (outerRadius * 0.85)
      );
      
      // Inner point
      ctx.lineTo(
        x + Math.cos(angle3) * innerRadius,
        y + Math.sin(angle3) * innerRadius
      );
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(x, y, innerRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e'; // Background color to cut out center
    ctx.fill();
  }
}
