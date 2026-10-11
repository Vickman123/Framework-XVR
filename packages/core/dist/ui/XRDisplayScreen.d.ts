import * as THREE from 'three';
import type { XRDisplayScreenOptions, XRMediaItem, XRCanvasHotspot } from './types.js';
/**
 * XRDisplayScreen provides dynamic, interactive 3D billboards and widescreen cinema panels
 * capable of rendering dynamic canvas UIs, high-resolution photo galleries, and video streams.
 * Includes automatic aspect-ratio fitting, UV raycast hotspots, next/prev navigation,
 * and seamless WebXR controller integration.
 */
export declare class XRDisplayScreen {
    readonly group: THREE.Group;
    readonly screenMesh: THREE.Mesh;
    readonly frameMesh: THREE.Mesh;
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    readonly texture: THREE.CanvasTexture;
    private options;
    private items;
    private currentIndex;
    private autoTimer;
    private hotspots;
    private loadedImages;
    private activeVideoElement;
    private videoTexture;
    private isVideoMode;
    constructor(options?: XRDisplayScreenOptions);
    /**
     * Sets the media items playlist and redraws the display.
     */
    setItems(items: XRMediaItem[]): void;
    /**
     * Navigates to a specific media index or cycles forward/backward.
     */
    setIndex(index: number): void;
    next(): void;
    prev(): void;
    /**
     * Loads and plays a video directly onto this 3D screen.
     */
    setVideo(url: string, autoplay?: boolean): HTMLVideoElement;
    /**
     * Pauses active video playback or resumes it.
     */
    toggleVideoPlay(): boolean;
    /**
     * Registers an interactive hotspot region (UV 0..1 coordinates).
     */
    registerHotspot(hotspot: XRCanvasHotspot): void;
    /**
     * Handles a raycast UV hit from desktop mouse or Meta Quest controller.
     * @param uv UV coordinate vector (from 0 to 1)
     */
    handleUVClick(uv: THREE.Vector2): boolean;
    /**
     * Starts automatic slide cycling.
     */
    startAutoCycle(): void;
    /**
     * Stops automatic slide cycling.
     */
    stopAutoCycle(): void;
    /**
     * Redraws the 2D canvas texture.
     */
    render(): void;
    private drawImageFit;
    private setupDefaultHotspots;
    private cleanActiveVideo;
    /**
     * Disposes all Three.js resources and video/texture allocations.
     */
    dispose(): void;
}
//# sourceMappingURL=XRDisplayScreen.d.ts.map