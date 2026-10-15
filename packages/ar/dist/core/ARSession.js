/**
 * ARSession evaluates device capabilities, permissions, secure contexts (HTTPS),
 * and potential WebXR support before launching experiences.
 */
export class ARSession {
    /**
     * Evaluates browser, camera, and WebXR capabilities asynchronously.
     */
    static async checkCapabilities() {
        const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
        const isSecureContext = isBrowser
            ? Boolean(window.isSecureContext ||
                window.location?.hostname === 'localhost' ||
                window.location?.hostname === '127.0.0.1' ||
                window.location?.protocol === 'https:')
            : false;
        const hasCameraSupport = isBrowser
            ? Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')
            : false;
        let hasWebXRSupport = false;
        let hasWebXRARSupport = false;
        if (isBrowser && 'xr' in navigator && navigator.xr) {
            hasWebXRSupport = true;
            try {
                hasWebXRARSupport = await navigator.xr.isSessionSupported('immersive-ar');
            }
            catch {
                hasWebXRARSupport = false;
            }
        }
        const hasBarcodeDetector = isBrowser && 'BarcodeDetector' in window;
        const recommendations = [];
        if (!isSecureContext) {
            recommendations.push('La cámara requiere un contexto seguro (HTTPS o localhost). La experiencia no podrá acceder al sensor en HTTP no seguro.');
        }
        if (!hasCameraSupport) {
            recommendations.push('Este navegador no soporta MediaDevices.getUserMedia. Prueba en Safari (iOS 11+) o Chrome/Edge (Android/Desktop).');
        }
        if (!hasWebXRARSupport) {
            recommendations.push('WebXR immersive-ar no está disponible en este dispositivo. Se usará el pipeline de visión por computadora estándar (Canvas + WebAssembly).');
        }
        return {
            isSecureContext,
            hasCameraSupport,
            hasWebXRSupport,
            hasWebXRARSupport,
            hasBarcodeDetector,
            recommendations,
        };
    }
    /**
     * Prompts the user for camera access permissions.
     * Throws an informative error if the user denies or camera is unavailable.
     */
    static async requestCameraPermission() {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            throw new Error('El navegador no admite captura de video vía getUserMedia.');
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            // Stop stream immediately; this was only to verify/acquire permission
            for (const track of stream.getTracks()) {
                track.stop();
            }
            return true;
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                throw new Error('Permiso de cámara denegado por el usuario o las políticas del navegador.');
            }
            else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                throw new Error('No se detectó ninguna cámara disponible en el dispositivo.');
            }
            else {
                throw new Error(`Error al solicitar acceso a la cámara: ${err.message || err.name}`);
            }
        }
    }
}
//# sourceMappingURL=ARSession.js.map