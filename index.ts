import { Game } from './src/core/Game.js';

/**
 * Entry point for the game
 * Initializes and starts the game when the window loads
 */

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing game...');
    
    // Create game instance
    const game = new Game('gameCanvas');
    
    // Start the game
    game.start();
    
    console.log('Game started successfully!');
    
    // Make game accessible from console for debugging
    (window as any).game = game;
    
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
