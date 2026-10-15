export class TargetCompiler {
    /**
     * Evaluates image dimensions, contrast, and feature richness for AR tracking.
     */
    static async evaluateImageQuality(imageSource) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                const aspectRatio = width / height;
                // Compute contrast heuristic using offscreen canvas
                let contrastScore = 0.5;
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.min(width, 256);
                    canvas.height = Math.min(height, 256);
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imgData.data;
                        let sum = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                            sum += lum;
                        }
                        const mean = sum / (data.length / 4);
                        let variance = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                            variance += Math.pow(lum - mean, 2);
                        }
                        const stdDev = Math.sqrt(variance / (data.length / 4));
                        contrastScore = Math.min(1, stdDev / 128);
                    }
                }
                catch {
                    contrastScore = 0.7;
                }
                const recommendations = [];
                if (width < 640 || height < 480) {
                    recommendations.push('Se recomienda una resolución mínima de 800x600 px para mayor densidad de puntos.');
                }
                if (contrastScore < 0.3) {
                    recommendations.push('La imagen tiene bajo contraste. Añade detalles, bordes y texturas distintivas.');
                }
                const isHighQuality = width >= 640 && height >= 480 && contrastScore >= 0.25;
                resolve({
                    width,
                    height,
                    aspectRatio,
                    contrastScore: Number(contrastScore.toFixed(2)),
                    isHighQuality,
                    recommendations,
                });
            };
            img.onerror = () => reject(new Error('No se pudo cargar la imagen para evaluar calidad.'));
            if (typeof imageSource === 'string') {
                img.src = imageSource;
            }
            else {
                img.src = URL.createObjectURL(imageSource);
            }
        });
    }
}
//# sourceMappingURL=targetCompiler.js.map