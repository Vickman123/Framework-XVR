import { events } from '../core/EventBus';

export type LoanWorkflowState =
  | 'WAITING_STUDENT'
  | 'STUDENT_AT_COUNTER'
  | 'CREDENTIAL_SCANNED'
  | 'USER_VALIDATED'
  | 'EQUIPMENT_SELECTED'
  | 'EQUIPMENT_IN_HAND'
  | 'EQUIPMENT_DELIVERED'
  | 'LOAN_ACTIVE'
  | 'RETURN_IN_PROGRESS'
  | 'RETURN_PENDING_INSPECTION'
  | 'INSPECTED_CONFORME'
  | 'INSPECTED_INCIDENCIA'
  | 'LOAN_COMPLETED';

export interface ActiveLoan {
  loanId: string;
  studentName: string;
  accountNumber: string;
  career: string;
  laptopId: string;
  laptopTag: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds: number;
  inspectionVerdict: 'BUEN_ESTADO' | 'INCIDENCIA' | null;
  status: 'ACTIVO' | 'EN_REVISION' | 'FINALIZADO';
}

export interface OperatorMetrics {
  completedLoans: number;
  inspectedReturns: number;
  incidentCount: number;
  mistakesCount: number;
  totalScore: number;
  efficiencyPercent: number;
}

export class LoanManager {
  private static instance: LoanManager;

  public currentState: LoanWorkflowState = 'WAITING_STUDENT';
  public currentLoan: ActiveLoan | null = null;
  public metrics: OperatorMetrics = {
    completedLoans: 0,
    inspectedReturns: 0,
    incidentCount: 0,
    mistakesCount: 0,
    totalScore: 0,
    efficiencyPercent: 100
  };

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): LoanManager {
    if (!LoanManager.instance) {
      LoanManager.instance = new LoanManager();
    }
    return LoanManager.instance;
  }

  private setupListeners(): void {
    // 1. Escaneo NFC de credencial
    events.on('CREDENTIAL_SCANNED', () => {
      if (this.currentState === 'WAITING_STUDENT' || this.currentState === 'STUDENT_AT_COUNTER') {
        this.setState('CREDENTIAL_SCANNED');
      }
    });

    // 2. Validación de usuario en pantalla
    events.on('USER_VALIDATION_TOGGLED', (isValid: boolean) => {
      if (isValid) {
        this.setState('USER_VALIDATED');
      }
    });

    // 3. Tomar laptop de carro o mostrador
    events.on('OBJECT_GRABBED', (data: { id: string; name: string }) => {
      if (data.id.includes('laptop')) {
        if (this.currentState === 'USER_VALIDATED' || this.currentState === 'EQUIPMENT_SELECTED') {
          this.setState('EQUIPMENT_IN_HAND');
        }
      }
    });

    // 4. Laptop colocada en mostrador para entrega
    events.on('INVENTORY_UPDATED', (data: { item: { id: string; tag: string; status: string } }) => {
      if (data.item.status === 'EN_MOSTRADOR') {
        if (
          this.currentState === 'EQUIPMENT_IN_HAND' ||
          this.currentState === 'USER_VALIDATED' ||
          this.currentState === 'EQUIPMENT_SELECTED'
        ) {
          this.setState('EQUIPMENT_DELIVERED');
        }
      }
    });

    // 4b. Estudiante recibe el equipo en sus manos
    events.on('STUDENT_RECEIVED_LAPTOP', (data: { laptopId: string; studentName?: string; accountNumber?: string; career?: string }) => {
      const tag = data.laptopId === 'laptop_02' ? 'PC-PUMA-02' : (data.laptopId === 'laptop_01' ? 'PC-PUMA-01' : data.laptopId.toUpperCase());
      this.registerActiveLoan(data.laptopId, tag, data.studentName, data.accountNumber, data.career);
    });

    // 5. Estudiante deposita laptop para devolución en el mostrador
    events.on('LAPTOP_RETURNED_TO_COUNTER', () => {
      if (this.currentLoan) {
        this.currentLoan.status = 'EN_REVISION';
      }
      this.setState('RETURN_PENDING_INSPECTION');
    });

    // 6. Dictamen de inspección técnica emitido por el operador
    events.on('INSPECTION_DECISION_MADE', (verdict: 'BUEN_ESTADO' | 'INCIDENCIA') => {
      if (this.currentLoan) {
        this.currentLoan.inspectionVerdict = verdict;
        this.metrics.inspectedReturns++;
        if (verdict === 'INCIDENCIA') {
          this.metrics.incidentCount++;
        }
      }

      if (verdict === 'BUEN_ESTADO') {
        this.setState('INSPECTED_CONFORME');
      } else {
        this.setState('INSPECTED_INCIDENCIA');
      }
    });

    // 6b. Firma de acta de incidencia oficial UNAM
    events.on('INCIDENT_ACT_SIGNED', () => {
      if (this.currentLoan) {
        this.currentLoan.inspectionVerdict = 'INCIDENCIA';
      }
      this.setState('INSPECTED_INCIDENCIA');
    });

    // 7. Laptop resguardada nuevamente en el Carro 01
    events.on('LAPTOP_SNAPPED_TO_CART', (_data: { id: string; slotIndex: number }) => {
      // Laptop resguardada, queda pendiente entregar credencial
    });

    // 8. Devolución de la credencial al estudiante para finalizar el trámite oficial
    events.on('STUDENT_RECEIVED_CREDENTIAL_RETURN', () => {
      if (this.currentLoan) {
        this.finalizeLoan();
      }
    });
  }

  public setState(newState: LoanWorkflowState): void {
    if (this.currentState !== newState) {
      this.currentState = newState;
      events.emit('LOAN_STATE_CHANGED', newState);

      if (newState === 'EQUIPMENT_DELIVERED') {
        this.registerActiveLoan('laptop_02', 'PC-PUMA-02');
      }
    }
  }

  public registerActiveLoan(
    laptopId: string,
    laptopTag: string,
    studentName: string = 'Juan Pérez López',
    accountNumber: string = '32145678',
    career: string = 'Facultad de Ingeniería'
  ): void {
    const loanSuffix = Math.floor(1000 + Math.random() * 9000);
    this.currentLoan = {
      loanId: `PUMA-2026-${loanSuffix}`,
      studentName,
      accountNumber,
      career,
      laptopId,
      laptopTag,
      startTime: new Date(),
      durationSeconds: 0,
      inspectionVerdict: null,
      status: 'ACTIVO'
    };

    this.setState('LOAN_ACTIVE');
    events.emit('LOAN_ACTIVE_STARTED', this.currentLoan);
  }

  public requestReturn(): void {
    if (this.currentState === 'LOAN_ACTIVE') {
      this.setState('RETURN_IN_PROGRESS');
      events.emit('REQUEST_STUDENT_RETURN');
    }
  }

  public finalizeLoan(): void {
    if (!this.currentLoan) return;

    this.currentLoan.endTime = new Date();
    this.currentLoan.durationSeconds = Math.round((this.currentLoan.endTime.getTime() - this.currentLoan.startTime.getTime()) / 1000);
    this.currentLoan.status = 'FINALIZADO';

    this.metrics.completedLoans++;
    this.metrics.totalScore = 1250;
    this.metrics.efficiencyPercent = 100;

    this.setState('LOAN_COMPLETED');
    events.emit('LOAN_COMPLETED_SUCCESSFULLY', {
      loan: this.currentLoan,
      metrics: this.metrics
    });
  }

  public resetLoan(): void {
    this.currentLoan = null;
    this.metrics = {
      completedLoans: 0,
      inspectedReturns: 0,
      incidentCount: 0,
      mistakesCount: 0,
      totalScore: 1000,
      efficiencyPercent: 100
    };
    this.setState('WAITING_STUDENT');
  }
}

export const loanManager = LoanManager.getInstance();
