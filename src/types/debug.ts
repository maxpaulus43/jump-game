/**
 * debug.ts
 * 
 * Type definitions for debug visualization system
 */

import { RaycastResult } from './collision.js';

/**
 * Debug visualization features that can be toggled
 */
export enum DebugFeature {
  Raycasts = 'raycasts',
  Colliders = 'colliders',
  Velocity = 'velocity',
  FPS = 'fps'
}

/**
 * Configuration for debug system
 */
export interface DebugConfig {
  enabled: boolean;
  features: Set<DebugFeature>;
}

/**
 * Debug data passed to debug renderer
 */
export interface DebugData {
  entities: DebugEntity[];
  raycasts: RaycastDebugInfo[];
  fps: number;
}

/**
 * Entity debug information
 */
export interface DebugEntity {
  position: { x: number; y: number };
  velocity?: { x: number; y: number };
  radius?: number;
  isGrounded?: boolean;
}

/**
 * Raycast debug information
 */
export interface RaycastDebugInfo {
  origin: { x: number; y: number };
  direction: { x: number; y: number };
  maxDistance: number;
  result: RaycastResult;
  color: string;
}
