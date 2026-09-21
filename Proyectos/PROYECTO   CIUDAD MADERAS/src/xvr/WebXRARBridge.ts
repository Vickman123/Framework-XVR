/**
 * WebXRARBridge resolves the documented "VXR/XVR Gap":
 * XRSession in XVR currently only initiates 'immersive-vr' sessions.
 * This bridge adds detection and initialization for 'immersive-ar' (passthrough AR on Quest 3 / Android ARCore)
 * and provides application-level surface anchoring fallbacks.
 */
export class WebXRARBridge {
  private activeSession: globalThis.XRSession | null = null;

  public static async isARSupported(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('xr' in navigator) || !navigator.xr) {
      return false;
    }
    try {
      return await navigator.xr.isSessionSupported('immersive-ar');
    } catch {
      return false;
    }
  }

  public async enterAR(
    renderer: any,
    onSessionEnd?: () => void
  ): Promise<globalThis.XRSession | null> {
    if (typeof navigator === 'undefined' || !('xr' in navigator) || !navigator.xr) {
      throw new Error('WebXR no está disponible en este navegador.');
    }

    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hit-test', 'camera-access'],
      });

      this.activeSession = session;

      if (renderer && renderer.xr) {
        await renderer.xr.setSession(session);
      }

      session.addEventListener('end', () => {
        this.activeSession = null;
        if (onSessionEnd) onSessionEnd();
      });

      return session;
    } catch (err: any) {
      console.warn('[WebXRARBridge] No se pudo iniciar sesión WebXR AR:', err);
      throw err;
    }
  }

  public async exitAR(): Promise<void> {
    if (this.activeSession) {
      await this.activeSession.end();
      this.activeSession = null;
    }
  }

  public get isPresentingAR(): boolean {
    return this.activeSession !== null;
  }
}
