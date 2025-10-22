/**
 * ScoreSystem.ts
 * 
 * Manages score tracking based on height climbed
 * Persists high score to localStorage
 */

/**
 * ScoreSystem tracks player progress and high scores
 */
export class ScoreSystem {
  private currentScore: number = 0;
  private highScore: number = 0;
  private startY: number = 0;
  private readonly STORAGE_KEY = 'bounceGameHighScore';

  constructor() {
    // Load high score from localStorage on initialization
    this.highScore = this.loadHighScore();
  }

  /**
   * Initialize score system for a new game
   * 
   * @param startY - Starting Y position (player's initial Y)
   */
  initialize(startY: number): void {
    this.startY = startY;
    this.currentScore = 0;
  }

  /**
   * Update score based on player's current position
   * 
   * @param playerY - Current player Y position
   */
  update(playerY: number): void {
    // Score = height climbed (inverted Y coordinate)
    // Lower Y value = higher position = higher score
    const heightClimbed = Math.max(0, this.startY - playerY);
    this.currentScore = Math.floor(heightClimbed);

    // Update high score if beaten
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
    }
  }

  /**
   * Get current score
   * 
   * @returns Current score
   */
  getCurrentScore(): number {
    return this.currentScore;
  }

  /**
   * Get high score
   * 
   * @returns High score
   */
  getHighScore(): number {
    return this.highScore;
  }

  /**
   * Check if current score is a new high score
   * 
   * @returns True if current score equals high score and is greater than 0
   */
  isNewHighScore(): boolean {
    return this.currentScore === this.highScore && this.currentScore > 0;
  }

  /**
   * Reset current score (keeps high score)
   * Called when starting a new game
   */
  reset(): void {
    this.currentScore = 0;
  }

  /**
   * Load high score from localStorage
   * 
   * @returns Saved high score or 0 if none exists
   */
  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
      }
    } catch (error) {
      console.warn('Failed to load high score from localStorage:', error);
    }
    return 0;
  }

  /**
   * Save high score to localStorage
   */
  private saveHighScore(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.highScore.toString());
    } catch (error) {
      console.warn('Failed to save high score to localStorage:', error);
    }
  }

  /**
   * Clear high score (for testing/debugging)
   */
  clearHighScore(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.highScore = 0;
    } catch (error) {
      console.warn('Failed to clear high score from localStorage:', error);
    }
  }
}
