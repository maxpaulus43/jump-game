/**
 * 2D Vector class with mutable operations for performance
 * 
 * Design philosophy:
 * - Primary methods mutate in-place for zero-allocation performance
 * - Clone/copy methods provided for safety when needed
 * - Static utilities available for one-off calculations
 * - All methods return 'this' for method chaining
 */
export class Vec2 {
  constructor(public x: number, public y: number) { }

  // ============================================================================
  // MUTABLE OPERATIONS (modify this vector, return this for chaining)
  // ============================================================================

  /**
   * Add another vector to this vector (mutates this)
   * @returns this for chaining
   */
  add(other: Vec2): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
   * Subtract another vector from this vector (mutates this)
   * @returns this for chaining
   */
  subtract(other: Vec2): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  /**
   * Multiply this vector by a scalar (mutates this)
   * @returns this for chaining
   */
  multiply(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Divide this vector by a scalar (mutates this)
   * @returns this for chaining
   */
  divide(scalar: number): this {
    if (scalar === 0) {
      throw new Error('Vec2.divide: Division by zero');
    }
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  /**
   * Normalize this vector to unit length (mutates this)
   * If magnitude is zero, sets to zero vector
   * @returns this for chaining
   */
  normalize(): this {
    const mag = this.magnitude();
    if (mag === 0) {
      this.x = 0;
      this.y = 0;
      return this;
    }
    this.x /= mag;
    this.y /= mag;
    return this;
  }

  /**
   * Copy another vector's values into this vector (mutates this)
   * @returns this for chaining
   */
  copyFrom(other: Vec2): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  /**
   * Set this vector to zero (mutates this)
   * @returns this for chaining
   */
  zero(): this {
    this.x = 0;
    this.y = 0;
    return this;
  }

  /**
   * Clamp this vector's magnitude to a maximum length (mutates this)
   * @returns this for chaining
   */
  clampMagnitude(maxLength: number): this {
    const mag = this.magnitude();
    if (mag > maxLength) {
      this.normalize().multiply(maxLength);
    }
    return this;
  }

  /**
   * Rotate this vector by an angle in radians (mutates this)
   * @returns this for chaining
   */
  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    this.x = newX;
    this.y = newY;
    return this;
  }

  // ============================================================================
  // IMMUTABLE OPERATIONS (return new Vec2, don't modify this)
  // ============================================================================

  /**
   * Create a copy of this vector
   * @returns new Vec2 with same values
   */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  // ============================================================================
  // QUERY OPERATIONS (don't modify anything, just return values)
  // ============================================================================

  /**
   * Calculate the magnitude (length) of this vector
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Calculate the squared magnitude (avoids sqrt, faster for comparisons)
   */
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Calculate distance to another vector
   */
  distanceTo(other: Vec2): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate squared distance to another vector (faster, no sqrt)
   */
  distanceSquaredTo(other: Vec2): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return dx * dx + dy * dy;
  }

  /**
   * Calculate dot product with another vector
   */
  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Calculate the angle of this vector in radians
   */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Calculate the angle between this vector and another in radians
   */
  angleTo(other: Vec2): number {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  /**
   * Check if this vector equals another (with optional epsilon for floating point comparison)
   */
  equals(other: Vec2, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon;
  }

  /**
   * Convert to plain object (useful for serialization)
   */
  toObject(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * Create a zero vector
   */
  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  /**
   * Create a unit vector pointing right (1, 0)
   */
  static right(): Vec2 {
    return new Vec2(1, 0);
  }

  /**
   * Create a unit vector pointing up (0, -1) - note: canvas Y is inverted
   */
  static up(): Vec2 {
    return new Vec2(0, -1);
  }

  /**
   * Create a unit vector pointing left (-1, 0)
   */
  static left(): Vec2 {
    return new Vec2(-1, 0);
  }

  /**
   * Create a unit vector pointing down (0, 1)
   */
  static down(): Vec2 {
    return new Vec2(0, 1);
  }

  /**
   * Create a vector from an angle (in radians) and optional length
   */
  static fromAngle(angle: number, length: number = 1): Vec2 {
    return new Vec2(
      Math.cos(angle) * length,
      Math.sin(angle) * length
    );
  }

  /**
   * Create a vector from a plain object
   */
  static fromObject(obj: { x: number; y: number }): Vec2 {
    return new Vec2(obj.x, obj.y);
  }

  // ============================================================================
  // STATIC UTILITY METHODS (for one-off calculations without creating instances)
  // ============================================================================

  /**
   * Add two vectors and return result in optional output vector
   * If no output provided, creates new Vec2
   */
  static add(a: Vec2, b: Vec2, out?: Vec2): Vec2 {
    if (out) {
      out.x = a.x + b.x;
      out.y = a.y + b.y;
      return out;
    }
    return new Vec2(a.x + b.x, a.y + b.y);
  }

  /**
   * Subtract b from a and return result in optional output vector
   */
  static subtract(a: Vec2, b: Vec2, out?: Vec2): Vec2 {
    if (out) {
      out.x = a.x - b.x;
      out.y = a.y - b.y;
      return out;
    }
    return new Vec2(a.x - b.x, a.y - b.y);
  }

  /**
   * Multiply vector by scalar and return result in optional output vector
   */
  static multiply(v: Vec2, scalar: number, out?: Vec2): Vec2 {
    if (out) {
      out.x = v.x * scalar;
      out.y = v.y * scalar;
      return out;
    }
    return new Vec2(v.x * scalar, v.y * scalar);
  }

  /**
   * Calculate distance between two vectors
   */
  static distance(a: Vec2, b: Vec2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate dot product of two vectors
   */
  static dot(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * Linear interpolation between two vectors
   * @param t - interpolation factor (0 = a, 1 = b)
   */
  static lerp(a: Vec2, b: Vec2, t: number, out?: Vec2): Vec2 {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (out) {
      out.x = x;
      out.y = y;
      return out;
    }
    return new Vec2(x, y);
  }
}
