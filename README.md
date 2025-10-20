# Top-Down Bullet Heaven Roguelite - Game Loop Architecture

A frame-rate independent game loop implementation using TypeScript and Canvas for a top-down bullet heaven roguelite game.

## Features

- **Fixed Timestep Game Loop**: Ensures consistent gameplay across different frame rates using the accumulator pattern
- **Frame-Rate Independence**: Game logic runs at a fixed 60 FPS regardless of rendering frame rate
- **Modular Architecture**: Clean separation of concerns with dedicated classes for each responsibility
- **TypeScript**: Full type safety with strict mode enabled
- **Canvas Rendering**: Hardware-accelerated 2D rendering
- **Input Management**: Keyboard and mouse input handling
- **Pause/Resume**: Built-in pause functionality

## Architecture

### Core Classes

- **GameLoop**: Implements fixed timestep game loop with accumulator pattern
- **Game**: Main orchestrator that coordinates all subsystems
- **Renderer**: Handles all Canvas API interactions and drawing operations
- **InputManager**: Manages keyboard and mouse input state
- **Vector2DUtils**: Utility class for 2D vector mathematics

### Directory Structure

```
game-ts/
├── src/
│   ├── core/
│   │   ├── Game.ts           # Main game orchestrator
│   │   ├── GameLoop.ts       # Fixed timestep game loop
│   │   ├── Renderer.ts       # Canvas rendering
│   │   └── InputManager.ts   # Input handling
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       └── Vector2D.ts       # Vector math utilities
├── css/
│   └── style.css             # Canvas styling
├── index.ts                  # Entry point
├── index.html                # HTML page
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project configuration
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Open `index.html` in a web browser

### Development

Watch mode for automatic recompilation:
```bash
npm run watch
```

## Usage

### Controls

- **WASD** or **Arrow Keys**: Move the player
- **P**: Pause/Resume the game
- **Mouse**: Track mouse position (for future features)

### Demo Features

The current implementation includes a test demo with:
- A controllable green circle (player)
- Frame-rate independent movement
- FPS counter display
- Pause functionality
- Screen boundary collision

## Technical Details

### Fixed Timestep Game Loop

The game loop uses a fixed timestep with accumulator pattern to ensure consistent physics and gameplay:

```typescript
while (accumulator >= fixedDeltaTime) {
  update(fixedDeltaTime);  // Always called with same dt
  accumulator -= fixedDeltaTime;
}
render();  // Called every frame
```

This approach:
- Prevents physics from breaking at different frame rates
- Ensures deterministic gameplay
- Separates update frequency from render frequency
- Prevents "spiral of death" with max delta time clamping

### Key Configuration

Default configuration in `Game.ts`:
- Target FPS: 60
- Max Delta Time: 0.25s (prevents spiral of death)
- Player Speed: 200 pixels/second

## Extending the Game

### Adding New Game Objects

1. Create entity classes in `src/entities/`
2. Add entity update logic in `Game.update()`
3. Add entity rendering in `Game.render()`

### Adding New Systems

1. Create system class in `src/systems/`
2. Initialize in `Game.constructor()`
3. Call system methods in appropriate lifecycle hooks

### Example: Adding an Enemy

```typescript
// src/entities/Enemy.ts
export class Enemy {
  position: Vector2D;
  velocity: Vector2D;
  
  update(dt: number): void {
    // Update enemy logic
  }
  
  render(renderer: Renderer): void {
    // Draw enemy
  }
}
```

## Performance Considerations

- The game loop runs updates at a fixed 60 FPS
- Rendering happens as fast as the browser allows (typically 60 FPS)
- Canvas is automatically resized to match window dimensions
- Input state is polled each frame for responsive controls

## Browser Compatibility

- Modern browsers with Canvas API support
- ES2020+ JavaScript features
- requestAnimationFrame API

## Future Enhancements

- Entity component system (ECS)
- Collision detection system
- Particle effects
- Weapon systems
- Enemy spawning
- Power-ups and upgrades
- Score tracking
- Audio system

## License

ISC

## Author

Max Paulus
