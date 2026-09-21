import * as THREE from 'three';
import { soundManager } from '../core/AudioSystem.js';

export type InteractionCallback = (target: THREE.Object3D, metadata: any) => void;

export class InteractionSystem {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;
  private maxDistance: number = 4.2;

  public currentTarget: THREE.Object3D | null = null;
  public candidateMeshes: THREE.Object3D[] = [];
  private onInteractCallback: InteractionCallback | null = null;

  // DOM elements for feedback
  private crosshairEl: HTMLElement | null = null;
  private promptEl: HTMLElement | null = null;
  private promptTextEl: HTMLElement | null = null;

  private lastHoveredUuid: string | null = null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.maxDistance;

    this.crosshairEl = document.getElementById('crosshair');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('prompt-text');

    this.bindEvents();
  }

  public setCandidates(meshes: THREE.Object3D[]): void {
    this.candidateMeshes = meshes;
  }

  public onInteract(cb: InteractionCallback): void {
    this.onInteractCallback = cb;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && this.currentTarget) {
        this.triggerInteraction();
      }
    });

    // Mobile action button or screen click
    const mobileBtn = document.getElementById('mobile-action-btn');
    if (mobileBtn) {
      const handleMobileAction = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentTarget) {
          this.triggerInteraction();
        }
      };
      mobileBtn.addEventListener('touchstart', handleMobileAction, { passive: false });
      mobileBtn.addEventListener('click', handleMobileAction);
    }

    // Direct tap on interaction prompt
    if (this.promptEl) {
      const handlePromptTap = (e: Event) => {
        e.preventDefault();
        if (this.currentTarget) {
          this.triggerInteraction();
        }
      };
      this.promptEl.addEventListener('touchstart', handlePromptTap, { passive: false });
      this.promptEl.addEventListener('click', handlePromptTap);
    }
  }

  public triggerInteraction(): void {
    if (!this.currentTarget || !this.currentTarget.userData?.interactive) return;
    soundManager.playSelect();
    if (this.onInteractCallback) {
      this.onInteractCallback(this.currentTarget, this.currentTarget.userData);
    }
  }

  /**
   * Called every frame in the render loop to raycast from screen center
   */
  public update(): void {
    if (this.candidateMeshes.length === 0) return;

    // Raycast straight forward from camera center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.candidateMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const target = hit.object;

      if (target.userData && target.userData.interactive) {
        if (this.lastHoveredUuid !== target.uuid) {
          this.lastHoveredUuid = target.uuid;
          soundManager.playHover();
        }

        this.currentTarget = target;
        this.showPrompt(target.userData.promptText || 'INTERACT');
        return;
      }
    }

    // No interactive object targeted
    this.clearTarget();
  }

  private showPrompt(text: string): void {
    if (this.crosshairEl) {
      this.crosshairEl.classList.add('active');
    }
    if (this.promptEl && this.promptTextEl) {
      this.promptTextEl.textContent = text;
      this.promptEl.classList.add('visible');
    }
    const mobileBtn = document.getElementById('mobile-action-btn');
    if (mobileBtn) {
      mobileBtn.classList.add('active');
      mobileBtn.innerHTML = `<span>⚡</span><span>${text}</span>`;
    }
  }

  private clearTarget(): void {
    this.currentTarget = null;
    this.lastHoveredUuid = null;

    if (this.crosshairEl) {
      this.crosshairEl.classList.remove('active');
    }
    if (this.promptEl) {
      this.promptEl.classList.remove('visible');
    }
    const mobileBtn = document.getElementById('mobile-action-btn');
    if (mobileBtn) {
      mobileBtn.classList.remove('active');
      mobileBtn.innerHTML = `<span>INTERACT</span>`;
    }
  }
}
