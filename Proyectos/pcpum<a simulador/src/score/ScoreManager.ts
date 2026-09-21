import { events } from "../core/EventBus";

export interface ScoreEvent {
  reason: string;
  points: number;
  multiplier: number;
  timestamp: string;
}

export type OperatorRank =
  | "OPERADOR EXPERTO (EXCELENCIA UNAM)"
  | "OPERADOR SENIOR"
  | "OPERADOR CAPACITADO"
  | "OPERADOR EN INDUCCIÓN";

export class ScoreManager {
  private static instance: ScoreManager;

  // Puntuación inicial oficial de 1,000 pts
  public currentScore: number = 1000;

  // Multiplicador de Racha (x1 a x5)
  public streak: number = 1;
  public maxStreakReached: number = 1;

  // Temporizador de turno
  public shiftTimeSeconds: number = 0;
  public isShiftActive: boolean = false;

  // Estadísticas operativas
  public completedLoans: number = 0;
  public inspectedReturns: number = 0;
  public detectedIncidents: number = 0;
  public mistakesCount: number = 0;

  // Historial de eventos de puntuación
  public history: ScoreEvent[] = [];

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): ScoreManager {
    if (!ScoreManager.instance) {
      ScoreManager.instance = new ScoreManager();
    }
    return ScoreManager.instance;
  }

  private setupListeners(): void {
    events.on("SIMULATION_STARTED", () => {
      this.isShiftActive = true;
    });

    // 1. Escaneo de credencial (+50 pts)
    events.on("CREDENTIAL_SCANNED", () => {
      this.addPoints("Escaneo conforme de credencial NFC", 50, true);
    });

    // 2. Validación de usuario (+50 pts)
    events.on("USER_VALIDATION_TOGGLED", (isValid: boolean) => {
      if (isValid) {
        this.addPoints("Validación de matrícula y estatus regular en sistema", 50, true);
      }
    });

    // 2b. Devolución de credencial al alumno en préstamo (+50 pts)
    events.on("STUDENT_RECEIVED_CREDENTIAL", () => {
      this.addPoints("Devolución reglamentaria de credencial al alumno", 50, true);
    });

    // 3. Entrega de equipo conforme (+100 pts)
    events.on("STUDENT_RECEIVED_LAPTOP", () => {
      this.completedLoans++;
      this.addPoints("Préstamo y entrega de laptop conforme a protocolo", 100, true);
    });

    // 4. Recepción e inspección técnica (+100 pts)
    events.on("INSPECTION_DECISION_MADE", (verdict: "BUEN_ESTADO" | "INCIDENCIA") => {
      this.inspectedReturns++;
      if (verdict === "INCIDENCIA") {
        this.detectedIncidents++;
        this.addPoints("Detección y reporte oportuno de incidencia técnica", 100, true);
      } else {
        this.addPoints("Peritaje de 5 puntos conforme sin anomalías", 100, true);
      }
    });

    // 5. Resguardo en Carro 01 (+50 pts)
    events.on("LAPTOP_SNAPPED_TO_CART", () => {
      this.addPoints("Resguardo y conexión de recarga en Carro 01", 50, true);
    });

    // 5b. Firma de Acta de Incidencia Oficial (+150 pts)
    events.on("INCIDENT_ACT_SIGNED", () => {
      this.addPoints("Levantamiento y firma de Acta de Incidencia Oficial UNAM (Art. 24)", 150, true);
    });

    // 5c. Rechazo reglamentario de alumno con sanción (+100 pts)
    events.on("LOAN_REJECTED_SANCTION", () => {
      this.addPoints("Detección de sanción previa y rechazo reglamentario (Art. 31)", 100, true);
    });

    // 5d. Devolución de credencial a alumno rechazado (+50 pts)
    events.on("STUDENT_RECEIVED_CREDENTIAL_REJECTED", () => {
      this.addPoints("Devolución reglamentaria de credencial tras rechazo", 50, true);
    });

    // 6. Devolución final de credencial (+50 pts + bono si 0 errores)
    events.on("STUDENT_RECEIVED_CREDENTIAL_RETURN", () => {
      this.addPoints("Devolución final de credencial y cierre de trámite", 50, true);
      // Bono adicional por ciclo completo impecable si no hubo errores
      if (this.mistakesCount === 0) {
        this.addPoints("Bono de Excelencia Operativa UNAM (Ciclo sin errores)", 100, false);
      }
    });
  }

  public addPoints(reason: string, basePoints: number, advanceStreak: boolean = true): void {
    const mult = this.streak;
    const finalPoints = basePoints * mult;
    this.currentScore += finalPoints;

    const event: ScoreEvent = {
      reason,
      points: finalPoints,
      multiplier: mult,
      timestamp: this.getFormattedShiftTime()
    };
    this.history.unshift(event);

    if (advanceStreak) {
      this.streak = Math.min(5, this.streak + 1);
      if (this.streak > this.maxStreakReached) {
        this.maxStreakReached = this.streak;
      }
    }

    events.emit("SCORE_UPDATED", {
      score: this.currentScore,
      streak: this.streak,
      added: finalPoints,
      reason
    });

    events.emit("FLOATING_SCORE_DISPLAY", {
      text: `+${finalPoints} PTS`,
      streak: mult > 1 ? `RACHA x${mult} 🔥` : undefined,
      isBonus: true
    });
  }

  public deductPoints(reason: string, points: number): void {
    this.currentScore = Math.max(0, this.currentScore - points);
    this.streak = 1; // Un error reinicia la racha a x1
    this.mistakesCount++;

    const event: ScoreEvent = {
      reason: `[PENALIZACIÓN] ${reason}`,
      points: -points,
      multiplier: 1,
      timestamp: this.getFormattedShiftTime()
    };
    this.history.unshift(event);

    events.emit("SCORE_UPDATED", {
      score: this.currentScore,
      streak: this.streak,
      deducted: points,
      reason
    });

    events.emit("FLOATING_SCORE_DISPLAY", {
      text: `-${points} PTS`,
      streak: "RACHA PERDIDA",
      isBonus: false
    });
  }

  public update(delta: number): void {
    if (this.isShiftActive) {
      this.shiftTimeSeconds += delta;
    }
  }

  public getFormattedShiftTime(): string {
    const totalSec = Math.floor(this.shiftTimeSeconds);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
    return `${pad(mins)}:${pad(secs)}`;
  }

  public getOperatorRank(): OperatorRank {
    if (this.currentScore >= 1800) {
      return "OPERADOR EXPERTO (EXCELENCIA UNAM)";
    } else if (this.currentScore >= 1400) {
      return "OPERADOR SENIOR";
    } else if (this.currentScore >= 1000) {
      return "OPERADOR CAPACITADO";
    } else {
      return "OPERADOR EN INDUCCIÓN";
    }
  }

  public getEfficiencyPercent(): number {
    const base = 100;
    const penalty = this.mistakesCount * 8;
    return Math.max(70, Math.min(100, base - penalty));
  }

  public getSecurityPercent(): number {
    return this.mistakesCount === 0 ? 98 : 88;
  }

  public getInventoryPercent(): number {
    return 96;
  }

  public resetShift(): void {
    this.currentScore = 1000;
    this.streak = 1;
    this.maxStreakReached = 1;
    this.shiftTimeSeconds = 0;
    this.isShiftActive = true;
    this.completedLoans = 0;
    this.inspectedReturns = 0;
    this.detectedIncidents = 0;
    this.mistakesCount = 0;
    this.history = [];

    events.emit("SHIFT_RESET");
    events.emit("SCORE_UPDATED", {
      score: this.currentScore,
      streak: 1,
      added: 0,
      reason: "Reinicio de turno"
    });
  }
}

export const scoreManager = ScoreManager.getInstance();
