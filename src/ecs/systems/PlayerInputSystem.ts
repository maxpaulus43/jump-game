import { System } from '../System.js';
import type { ECSWorld } from '../ECSWorld.js';
import { Transform } from '../components/Transform.js';
import { Velocity } from '../components/Velocity.js';
import { PlayerController } from '../components/PlayerController.js';
import type { InputController } from '../../types/input.js';

/**
 * PlayerInputSystem applies input from keyboard/accelerometer to player entities
 * 
 * Updates velocity based on input direction and player acceleration
 * Handles jump input when player is grounded
 */
export class PlayerInputSystem extends System {
  readonly name = 'PlayerInputSystem';
  
  private inputController: InputController;

  constructor(inputController: InputController) {
    super();
    this.inputController = inputController;
  }

  update(dt: number, world: ECSWorld): void {
    const entities = world.query({
      with: [Transform.type, Velocity.type, PlayerController.type]
    });

    for (const entity of entities) {
      const velocity = world.getComponent(entity, Velocity.type)!;
      const controller = world.getComponent(entity, PlayerController.type)!;

      // Get input acceleration from controller
      const inputAccel = this.inputController.getMovementInput();

      // Apply horizontal acceleration
      velocity.x += inputAccel.x * dt;

      // Handle jump input (negative Y acceleration means jump/up input)
      // Only jump if grounded and there's upward input
      if (inputAccel.y < 0 && controller.isGrounded) {
        velocity.y = controller.jumpVelocity;
        controller.isGrounded = false; // Jump immediately ungrounds player
      }
    }
  }
}
