import * as THREE from 'three';
import type { PlayerController } from '../player/PlayerController.js';

export class MobileControls {
  private joystickZone: HTMLElement | null;
  private joystickKnob: HTMLElement | null;
  private playerController: PlayerController;

  private isDragging: boolean = false;
  private touchId: number | null = null;
  private center: { x: number; y: number } = { x: 0, y: 0 };
  private maxRadius: number = 44;

  constructor(playerController: PlayerController) {
    this.playerController = playerController;
    this.joystickZone = document.getElementById('joystick-zone');
    this.joystickKnob = document.getElementById('joystick-knob');

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.joystickZone || !this.joystickKnob) return;

    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.touchId = touch.identifier;
      this.isDragging = true;
      this.joystickZone?.classList.add('active');

      const rect = this.joystickZone!.getBoundingClientRect();
      this.center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      this.updateKnobPosition(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchId) {
          this.updateKnobPosition(touch.clientX, touch.clientY);
        }
      }
    }, { passive: false });

    const stopDrag = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.isDragging = false;
          this.touchId = null;
          this.joystickZone?.classList.remove('active');
          this.resetKnob();
        }
      }
    };

    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);
  }

  private updateKnobPosition(clientX: number, clientY: number): void {
    const dx = clientX - this.center.x;
    const dy = clientY - this.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    }

    // Set normalized vector in player controller
    this.playerController.touchMoveVector.set(
      knobX / this.maxRadius,
      knobY / this.maxRadius
    );
  }

  private resetKnob(): void {
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    }
    this.playerController.touchMoveVector.set(0, 0);
  }
}
