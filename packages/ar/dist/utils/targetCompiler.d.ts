/**
 * TargetCompiler provides validation and diagnostic tools for preparing
 * visual images and fiduciary markers for AR tracking.
 */
export interface TargetImageQuality {
    width: number;
    height: number;
    aspectRatio: number;
    contrastScore: number;
    isHighQuality: boolean;
    recommendations: string[];
}
export declare class TargetCompiler {
    /**
     * Evaluates image dimensions, contrast, and feature richness for AR tracking.
     */
    static evaluateImageQuality(imageSource: string | File): Promise<TargetImageQuality>;
}
//# sourceMappingURL=targetCompiler.d.ts.map