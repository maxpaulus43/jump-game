import { System } from '../System.js';
import type { ECSWorld } from '../ECSWorld.js';
import { Transform } from '../components/Transform.js';
import { CameraTarget } from '../components/CameraTarget.js';
import type { Camera } from '../../systems/Camera.js';

/**
 * CameraFollowSystem updates camera to follow entities with CameraTarget component
 * 
 * Typically used to make the camera follow the player
 * Only one entity should have CameraTarget component at a time
 */
export class CameraFollowSystem extends System {
    readonly name = 'CameraFollowSystem';

    private camera: Camera;

    constructor(camera: Camera) {
        super();
        this.camera = camera;
    }

    update(dt: number, world: ECSWorld): void {
        // Find entity with CameraTarget component
        const targets = world.query({
            with: [Transform.type, CameraTarget.type]
        });

        if (targets.length > 0) {
            // Use the first target (should only be one)
            const target = targets[0];
            const transform = world.getComponent(target, Transform.type)!;

            // Update camera to follow target's Y position
            this.camera.update(dt, transform.y);
        }
    }
}
