import { soundManager } from '../core/AudioSystem.js';
import type { PlayerController } from '../player/PlayerController.js';
import type { WorldManager } from '../world/WorldManager.js';

export class HUD {
  private zoneEl: HTMLElement | null;
  private soundBtn: HTMLElement | null;
  private enterBtn: HTMLElement | null;
  private overlayEl: HTMLElement | null;

  private playerController: PlayerController | null = null;
  private worldManager: WorldManager | null = null;
  private lastZoneId: string = '';

  constructor() {
    this.zoneEl = document.getElementById('hud-zone');
    this.soundBtn = document.getElementById('btn-sound');
    this.enterBtn = document.getElementById('btn-enter');
    this.overlayEl = document.getElementById('instructions-overlay');

    this.bindEvents();
    this.detectTouchDevice();
    this.initOrientationDetection();
  }

  public setDependencies(player: PlayerController, world: WorldManager): void {
    this.playerController = player;
    this.worldManager = world;
  }

  private bindEvents(): void {
    // Sound mute toggle
    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        const isMuted = soundManager.toggleMute();
        this.soundBtn!.innerHTML = `<span>SOUND: ${isMuted ? 'OFF' : 'ON'}</span>`;
        if (isMuted) {
          this.soundBtn!.classList.remove('active');
        } else {
          this.soundBtn!.classList.add('active');
        }
      });
    }

    // Start / Enter Facility button
    if (this.enterBtn && this.overlayEl) {
      const startExp = () => {
        soundManager.init();
        soundManager.resumeContext();
        this.overlayEl!.classList.add('hidden');
        if (this.playerController) {
          try {
            this.playerController.requestPointerLock();
          } catch {
            // Ignored on mobile touchscreens
          }
        }
      };

      this.enterBtn.addEventListener('click', startExp);
      this.overlayEl.addEventListener('click', (e) => {
        if (e.target === this.overlayEl) {
          startExp();
        }
      });
    }

    // Re-lock pointer on canvas click if overlay is already hidden
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.addEventListener('click', () => {
        if (
          this.overlayEl?.classList.contains('hidden') &&
          this.playerController &&
          !this.playerController.isLocked &&
          !this.isTouchDevice()
        ) {
          this.playerController.requestPointerLock();
        }
      });
    }
  }

  private isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  private detectTouchDevice(): void {
    if (this.isTouchDevice() || window.innerWidth <= 1024) {
      document.body.classList.add('touch-device');
    }
  }

  private initOrientationDetection(): void {
    const checkOrientation = () => {
      const isTouch = this.isTouchDevice() || window.innerWidth <= 900;
      const isPortrait =
        window.innerHeight > window.innerWidth ||
        window.matchMedia('(orientation: portrait)').matches;

      if (isTouch && isPortrait) {
        document.body.classList.add('is-portrait');
      } else {
        document.body.classList.remove('is-portrait');
        // Reset manual override once the user rotates back to landscape
        document.body.classList.remove('orientation-overridden');
      }
    };

    // Listeners for window resize, orientationchange, and modern screen.orientation API
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    }

    // Manual override button in orientation modal
    const overrideBtn = document.getElementById('btn-orientation-override');
    if (overrideBtn) {
      overrideBtn.addEventListener('click', () => {
        document.body.classList.add('orientation-overridden');
      });
    }

    // Run initial check
    checkOrientation();
  }

  public update(): void {
    if (!this.worldManager || !this.playerController || !this.zoneEl) return;

    const currentZone = this.worldManager.getCurrentZone(this.playerController.position);
    if (currentZone.id !== this.lastZoneId) {
      this.lastZoneId = currentZone.id;
      this.zoneEl.textContent = `ZONE: ${currentZone.name}`;
    }
  }
}
