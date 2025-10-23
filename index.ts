import { Game } from './src/core/Game.js';
import { HTMLCanvasRenderer as HTMLCanvasRenderer } from './src/managers/ui/HTMLCanvasRenderer.js';
import { InputManager } from './src/managers/input/InputManager.js';

/**
 * Entry point for the game
 * Initializes and starts the game when the window loads
 */

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing game...');

    // Create game instance
    const canvasId = 'gameCanvas';
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const renderer = new HTMLCanvasRenderer(canvas)
    const inputManager = new InputManager();
    const game = new Game(renderer, inputManager);

    // Make game accessible from console for debugging
    (window as any).game = game;

    // Check if we need to show permission button (iOS 13+)
    const needsPermission = inputManager.hasMotionSensors() &&
      !inputManager.hasMotionPermission();

    if (needsPermission) {
      // Create start button overlay for iOS permission
      createStartButton(game, inputManager);
    } else {
      // Start game immediately if no permission needed
      game.start();
      console.log('Game started successfully!');
    }

  } catch (error) {
    console.error('Failed to initialize game:', error);

    // Display error message on page
    document.body.innerHTML = `
      <div style="
        color: white;
        font-family: monospace;
        padding: 20px;
        background-color: #1a1a2e;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      ">
        <h1 style="color: #ff0000; margin-bottom: 20px;">Game Initialization Error</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        <p style="margin-top: 20px; color: #aaaaaa;">Check the console for more details.</p>
      </div>
    `;
  }
});

/**
 * Create a start button overlay for requesting motion permission
 * This ensures the permission request happens in a direct user gesture context
 */
function createStartButton(game: Game, inputManager: InputManager): void {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'start-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(26, 26, 46, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: monospace;
  `;

  // Create title
  const title = document.createElement('h1');
  title.textContent = 'Tilt Controls';
  title.style.cssText = `
    color: #00ff88;
    font-size: 32px;
    margin-bottom: 20px;
    text-align: center;
  `;

  // Create description
  const description = document.createElement('p');
  description.textContent = 'This game uses your device\'s motion sensors';
  description.style.cssText = `
    color: #ffffff;
    font-size: 16px;
    margin-bottom: 40px;
    text-align: center;
    max-width: 300px;
  `;

  // Create start button
  const button = document.createElement('button');
  button.textContent = 'Enable Motion Controls';
  button.style.cssText = `
    background-color: #00ff88;
    color: #1a1a2e;
    border: none;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    font-family: monospace;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.1s, background-color 0.2s;
  `;

  // Handle button click/touch - MUST be synchronous for iOS
  const handleButtonPress = async () => {
    console.log('Start button pressed, requesting permission...');

    // Disable button during request
    button.disabled = true;
    button.textContent = 'Requesting Permission...';
    button.style.backgroundColor = '#666666';
    button.style.cursor = 'not-allowed';

    try {
      // Request permission - this MUST happen synchronously in the click handler
      const granted = await inputManager.requestMotionPermission();

      if (granted) {
        console.log('Permission granted!');
        button.textContent = 'Starting Game...';
        overlay.remove();
        game.start();
        console.log('Game started successfully!');
      } else {
        console.log('Permission denied');
        button.textContent = 'Permission Denied';
        button.style.backgroundColor = '#ff4444';

        // Show fallback message
        setTimeout(() => {
          button.textContent = 'Start Without Motion';
          button.style.backgroundColor = '#00ff88';
          button.style.cursor = 'pointer';
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Error during permission request:', error);
      button.textContent = 'Error - Tap to Continue';
      button.style.backgroundColor = '#ff4444';
      button.style.cursor = 'pointer';
      button.disabled = false;
    }
  };

  // Add both click and touchend listeners for better mobile support
  button.addEventListener('click', handleButtonPress);
  button.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleButtonPress();
  });

  // Assemble overlay
  overlay.appendChild(title);
  overlay.appendChild(description);
  overlay.appendChild(button);

  // Add to page
  document.body.appendChild(overlay);
}
