/**
 * FPSCounter.ts
 * 
 * Tracks and calculates frames per second (FPS) for performance monitoring.
 * Provides accurate FPS calculation with 1-second update intervals.
 */

/**
 * Manages FPS calculation and tracking
 */
export class FPSCounter {
  private frameCount: number = 0;
  private lastUpdate: number = 0;
  private currentFPS: number = 0;

  /**
   * Create a new FPS counter
   */
  constructor() {
    this.reset();
  }

  /**
   * Update frame count and calculate FPS
   * Should be called once per frame
   */
  update(): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastUpdate;

    // Update FPS every second
    if (elapsed >= 1000) {
      this.currentFPS = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastUpdate = now;
    }
  }

  /**
   * Get the current FPS value
   * @returns Current FPS
   */
  getFPS(): number {
    return this.currentFPS;
  }

  /**
   * Reset the counter state
   */
  reset(): void {
    this.frameCount = 0;
    this.lastUpdate = performance.now();
    this.currentFPS = 0;
  }
}
