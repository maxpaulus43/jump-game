import type { SpriteSheetConfig } from '../types/sprite.js';

export function createSpriteSheetConfig(): SpriteSheetConfig {
  return {
    id: 'playerSprite',
    imagePath: 'assets/sprite_sheet.png',
    frames: {
      'player': {
        x: 64,
        y: 0,
        width: 64,
        height: 64,
      },
    },
  };
}

/**
 * Creates a placeholder sprite sheet for testing sprite rendering.
 * 
 * Generates a 256x256 canvas with colored squares representing different entity types:
 * - (0, 0): Yellow square for "player"
 * - (64, 0): Blue square for "platform"
 * - (128, 0): Red square for "enemy"
 * 
 * The canvas is converted to a data URL so it can be loaded as an image
 * without requiring external image files.
 * 
 * @returns A SpriteSheetConfig ready to be loaded by SpriteSheetManager
 * 
 * @example
 * ```typescript
 * const config = createPlaceholderSpriteSheet();
 * await spriteSheetManager.loadSpriteSheet(config);
 * ```
 */
export function createPlaceholderSpriteSheet(): SpriteSheetConfig {
  // Create a 256x256 canvas for the sprite sheet
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for placeholder sprite sheet');
  }

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Define sprite size
  const spriteSize = 64;

  // Draw player sprite (yellow square)
  ctx.fillStyle = '#ffeb3b'; // Yellow
  ctx.fillRect(0, 0, spriteSize, spriteSize);

  // Add a simple face to make it recognizable as player
  ctx.fillStyle = '#000000';
  // Eyes
  ctx.fillRect(16, 20, 8, 8);
  ctx.fillRect(40, 20, 8, 8);
  // Smile
  ctx.beginPath();
  ctx.arc(32, 32, 16, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw platform sprite (blue square)
  ctx.fillStyle = '#2196f3'; // Blue
  ctx.fillRect(64, 0, spriteSize, spriteSize);

  // Add grid pattern to platform
  ctx.strokeStyle = '#1565c0';
  ctx.lineWidth = 2;
  for (let i = 0; i <= spriteSize; i += 16) {
    ctx.beginPath();
    ctx.moveTo(64 + i, 0);
    ctx.lineTo(64 + i, spriteSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(64, i);
    ctx.lineTo(64 + spriteSize, i);
    ctx.stroke();
  }

  // Draw enemy sprite (red square)
  ctx.fillStyle = '#f44336'; // Red
  ctx.fillRect(128, 0, spriteSize, spriteSize);

  // Add menacing eyes to enemy
  ctx.fillStyle = '#000000';
  // Angry eyes
  ctx.fillRect(144, 24, 8, 8);
  ctx.fillRect(168, 24, 8, 8);
  // Angry eyebrows
  ctx.fillStyle = '#000000';
  ctx.fillRect(140, 20, 12, 3);
  ctx.fillRect(168, 20, 12, 3);
  // Frown
  ctx.beginPath();
  ctx.arc(160, 48, 12, 1.2 * Math.PI, 1.8 * Math.PI);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Convert canvas to data URL
  const dataUrl = canvas.toDataURL('image/png');

  // Return sprite sheet configuration
  return {
    id: 'placeholder',
    imagePath: dataUrl,
    frames: {
      'player': {
        x: 0,
        y: 0,
        width: spriteSize,
        height: spriteSize,
      },
      'platform': {
        x: 64,
        y: 0,
        width: spriteSize,
        height: spriteSize,
      },
      'enemy': {
        x: 128,
        y: 0,
        width: spriteSize,
        height: spriteSize,
      },
    },
  };
}
