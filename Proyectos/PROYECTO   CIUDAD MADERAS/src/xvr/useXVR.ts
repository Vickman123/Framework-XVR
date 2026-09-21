import { useEffect, useRef, useState, useCallback } from 'react';
import { XVRViewerBridge } from './XVRViewerBridge';
import type { ModelMetrics } from 'vxr';

interface UseXVROptions {
  modelUrl?: string;
  isNight?: boolean;
}

export function useXVR(options: UseXVROptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<XVRViewerBridge | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [hasVRSupport, setHasVRSupport] = useState(false);

  // Initialize XVR bridge when container is mounted
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bridge = new XVRViewerBridge({
      container,
      initialModelUrl: options.modelUrl,
      isNight: options.isNight,
      onProgress: (pct) => setProgress(pct),
      onLoaded: (loaded) => {
        setIsLoading(false);
        setProgress(100);
        setMetrics(loaded.metrics);
      },
      onError: (err) => {
        setIsLoading(false);
        setError(err.message || 'Error al cargar modelo 3D con XVR');
      },
    });

    bridgeRef.current = bridge;
    setIsLoading(!!options.modelUrl);

    // Check VR support asynchronously
    bridge.checkVRSupport().then(setHasVRSupport);

    return () => {
      bridge.dispose();
      bridgeRef.current = null;
    };
  }, [containerRef.current]);

  // Handle modelUrl changes
  useEffect(() => {
    if (!bridgeRef.current || !options.modelUrl) return;
    setIsLoading(true);
    setProgress(0);
    setError(null);
    bridgeRef.current.loadModel(options.modelUrl);
  }, [options.modelUrl]);

  // Handle day/night mode changes
  useEffect(() => {
    if (!bridgeRef.current) return;
    bridgeRef.current.setNightMode(!!options.isNight);
  }, [options.isNight]);

  const loadModel = useCallback((url: string | File) => {
    if (!bridgeRef.current) return;
    setIsLoading(true);
    setProgress(0);
    setError(null);
    return bridgeRef.current.loadModel(url);
  }, []);

  const navigateToRoom = useCallback((pos: [number, number, number], target: [number, number, number]) => {
    bridgeRef.current?.navigateToRoom(pos, target);
  }, []);

  const enterVR = useCallback(async () => {
    await bridgeRef.current?.enterVR();
  }, []);

  const resetView = useCallback(() => {
    bridgeRef.current?.resetView();
  }, []);

  const captureSnapshot = useCallback(() => {
    return bridgeRef.current?.captureSnapshot() || null;
  }, []);

  return {
    containerRef,
    bridge: bridgeRef.current,
    isLoading,
    progress,
    error,
    metrics,
    hasVRSupport,
    loadModel,
    navigateToRoom,
    enterVR,
    resetView,
    captureSnapshot,
  };
}
