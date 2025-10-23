export type UIState = 'playing' | 'paused' | 'gameOver' | 'menu';

export interface UIEventCallbacks {
    onResume?: () => void;
    onRestart?: () => void;
    onQuit?: () => void;
    onSettings?: () => void;
}

/**
 * UIManager handles HTML overlays and UI state
 * Provides a clean interface for managing game menus/screens
 */
export class UIManager {
    private state: UIState = 'playing';
    private activeOverlay: HTMLElement | null = null;
    private callbacks: UIEventCallbacks = {};

    constructor(callbacks: UIEventCallbacks = {}) {
        this.callbacks = callbacks;
    }

    /**
     * Get current UI state
     */
    getState(): UIState {
        return this.state;
    }

    /**
     * Show game over screen
     */
    showGameOver(score: number, highScore: number): void {
        this.state = 'gameOver';
        this.clearOverlay();

        const overlay = this.createOverlay();

        // Title
        const title = document.createElement('h1');
        title.textContent = 'Game Over';
        title.style.cssText = `
      color: #ff4444;
      font-size: 48px;
      margin-bottom: 20px;
      text-align: center;
      text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
    `;

        // Score display
        const scoreContainer = document.createElement('div');
        scoreContainer.style.cssText = `
      margin: 30px 0;
      text-align: center;
    `;

        const scoreText = document.createElement('div');
        scoreText.innerHTML = `
      <div style="font-size: 24px; color: #888888; margin-bottom: 10px;">
        Score
      </div>
      <div style="font-size: 56px; color: #00ff88; font-weight: bold;">
        ${score}
      </div>
    `;

        const highScoreText = document.createElement('div');
        highScoreText.style.cssText = `
      margin-top: 20px;
      font-size: 20px;
      color: ${score > highScore ? '#00ff88' : '#888888'};
    `;
        highScoreText.textContent = score > highScore
            ? `New High Score! 🎉`
            : `High Score: ${highScore}`;

        scoreContainer.appendChild(scoreText);
        scoreContainer.appendChild(highScoreText);

        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
      display: flex;
      gap: 20px;
      margin-top: 40px;
    `;

        const restartButton = this.createButton('Restart', '#00ff88');
        const quitButton = this.createButton('Quit', '#666666');

        this.attachButtonHandler(restartButton, () => {
            this.clearOverlay();
            this.state = 'playing';
            this.callbacks.onRestart?.();
        });

        this.attachButtonHandler(quitButton, () => {
            this.clearOverlay();
            this.callbacks.onQuit?.();
        });

        buttonContainer.appendChild(restartButton);
        buttonContainer.appendChild(quitButton);

        // Assemble
        overlay.appendChild(title);
        overlay.appendChild(scoreContainer);
        overlay.appendChild(buttonContainer);

        this.activeOverlay = overlay;
        document.body.appendChild(overlay);
    }

    /**
     * Show pause menu
     */
    showPauseMenu(): void {
        this.state = 'paused';
        this.clearOverlay();

        const overlay = this.createOverlay();

        const title = document.createElement('h1');
        title.textContent = 'Paused';
        title.style.cssText = `
      color: #00ff88;
      font-size: 48px;
      margin-bottom: 40px;
      text-align: center;
    `;

        const resumeButton = this.createButton('Resume', '#00ff88');
        const restartButton = this.createButton('Restart', '#ffaa00');
        const quitButton = this.createButton('Quit', '#666666');

        this.attachButtonHandler(resumeButton, () => {
            this.clearOverlay();
            this.state = 'playing';
            this.callbacks.onResume?.();
        });

        this.attachButtonHandler(restartButton, () => {
            this.clearOverlay();
            this.state = 'playing';
            this.callbacks.onRestart?.();
        });

        this.attachButtonHandler(quitButton, () => {
            this.clearOverlay();
            this.callbacks.onQuit?.();
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
    `;

        buttonContainer.appendChild(resumeButton);
        buttonContainer.appendChild(restartButton);
        buttonContainer.appendChild(quitButton);

        overlay.appendChild(title);
        overlay.appendChild(buttonContainer);

        this.activeOverlay = overlay;
        document.body.appendChild(overlay);
    }

    /**
     * Hide current overlay
     */
    hideOverlay(): void {
        this.clearOverlay();
        this.state = 'playing';
    }

    /**
     * Create base overlay container
     */
    private createOverlay(): HTMLElement {
        const overlay = document.createElement('div');
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
      animation: fadeIn 0.3s ease-out;
    `;

        return overlay;
    }

    /**
     * Create styled button with touch support
     */
    private createButton(text: string, color: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
      background-color: ${color};
      color: #1a1a2e;
      border: none;
      padding: 15px 40px;
      font-size: 20px;
      font-weight: bold;
      font-family: monospace;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.1s, filter 0.2s;
      min-width: 200px;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    `;

        // Mouse events (desktop)
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.filter = 'brightness(1.2)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.filter = 'brightness(1)';
        });

        // Touch events (mobile)
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(0.95)';
            button.style.filter = 'brightness(0.9)';
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(1)';
            button.style.filter = 'brightness(1)';
        });

        button.addEventListener('touchcancel', () => {
            button.style.transform = 'scale(1)';
            button.style.filter = 'brightness(1)';
        });

        return button;
    }

    /**
     * Attach click/touch handler to button with mobile support
     * Prevents double-firing on devices that support both touch and mouse
     */
    private attachButtonHandler(button: HTMLButtonElement, handler: () => void): void {
        let touchHandled = false;

        // Touch event (fires first on mobile)
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchHandled = true;
            handler();
            // Reset flag after a short delay
            setTimeout(() => {
                touchHandled = false;
            }, 500);
        });

        // Click event (fires on desktop, or as fallback)
        button.addEventListener('click', (e) => {
            // Prevent if touch was already handled
            if (touchHandled) {
                e.preventDefault();
                return;
            }
            handler();
        });
    }

    /**
     * Clear active overlay
     */
    private clearOverlay(): void {
        if (this.activeOverlay) {
            this.activeOverlay.remove();
            this.activeOverlay = null;
        }
    }
}
