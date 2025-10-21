# Raycast System Usage Guide

This guide demonstrates how any entity in the game can use the raycast system for various gameplay mechanics.

## Overview

The raycast system provides line-of-sight detection between points in your game world. It's useful for:
- Ground detection (platformers)
- Wall detection (wall jumping, sliding)
- Line of sight (AI, shooting)
- Proximity detection
- Look-ahead collision prevention

## Basic Usage

### 1. Import Required Types

```typescript
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { Ray, RaycastResult } from '../types/index.js';
import { Vec2 } from '../utils/Vec2.js';
```

### 2. Simple Raycast

```typescript
// Define the ray
const ray: Ray = {
  origin: { x: playerX, y: playerY },
  direction: { x: 0, y: 1 },  // Downward (should be normalized)
  maxDistance: 100  // Maximum ray length in pixels
};

// Cast against all platforms
const result = CollisionDetector.raycast(ray, platforms);

// Check if ray hit something
if (result.hit) {
  console.log(`Hit at distance: ${result.distance}`);
  console.log(`Hit point: (${result.point.x}, ${result.point.y})`);
  console.log(`Surface normal: (${result.normal.x}, ${result.normal.y})`);
  console.log(`Hit entity:`, result.entity);
}
```

## Common Use Cases

### Ground Detection (Platformer)

Check if player is standing on a platform:

```typescript
class Player {
  private checkGrounded(platforms: Collidable[]): boolean {
    // Cast ray downward from player center
    const ray: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: { x: 0, y: 1 },  // Down
      maxDistance: this.radius + 5  // Slightly beyond player radius
    };

    const result = CollisionDetector.raycast(ray, platforms);
    
    return result.hit && result.distance <= this.radius + 2;
  }

  update(dt: number, platforms: Collidable[]): void {
    const isGrounded = this.checkGrounded(platforms);
    
    if (isGrounded) {
      // Can jump, apply friction, etc.
      this.canJump = true;
    } else {
      // In air
      this.canJump = false;
    }
  }
}
```

### Wall Detection (Wall Jump/Slide)

```typescript
class Player {
  private checkWallContact(platforms: Collidable[]): {
    left: boolean;
    right: boolean;
  } {
    const checkDistance = this.radius + 5;

    // Check left wall
    const leftRay: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: { x: -1, y: 0 },  // Left
      maxDistance: checkDistance
    };
    const leftHit = CollisionDetector.raycast(leftRay, platforms);

    // Check right wall
    const rightRay: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: { x: 1, y: 0 },  // Right
      maxDistance: checkDistance
    };
    const rightHit = CollisionDetector.raycast(rightRay, platforms);

    return {
      left: leftHit.hit,
      right: rightHit.hit
    };
  }

  update(dt: number, platforms: Collidable[]): void {
    const wallContact = this.checkWallContact(platforms);
    
    if (wallContact.left || wallContact.right) {
      // Enable wall jump/slide
      this.canWallJump = true;
      this.applyWallSlide(dt);
    }
  }
}
```

### Look-Ahead Collision Prevention

Prevent fast-moving entities from tunneling through walls:

```typescript
class Projectile {
  update(dt: number, obstacles: Collidable[]): void {
    const moveDistance = this.velocity.magnitude() * dt;

    // Cast ray in movement direction
    const ray: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: {
        x: this.velocity.x / this.velocity.magnitude(),
        y: this.velocity.y / this.velocity.magnitude()
      },
      maxDistance: moveDistance + this.radius
    };

    const hit = CollisionDetector.raycast(ray, obstacles);

    if (hit.hit && hit.distance < moveDistance) {
      // Collision will occur this frame
      this.handleCollision(hit);
    } else {
      // Safe to move
      this.position.add(this.velocity.clone().multiply(dt));
    }
  }
}
```

### Line of Sight (AI)

Check if enemy can see player:

```typescript
class Enemy {
  canSeePlayer(player: Player, obstacles: Collidable[]): boolean {
    const toPlayer = new Vec2(
      player.getPosition().x - this.position.x,
      player.getPosition().y - this.position.y
    );
    const distance = toPlayer.magnitude();
    
    const ray: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: {
        x: toPlayer.x / distance,
        y: toPlayer.y / distance
      },
      maxDistance: distance
    };

    const hit = CollisionDetector.raycast(ray, obstacles);

    // If ray hits something before reaching player, no line of sight
    return !hit.hit || hit.distance >= distance;
  }

  update(dt: number, player: Player, obstacles: Collidable[]): void {
    if (this.canSeePlayer(player, obstacles)) {
      this.chasePlayer(player);
    } else {
      this.patrol();
    }
  }
}
```

### 360° Proximity Scan

Scan surroundings for navigation or awareness:

```typescript
class Entity {
  scanSurroundings(obstacles: Collidable[]): Map<number, RaycastResult> {
    const scanResults = new Map<number, RaycastResult>();
    const rayCount = 16;  // 16 rays = 22.5° between each
    const scanDistance = 200;

    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 * i) / rayCount;
      
      const ray: Ray = {
        origin: { x: this.position.x, y: this.position.y },
        direction: {
          x: Math.cos(angle),
          y: Math.sin(angle)
        },
        maxDistance: scanDistance
      };

      const result = CollisionDetector.raycast(ray, obstacles);
      scanResults.set(i, result);
    }

    return scanResults;
  }

  findBestPath(scanResults: Map<number, RaycastResult>): number {
    // Find direction with longest clear path
    let bestDirection = 0;
    let maxDistance = 0;

    scanResults.forEach((result, index) => {
      const clearDistance = result.hit ? result.distance : Infinity;
      if (clearDistance > maxDistance) {
        maxDistance = clearDistance;
        bestDirection = index;
      }
    });

    return (Math.PI * 2 * bestDirection) / scanResults.size;
  }
}
```

### Ledge Detection

Detect ledges for grabbing/climbing:

```typescript
class Player {
  checkLedgeGrab(platforms: Collidable[]): RaycastResult | null {
    // Cast from hand position (above center)
    const handY = this.position.y - this.radius * 0.8;
    
    const ray: Ray = {
      origin: { x: this.position.x, y: handY },
      direction: this.facingRight ? { x: 1, y: 0 } : { x: -1, y: 0 },
      maxDistance: this.radius * 2
    };

    const hit = CollisionDetector.raycast(ray, platforms);

    if (hit.hit) {
      // Check if there's space above the ledge (can climb up)
      const spaceCheckRay: Ray = {
        origin: { x: hit.point.x, y: hit.point.y - this.radius * 2 },
        direction: { x: 0, y: 1 },
        maxDistance: this.radius
      };

      const spaceCheck = CollisionDetector.raycast(spaceCheckRay, platforms);
      
      if (!spaceCheck.hit) {
        return hit;  // Valid ledge
      }
    }

    return null;
  }
}
```

## Performance Optimization

### Reuse RaycastResult Objects (Zero-Allocation)

```typescript
class Entity {
  // Reusable result object
  private raycastResult: RaycastResult = {
    hit: false,
    distance: 0,
    point: { x: 0, y: 0 },
    normal: { x: 0, y: 0 },
    entity: null,
    shape: null
  };

  update(platforms: Collidable[]): void {
    const ray: Ray = {
      origin: { x: this.position.x, y: this.position.y },
      direction: { x: 0, y: 1 },
      maxDistance: 100
    };

    // Reuse result object (zero allocation)
    CollisionDetector.raycast(ray, platforms, this.raycastResult);

    if (this.raycastResult.hit) {
      // Use result...
    }
  }
}
```

### Spatial Partitioning (Future Optimization)

For many entities and obstacles, consider implementing spatial partitioning:

```typescript
// Future: Only raycast against nearby entities
const nearbyObstacles = spatialGrid.query(rayOrigin, rayMaxDistance);
const result = CollisionDetector.raycast(ray, nearbyObstacles);
```

## Debug Visualization

Visualize rays during development:

```typescript
class Game {
  private debugRaycasts: boolean = true;

  render(): void {
    // Your normal rendering...

    if (this.debugRaycasts) {
      // Draw ray
      this.renderer.drawRay(
        ray.origin.x,
        ray.origin.y,
        ray.direction.x,
        ray.direction.y,
        ray.maxDistance,
        '#ff00ff',  // Magenta
        2
      );

      // Draw hit point and normal
      if (result.hit) {
        this.renderer.drawRaycastHit(
          result.point.x,
          result.point.y,
          result.normal.x,
          result.normal.y,
          '#00ff00',  // Green
          20
        );
      }
    }
  }
}
```

## Helper Utilities

Create reusable raycast helpers for common operations:

```typescript
export class RaycastHelpers {
  /**
   * Cast ray downward from position
   */
  static groundCheck(
    position: Vec2,
    radius: number,
    platforms: Collidable[]
  ): RaycastResult {
    const ray: Ray = {
      origin: { x: position.x, y: position.y },
      direction: { x: 0, y: 1 },
      maxDistance: radius + 5
    };
    return CollisionDetector.raycast(ray, platforms);
  }

  /**
   * Cast ray in direction of Vec2
   */
  static castInDirection(
    origin: Vec2,
    direction: Vec2,
    maxDistance: number,
    targets: Collidable[]
  ): RaycastResult {
    const normalized = direction.clone().normalize();
    const ray: Ray = {
      origin: { x: origin.x, y: origin.y },
      direction: { x: normalized.x, y: normalized.y },
      maxDistance
    };
    return CollisionDetector.raycast(ray, targets);
  }

  /**
   * Check if path is clear between two points
   */
  static isPathClear(
    from: Vec2,
    to: Vec2,
    obstacles: Collidable[]
  ): boolean {
    const direction = to.clone().subtract(from);
    const distance = direction.magnitude();
    direction.normalize();

    const ray: Ray = {
      origin: { x: from.x, y: from.y },
      direction: { x: direction.x, y: direction.y },
      maxDistance: distance
    };

    const hit = CollisionDetector.raycast(ray, obstacles);
    return !hit.hit || hit.distance >= distance;
  }
}
```

## Best Practices

1. **Normalize Direction Vectors**: Always normalize direction vectors for accurate distance calculations
2. **Appropriate Ray Length**: Set `maxDistance` based on your use case (don't make it too long unnecessarily)
3. **Reuse Result Objects**: Use the optional `out` parameter for zero-allocation raycasts in hot paths
4. **Debug Visualization**: Enable debug rendering during development to verify ray behavior
5. **Combine with Overlap Checks**: Use raycasts for prediction/detection, but still handle actual collisions with overlap checks
6. **Consider Performance**: For many raycasts per frame, consider spatial partitioning to reduce entities checked

## Architecture Integration

The raycast system follows the game's architecture principles:

- ✅ **Zero-Allocation Pattern**: Optional output parameter for reusing result objects
- ✅ **Type Safety**: Full TypeScript strict mode with proper interfaces
- ✅ **Reusability**: Works with any `Collidable` entity
- ✅ **Performance**: Optimized algorithms (quadratic for circles, slab method for rectangles)
- ✅ **Extensibility**: Easy to add new shape types in the future

## Summary

Raycasts are a powerful tool for any entity in your game. They provide:
- Directional awareness (which direction collision will occur)
- Distance information (how far until collision)
- Surface normals (which side was hit)
- Prediction capability (detect collisions before they happen)

Use this system to build sophisticated gameplay mechanics like wall jumping, line of sight AI, precise ground detection, and more!
