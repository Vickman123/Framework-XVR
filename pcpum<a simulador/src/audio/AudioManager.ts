import { events } from '../core/EventBus';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterVolume: number = 0.8;

  private constructor() {
    this.setupUnlockListeners();
    this.setupEventSounds();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private get audioDestination(): AudioNode {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.masterGain;
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  private setupUnlockListeners(): void {
    const unlock = () => {
      this.initContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  private setupEventSounds(): void {
    // 1. Escaneo NFC exitoso
    events.on('CREDENTIAL_SCANNED', () => {
      this.playNFCSuccessBeep();
    });

    // 2. Cambio de pestaña en monitor
    events.on('SCREEN_TAB_CHANGED', () => {
      this.playClickSound();
    });

    // 3. Validación de usuario
    events.on('USER_VALIDATION_TOGGLED', (isValid: boolean) => {
      if (isValid) {
        this.playSuccessChime();
      } else {
        this.playClickSound();
      }
    });

    // 4. Agarrar objeto
    events.on('OBJECT_GRABBED', () => {
      this.playGrabSound();
    });

    // 5. Soltar objeto
    events.on('OBJECT_RELEASED', () => {
      this.playDropSound();
    });

    // 6. Puerta del carro
    events.on('CART_DOOR_TOGGLED', (isOpen: boolean) => {
      this.playDoorSound(isOpen);
    });

    // 7. Dictamen de inspección
    events.on('INSPECTION_DECISION_MADE', (type: string) => {
      if (type === 'BUEN_ESTADO') {
        this.playSuccessChime();
      } else {
        this.playWarningBeep();
      }
    });

    // 8. Tarea de tutorial completada
    events.on('TUTORIAL_TASK_COMPLETED', () => {
      this.playTaskCompleteSound();
    });

    // 9. Laptop acoplada a bahía de recarga en el Carro 01
    events.on('LAPTOP_SNAPPED_TO_CART', () => {
      this.playDockSound();
    });

    // 10. Puntuación y rachas competitivas
    events.on('SCORE_UPDATED', (data: { streak: number }) => {
      this.playScoreBonusSound(data.streak);
    });

    events.on('PENALTY_APPLIED', () => {
      this.playPenaltySound();
    });

    events.on('SETTING_VOLUME_CHANGED', (volume: number) => {
      this.setVolume(volume);
    });
  }

  public playNFCSuccessBeep(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Primer tono (880 Hz - La5)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.audioDestination);

    osc1.start(now);
    osc1.stop(now + 0.12);

    // Segundo tono más agudo (1760 Hz - La6)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now + 0.1);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(this.audioDestination);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  }

  public playClickSound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.audioDestination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playGrabSound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.audioDestination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playDropSound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.audioDestination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playDoorSound(isOpen: boolean): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const startFreq = isOpen ? 300 : 450;
    const endFreq = isOpen ? 450 : 250;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.audioDestination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSuccessChime(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Do, Mi, Sol, Do

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + (idx * 0.07);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  public playWarningBeep(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(260, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioDestination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playTaskCompleteSound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.audioDestination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playThudSound(): void {
    this.playDropSound();
  }

  public playVictoryChime(): void {
    this.playSuccessChime();
  }

  public playDockSound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Clic mecánico de acople tipo pestillo magnético
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(260, now);
    clickOsc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    clickGain.gain.setValueAtTime(0.22, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    clickOsc.connect(clickGain);
    clickGain.connect(this.audioDestination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);

    // 2. Chime armónico de conexión de carga institucional (Mi5 -> Sol#5 -> Si5)
    const freqs = [659.25, 830.61, 987.77];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + 0.04 + (idx * 0.07);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  public playScoreBonusSound(streak: number = 1): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const baseFreq = 523.25 * Math.pow(1.10, Math.min(5, streak) - 1);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.audioDestination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playPenaltySound(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioDestination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const audio = AudioManager.getInstance();
