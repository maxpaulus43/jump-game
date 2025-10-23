import { System } from './System.js';
import type { World } from '../World.js';
import { Transform } from '../components/Transform.js';
import { CameraTarget } from '../components/CameraTarget.js';
import type { Camera } from '../../managers/Camera.js';

/**
 * CameraFollowSystem updates camera to follow entities with CameraTarget component
 * 
 * Typically used to make the camera follow the player
 * Only one entity should have CameraTarget component at a time
 * 
 * Camera only follows upward movement (standard platformer behavior)
 */
export class CameraFollowSystem extends System {
    readonly name = 'CameraFollowSystem';

    private camera: Camera;
    private lastTargetY: number | null = null;

    constructor(camera: Camera) {
        super();
        this.camera = camera;
    }

    update(dt: number, world: World): void {
        // Find entity with CameraTarget component
        const targets = world.query({
            with: [Transform.type, CameraTarget.type]
        });

        if (targets.length > 0) {
            // Use the first target (should only be one)
            const target = targets[0];
            const transform = world.getComponent(target, Transform.type)!;

            // Only update camera if player is moving upward (decreasing Y)
            // or if this is the first update
            if (this.lastTargetY === null || transform.y < this.lastTargetY) {
                // Update camera to follow target's Y position
                this.camera.update(dt, transform.y);
            }

            // Track last Y position for next frame
            this.lastTargetY = transform.y;
        }
    }
}
