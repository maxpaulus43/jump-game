/**
 * SystemScheduler
 * 
 * Manages system registration and execution order.
 * Systems are executed in the order they are registered (manual ordering).
 * 
 * Design:
 * - Simple array-based execution (no automatic dependency resolution)
 * - Systems execute in registration order
 * - Systems can be enabled/disabled without removing them
 * - Each system's update() is called once per frame
 * 
 * Usage:
 * 1. Create scheduler: `const scheduler = new SystemScheduler()`
 * 2. Register systems: `scheduler.addSystem(new PhysicsSystem())`
 * 3. Update all: `scheduler.update(dt, world)`
 * 
 * System Order Example:
 * 1. InputSystem - Read input
 * 2. PhysicsSystem - Apply forces, update positions
 * 3. CollisionSystem - Detect and resolve collisions
 * 4. RenderSystem - Draw everything
 * 
 * @example
 * const scheduler = new SystemScheduler();
 * scheduler.addSystem(new InputSystem());
 * scheduler.addSystem(new PhysicsSystem());
 * scheduler.addSystem(new CollisionSystem());
 * scheduler.addSystem(new RenderSystem());
 * 
 * // Each frame
 * scheduler.update(dt, world);
 */

import type { System, SystemClass, World } from '../types';

/**
 * SystemScheduler class
 * 
 * Orchestrates system execution in a defined order.
 */
export class SystemScheduler {
  /**
   * Registered systems in execution order
   */
  private systems: System[] = [];

  /**
   * Map of system class to instance for lookup
   */
  private systemMap: Map<Function, System> = new Map();

  /**
   * Add a system to the scheduler
   * 
   * Systems are executed in the order they are added.
   * If a system of the same class already exists, it will not be added again.
   * 
   * @param system - The system instance to add
   * @returns true if system was added, false if it already exists
   * 
   * @example
   * scheduler.addSystem(new PhysicsSystem());
   * scheduler.addSystem(new RenderSystem());
   */
  addSystem(system: System): boolean {
    const systemClass = system.constructor;

    // Check if system of this type already exists
    if (this.systemMap.has(systemClass)) {
      console.warn(`System ${system.name} is already registered`);
      return false;
    }

    this.systems.push(system);
    this.systemMap.set(systemClass, system);
    return true;
  }

  /**
   * Remove a system from the scheduler
   * 
   * Calls the system's onDestroy() lifecycle hook if present.
   * 
   * @param system - The system instance to remove
   * @returns true if system was removed, false if it wasn't registered
   * 
   * @example
   * scheduler.removeSystem(physicsSystem);
   */
  removeSystem(system: System): boolean {
    const systemClass = system.constructor;
    const index = this.systems.indexOf(system);

    if (index === -1) {
      return false;
    }

    // Call lifecycle hook
    if (system.onDestroy) {
      system.onDestroy();
    }

    // Remove from arrays
    this.systems.splice(index, 1);
    this.systemMap.delete(systemClass);
    return true;
  }

  /**
   * Remove a system by its class
   * 
   * Convenient alternative to removeSystem() when you don't have the instance.
   * 
   * @param systemClass - The system class constructor
   * @returns true if system was removed, false if it wasn't registered
   * 
   * @example
   * scheduler.removeSystemByClass(PhysicsSystem);
   */
  removeSystemByClass(systemClass: SystemClass): boolean {
    const system = this.systemMap.get(systemClass);
    if (!system) {
      return false;
    }
    return this.removeSystem(system);
  }

  /**
   * Get a system instance by its class
   * 
   * Useful for accessing system-specific methods or state.
   * 
   * @param systemClass - The system class constructor
   * @returns The system instance, or undefined if not registered
   * 
   * @example
   * const physics = scheduler.getSystem(PhysicsSystem);
   * if (physics) {
   *   physics.setGravity(1000);
   * }
   */
  getSystem<T extends System>(systemClass: SystemClass): T | undefined {
    return this.systemMap.get(systemClass) as T | undefined;
  }

  /**
   * Check if a system is registered
   * 
   * @param systemClass - The system class constructor
   * @returns true if system is registered
   * 
   * @example
   * if (scheduler.hasSystem(PhysicsSystem)) {
   *   // Physics system is active
   * }
   */
  hasSystem(systemClass: SystemClass): boolean {
    return this.systemMap.has(systemClass);
  }

  /**
   * Update all systems
   * 
   * Calls update() on each system in registration order.
   * Systems are called sequentially (not in parallel).
   * 
   * @param dt - Delta time in seconds (typically 1/60 = 0.01667)
   * @param world - The ECS world
   * 
   * @example
   * // Called each frame by the game loop
   * scheduler.update(dt, world);
   */
  update(dt: number, world: World): void {
    for (const system of this.systems) {
      system.update(dt, world);
    }
  }

  /**
   * Get all registered systems
   * 
   * Returns a copy of the systems array to prevent external modification.
   * 
   * @returns Array of system instances in execution order
   * 
   * @example
   * const systems = scheduler.getSystems();
   * console.log(`${systems.length} systems registered`);
   */
  getSystems(): System[] {
    return [...this.systems];
  }

  /**
   * Get the number of registered systems
   * 
   * @returns Number of systems
   * 
   * @example
   * console.log(`${scheduler.getSystemCount()} systems active`);
   */
  getSystemCount(): number {
    return this.systems.length;
  }

  /**
   * Clear all systems
   * 
   * Removes all systems and calls their onDestroy() hooks.
   * Useful for resetting the game state.
   * 
   * @example
   * scheduler.clear();
   * // All systems removed and cleaned up
   */
  clear(): void {
    // Call onDestroy on all systems
    for (const system of this.systems) {
      if (system.onDestroy) {
        system.onDestroy();
      }
    }

    this.systems = [];
    this.systemMap.clear();
  }

  /**
   * Get system names for debugging
   * 
   * Returns an array of system names in execution order.
   * 
   * @returns Array of system names
   * 
   * @example
   * const names = scheduler.getSystemNames();
   * console.log(`System order: ${names.join(' -> ')}`);
   */
  getSystemNames(): string[] {
    return this.systems.map(system => system.name);
  }
}
