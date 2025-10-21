import { Sprite } from "./sprite";

export interface Renderer {
    clear(): void;
    resize(): void;
    drawText(text: string, x: number, y: number, color?: string, font?: string): void;
    drawCircle(x: number, y: number, radius: number, color?: string): void;
    drawRect(x: number, y: number, width: number, height: number, color?: string): void;
    drawSprite(sprite: Sprite, x: number, y: number, width: number, height: number): void;
    drawLine(x1: number, y1: number, x2: number, y2: number, color?: string, lineWidth?: number): void;
    getWidth(): number;
    getHeight(): number;
    fillBackground(color: string): void;
    drawRay(originX: number, originY: number, directionX: number, directionY: number, maxDistance: number, color?: string, lineWidth?: number): void;
    drawRaycastHit(hitX: number, hitY: number, normalX: number, normalY: number, color?: string, normalLength?: number): void;
}