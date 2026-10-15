import type { ARExperienceManifest, ARQRCodeResult } from '../types.js';
/**
 * ARQRCode handles scanning, parsing, and resolving QR codes into VXR AR experiences.
 * Distinguishes scan-and-launch resolution from continuous spatial 6-DoF tracking.
 */
export declare class ARQRCode {
    private barcodeDetector;
    private canvas;
    private ctx;
    private isScanning;
    private scanIntervalId;
    constructor();
    /**
     * Scans a single frame from an HTMLVideoElement or Canvas.
     */
    scanFrame(source: HTMLVideoElement | HTMLCanvasElement): Promise<ARQRCodeResult | null>;
    /**
     * Starts a background scanner loop scanning at a fixed interval (e.g. 5 times per second).
     */
    startScanning(video: HTMLVideoElement, onDetected: (result: ARQRCodeResult) => void, intervalMs?: number): void;
    /**
     * Stops background scanning.
     */
    stopScanning(): void;
    /**
     * Resolves a raw string or URL read from a QR code into an ARExperienceManifest.
     */
    parseExperience(raw: string): ARExperienceManifest | undefined;
    private normalizeManifest;
    /**
     * Generates a sharable URL that encodes an experience manifest.
     */
    static generateExperienceURL(manifest: ARExperienceManifest, baseURL?: string): string;
    /**
     * Generates a clean standalone SVG data URL representing a QR code.
     */
    static generateQRCodeSVG(text: string): string;
    private fallbackScan;
    dispose(): void;
}
//# sourceMappingURL=ARQRCode.d.ts.map