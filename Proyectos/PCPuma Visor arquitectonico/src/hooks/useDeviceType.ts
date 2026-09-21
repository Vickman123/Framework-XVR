import { useState, useEffect } from 'react';

export function useDeviceType() {
  const [isMetaQuest, setIsMetaQuest] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return false;
    return /OculusBrowser|Quest/i.test(navigator.userAgent);
  });
  const [hasXRSupport, setHasXRSupport] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const ua = navigator.userAgent;
    const isQuestUA = /OculusBrowser|Quest/i.test(ua);
    setIsMetaQuest(isQuestUA);

    // WebXR immersive check
    if ('xr' in navigator && (navigator as any).xr?.isSessionSupported) {
      (navigator as any).xr
        .isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          setHasXRSupport(supported);
          if (supported) {
            setIsMetaQuest(true);
          }
        })
        .catch(() => {
          setHasXRSupport(false);
        });
    }
  }, []);

  return { isMetaQuest, hasXRSupport };
}
