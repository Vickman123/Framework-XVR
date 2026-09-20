import { tutorial } from '../tutorial/TutorialManager';
import { events } from '../core/EventBus';

export class ChecklistUI {
  private container: HTMLElement;
  private banner: HTMLElement;
  private modal: HTMLElement | null = null;
  private isCollapsed: boolean = true;
  private currentStudentInfo: string = 'Juan Pérez López (1/3)';

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'checklist-panel';
    this.container.classList.add('pre-start-hidden');

    this.banner = document.createElement('div');
    this.banner.id = 'tutorial-banner';
    this.banner.classList.add('pre-start-hidden');

    document.body.appendChild(this.container);
    document.body.appendChild(this.banner);

    this.setupEventListeners();
    this.render();
    this.updateBanner();
  }

  private setupEventListeners(): void {
    events.on('SIMULATION_STARTED', () => {
      this.container.classList.remove('pre-start-hidden');
      this.banner.classList.remove('pre-start-hidden');
      this.container.classList.add('panel-fade-in');
      this.banner.classList.add('banner-fade-in');
    });

    events.on('ACTIVE_STUDENT_CHANGED', (data: { student: { name: string }; index: number; total: number }) => {
      this.currentStudentInfo = `${data.student.name} (${data.index}/${data.total})`;
      this.render();
      this.updateBanner();
    });

    events.on('NEXT_STUDENT_APPROACHING', (data: { student: { name: string }; queueIndex: number; totalQueue: number }) => {
      this.currentStudentInfo = `Siguiente: ${data.student.name} (${data.queueIndex}/${data.totalQueue})...`;
      this.render();
      this.updateBanner();
    });

    events.on('ALL_STUDENTS_COMPLETED', () => {
      this.currentStudentInfo = `✔ 3/3 Alumnos Atendidos`;
      this.render();
      this.updateBanner();
    });

    events.on('TUTORIAL_TASK_COMPLETED', () => {
      this.render();
      this.updateBanner();
    });

    events.on('TUTORIAL_FINISHED', () => {
      this.render();
      this.updateBanner();
      this.showCelebrationModal();
    });

    events.on('TUTORIAL_RESET', () => {
      this.render();
      this.updateBanner();
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
    });
  }

  public render(): void {
    const progress = tutorial.getProgressPercentage();
    const tasks = tutorial.tasks;
    const completedCount = tasks.filter((t) => t.completed).length;
    const currentTask = tutorial.getCurrentTask();
    const currentIdx = currentTask ? tasks.findIndex((t) => t.id === currentTask.id) + 1 : tasks.length;

    this.container.innerHTML = `
      <div class="checklist-header ${this.isCollapsed ? 'is-collapsed' : ''}">
        <div class="checklist-title-group">
          <span class="checklist-icon">📋</span>
          <div class="checklist-title-text">
            <div class="checklist-header-top">
              <h3 class="checklist-title">${this.isCollapsed ? (currentTask ? currentTask.title : 'Operación Concluida') : 'Checklist de Operación'}</h3>
              <span class="checklist-step-badge">${currentIdx}/${tasks.length}</span>
            </div>
            <span class="checklist-subtitle">PC PUMA • ${this.currentStudentInfo}</span>
          </div>
        </div>
        <button id="btn-toggle-checklist" class="btn-toggle" title="${this.isCollapsed ? 'Ver tareas completas' : 'Minimizar lista'}">
          <span class="toggle-icon">${this.isCollapsed ? '▼' : '▲'}</span>
          <span class="toggle-text">${this.isCollapsed ? 'Tareas' : 'Minimizar'}</span>
        </button>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${progress}%"></div>
      </div>

      ${!this.isCollapsed ? `
      <div class="progress-label">
        <span>Progreso general: <strong>${progress}%</strong></span>
        <span>(${completedCount} de ${tasks.length} tareas)</span>
      </div>

      <div class="checklist-body">
        ${tasks
          .map((task, idx) => {
            const isCurrent = currentTask?.id === task.id;
            return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
              <div class="task-check">
                ${task.completed ? '✔' : idx + 1}
              </div>
              <div class="task-content">
                <span class="task-name">${task.title}</span>
                <span class="task-desc">${task.description}</span>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
      ` : ''}
    `;

    const toggleBtn = document.getElementById('btn-toggle-checklist');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isCollapsed = !this.isCollapsed;
        this.render();
      });
    }
  }

  private updateBanner(): void {
    const currentTask = tutorial.getCurrentTask();
    if (currentTask) {
      this.banner.innerHTML = `
        <div class="banner-badge">MISIÓN ACTUAL</div>
        <div class="banner-text"><strong>${currentTask.title}:</strong> ${currentTask.hint}</div>
      `;
      this.banner.classList.remove('hidden');
    } else {
      this.banner.classList.add('hidden');
    }
  }

  private showCelebrationModal(): void {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.id = 'celebration-modal';
    this.modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-badge">UNAM • PC PUMA XR</div>
        <h2>¡Ciclo Operativo Concluido con Éxito!</h2>
        <p class="modal-subtitle">Has completado el ciclo integral de préstamo, devolución, peritaje y resguardo</p>

        <div class="modal-achievements">
          <div class="achieve-row"><span>✔ Recepción de Juan y validación de Credencial NFC</span><strong>100%</strong></div>
          <div class="achieve-row"><span>✔ Extracción y entrega de Laptop 02</span><strong>100%</strong></div>
          <div class="achieve-row"><span>✔ Sesión de estudio y recepción de devolución</span><strong>100%</strong></div>
          <div class="achieve-row"><span>✔ Peritaje técnico conforme a norma institucional</span><strong>100%</strong></div>
          <div class="achieve-row"><span>✔ Resguardo final en Carro 01 y cierre de folio</span><strong>100%</strong></div>
        </div>

        <div class="modal-buttons">
          <button id="btn-reset-tutorial" class="btn-modal-secondary">Reiniciar Misión</button>
          <button id="btn-close-modal" class="btn-modal-primary">Continuar en Modo Libre</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
    });

    document.getElementById('btn-reset-tutorial')?.addEventListener('click', () => {
      tutorial.resetTutorial();
    });
  }
}
