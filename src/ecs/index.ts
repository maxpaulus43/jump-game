/**
 * ECS Module Entry Point
 * 
 * This module exports all core ECS classes, types, and utilities.
 * Import from this file to access the complete ECS API.
 * 
 * @example
 * import { ECSWorld, System, Entity, ComponentType } from './ecs';
 * 
 * const world = new ECSWorld();
 * const entity = world.createEntity();
 */

// Core types
export type {
  Entity,
  ComponentType,
  ComponentClass,
  Query,
  QueryResult,
  System as ISystem,
  SystemClass,
  ECSWorld as IECSWorld
} from './types';

// Core classes
export { SparseSet } from './SparseSet';
export type { ISparseSet } from './SparseSet';

export { EntityManager } from './EntityManager';
export { ComponentRegistry } from './ComponentRegistry';
export { QueryExecutor } from './Query';
export { ECSWorld } from './ECSWorld';
export { SystemScheduler } from './SystemScheduler';
export { System } from './System';
