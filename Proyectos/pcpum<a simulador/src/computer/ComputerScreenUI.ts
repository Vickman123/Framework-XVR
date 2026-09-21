import * as THREE from 'three';
import { inventory, EquipmentItem } from '../inventory/InventoryManager';
import { loanManager } from '../loan/LoanManager';
import { scoreManager } from '../score/ScoreManager';
import { events } from '../core/EventBus';
import { STUDENT_QUEUE, StudentProfile } from '../npc/NPCManager';

export type ScreenTab = 'INICIO' | 'USUARIO' | 'INVENTARIO' | 'PRESTAMO' | 'DEVOLUCION' | 'INSPECCION' | 'RESULTADOS';

interface UIButton {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  action: () => void;
  bgColor?: string;
  activeBgColor?: string;
  textColor?: string;
}

export class ComputerScreenUI {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public readonly texture: THREE.CanvasTexture;

  public currentTab: ScreenTab = 'INICIO';
  private hoveredButtonId: string | null = null;
  private buttons: UIButton[] = [];

  // Estado operativo simulado en pantalla
  private isUserValidated: boolean = false;
  private isCredentialScanned: boolean = false;
  private selectedLaptopForLoan: string = 'Laptop 02';
  private inspectionDecision: 'NONE' | 'BUEN_ESTADO' | 'INCIDENCIA' = 'NONE';
  private activeStudent: StudentProfile = STUDENT_QUEUE[0];
  private incidentActSigned: boolean = false;
  private loanRejected: boolean = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 640;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;

    // Escuchar actualizaciones externas de inventario para refrescar pantalla
    events.on('INVENTORY_UPDATED', () => {
      this.render();
    });

    // Escuchar cambios de estado del préstamo
    events.on('LOAN_STATE_CHANGED', () => {
      this.render();
    });

    events.on('LOAN_ACTIVE_STARTED', () => {
      this.render();
    });

    // Escuchar lectura de credencial NFC
    events.on('CREDENTIAL_SCANNED', () => {
      this.isCredentialScanned = true;
      if (this.currentTab === 'INICIO' || this.currentTab === 'USUARIO') {
        this.setTab('USUARIO');
      } else {
        this.render();
      }
    });

    // Escuchar actualizaciones de puntuación y racha
    events.on('SCORE_UPDATED', () => {
      this.render();
    });

    // Escuchar cambio de alumno activo en la cola
    events.on('ACTIVE_STUDENT_CHANGED', (data: { student: StudentProfile; index: number; total: number }) => {
      this.activeStudent = data.student;
      this.isCredentialScanned = false;
      this.isUserValidated = false;
      this.inspectionDecision = 'NONE';
      this.incidentActSigned = false;
      this.loanRejected = false;
      this.render();
    });

    // Escuchar cuando todos los alumnos han concluido su atención
    events.on('ALL_STUDENTS_COMPLETED', () => {
      this.setTab('RESULTADOS');
    });

    // Escuchar firma de acta de incidencia
    events.on('INCIDENT_ACT_SIGNED', () => {
      this.incidentActSigned = true;
      this.render();
    });

    // Escuchar rechazo normativo por sanción
    events.on('LOAN_REJECTED_SANCTION', () => {
      this.loanRejected = true;
      this.render();
    });

    // Escuchar reinicio de turno
    events.on('SHIFT_RESET', () => {
      this.activeStudent = STUDENT_QUEUE[0];
      this.isUserValidated = false;
      this.isCredentialScanned = false;
      this.inspectionDecision = 'NONE';
      this.incidentActSigned = false;
      this.loanRejected = false;
      this.setTab('INICIO');
    });

    // Escuchar cuando el alumno devuelve la laptop para inspección
    events.on('LOAN_RETURN_READY_FOR_INSPECTION', () => {
      this.setTab('INSPECCION');
    });

    // Escuchar cuando se concluye el préstamo exitosamente
    events.on('LOAN_COMPLETED_SUCCESSFULLY', () => {
      this.setTab('RESULTADOS');
    });

    this.render();
  }

  public setTab(tab: ScreenTab): void {
    this.currentTab = tab;
    this.render();
    events.emit('SCREEN_TAB_CHANGED', tab);
  }

  public handlePointerMove(u: number, v: number): void {
    // Las coordenadas UV en Three.js van de (0,0) abajo-izquierda a (1,1) arriba-derecha
    // En canvas 2D, (0,0) está arriba-izquierda
    const px = u * this.canvas.width;
    const py = (1 - v) * this.canvas.height;

    let foundId: string | null = null;
    for (const btn of this.buttons) {
      if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
        foundId = btn.id;
        break;
      }
    }

    if (foundId !== this.hoveredButtonId) {
      this.hoveredButtonId = foundId;
      this.render();
    }
  }

  public handlePointerClick(u: number, v: number): boolean {
    const px = u * this.canvas.width;
    const py = (1 - v) * this.canvas.height;

    for (const btn of this.buttons) {
      if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
        btn.action();
        this.render();
        return true;
      }
    }
    return false;
  }

  public render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.buttons = [];

    // 1. Fondo general del sistema
    ctx.fillStyle = '#020C17';
    ctx.fillRect(0, 0, w, h);

    // 2. Barra de Título Superior
    this.renderHeader(w);

    // 3. Pestañas de Navegación (7 Tabs principales)
    this.renderNavBar(w);

    // 4. Contenido según pestaña activa
    switch (this.currentTab) {
      case 'INICIO':
        this.renderViewInicio(w, h);
        break;
      case 'USUARIO':
        this.renderViewUsuario(w, h);
        break;
      case 'INVENTARIO':
        this.renderViewInventario(w, h);
        break;
      case 'PRESTAMO':
        this.renderViewPrestamo(w, h);
        break;
      case 'DEVOLUCION':
        this.renderViewDevolucion(w, h);
        break;
      case 'INSPECCION':
        this.renderViewInspeccion(w, h);
        break;
      case 'RESULTADOS':
        this.renderViewResultados(w, h);
        break;
    }

    // 5. Barra de estado inferior
    this.renderFooter(w, h);

    this.texture.needsUpdate = true;
  }

  private renderHeader(w: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#002B49';
    ctx.fillRect(0, 0, w, 50);

    // Título institucional
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PC PUMA • SISTEMA INTEGRAL DE PRÉSTAMO TECNOLÓGICO', 20, 33);

    // Reloj de turno en vivo
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`⏱ TURNO: ${scoreManager.getFormattedShiftTime()}`, 570, 33);

    // Puntuación y racha activa
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    const streakStr = scoreManager.streak > 1 ? ` • 🔥 x${scoreManager.streak}` : '';
    ctx.fillText(`⭐ ${scoreManager.currentScore.toLocaleString()} PTS${streakStr}`, w - 20, 33);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(w, 50);
    ctx.stroke();
  }

  private renderNavBar(w: number): void {
    const tabs: { id: ScreenTab; label: string }[] = [
      { id: 'INICIO', label: '1. INICIO' },
      { id: 'USUARIO', label: '2. USUARIO' },
      { id: 'INVENTARIO', label: '3. INVENTARIO' },
      { id: 'PRESTAMO', label: '4. PRÉSTAMO' },
      { id: 'DEVOLUCION', label: '5. DEVOLUCIÓN' },
      { id: 'INSPECCION', label: '6. INSPECCIÓN' },
      { id: 'RESULTADOS', label: '7. RESULTADOS' }
    ];

    const tabWidth = (w - 20) / tabs.length;
    const tabHeight = 42;
    const startY = 56;

    tabs.forEach((tab, index) => {
      const x = 10 + (index * tabWidth);
      const isSelected = this.currentTab === tab.id;
      const isHovered = this.hoveredButtonId === `tab_${tab.id}`;

      this.registerButton({
        id: `tab_${tab.id}`,
        x,
        y: startY,
        w: tabWidth - 4,
        h: tabHeight,
        label: tab.label,
        bgColor: isSelected ? '#D59F0F' : isHovered ? '#003D66' : '#001E33',
        activeBgColor: '#EAB308',
        textColor: isSelected ? '#001726' : '#E2E8F0',
        action: () => this.setTab(tab.id)
      });
    });
  }

  private renderViewInicio(w: number, _h: number): void {
    const ctx = this.ctx;
    
    // Panel de bienvenida
    ctx.fillStyle = 'rgba(0, 43, 73, 0.4)';
    ctx.fillRect(30, 115, w - 60, 200);
    ctx.strokeStyle = '#00B4D8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 115, w - 60, 200);

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('MÓDULO DE OPERACIÓN PC PUMA', 55, 160);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '18px sans-serif';
    ctx.fillText('Bienvenido al simulador interactivo de gestión de laptops.', 55, 198);
    ctx.fillText('Atiende a los estudiantes, valida su credencial, asigna equipos y supervisa su devolución.', 55, 226);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('● ESTADO DEL MÓDULO: ABIERTO Y LISTO PARA ATENCIÓN', 55, 275);

    // Accesos rápidos
    const btnW = 280;
    const btnH = 65;
    const btnY = 345;

    this.registerButton({
      id: 'btn_ir_usuario',
      x: 55,
      y: btnY,
      w: btnW,
      h: btnH,
      label: '👤 VALIDAR USUARIO',
      bgColor: '#002B49',
      activeBgColor: '#00406C',
      textColor: '#FFFFFF',
      action: () => this.setTab('USUARIO')
    });

    this.registerButton({
      id: 'btn_ir_inventario',
      x: 370,
      y: btnY,
      w: btnW,
      h: btnH,
      label: '📦 VER CARRO 01',
      bgColor: '#002B49',
      activeBgColor: '#00406C',
      textColor: '#FFFFFF',
      action: () => this.setTab('INVENTARIO')
    });

    this.registerButton({
      id: 'btn_ir_inspeccion',
      x: 685,
      y: btnY,
      w: btnW,
      h: btnH,
      label: '🔍 INSPECCIONAR EQUIPO',
      bgColor: '#002B49',
      activeBgColor: '#00406C',
      textColor: '#FFFFFF',
      action: () => this.setTab('INSPECCION')
    });
  }

  private renderViewUsuario(w: number, _h: number): void {
    const ctx = this.ctx;
    const isSanctioned = this.activeStudent.academicStatus === 'SANCIONADO';

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(40, 115, w - 80, 420);
    ctx.strokeStyle = isSanctioned ? 'rgba(239, 68, 68, 0.6)' : 'rgba(213, 159, 15, 0.4)';
    ctx.strokeRect(40, 115, w - 80, 420);

    ctx.fillStyle = isSanctioned ? '#EF4444' : '#D59F0F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('DATOS DEL ESTUDIANTE SOLICITANTE', 70, 155);

    // Estado de lectura NFC
    if (this.isCredentialScanned) {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`📡 CREDENCIAL LEÍDA POR SENSOR NFC EN MOSTRADOR [ID: ${this.activeStudent.accountNumber}]`, 70, 185);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px sans-serif';
      ctx.fillText('📡 Esperando lectura en el lector NFC del mostrador...', 70, 185);
    }

    const dataRows = [
      { label: 'Nombre:', val: this.activeStudent.name, color: '#FFFFFF' },
      { label: 'Número de cuenta:', val: this.activeStudent.accountNumber, color: '#FFFFFF' },
      { label: 'Tipo de usuario:', val: 'Alumno UNAM', color: '#FFFFFF' },
      { label: 'Facultad / Escuela:', val: this.activeStudent.career, color: '#FFFFFF' },
      {
        label: 'Estatus académico:',
        val: isSanctioned ? '✖ RESTRINGIDO / SANCIONADO' : 'ACTIVO REGULAR',
        color: isSanctioned ? '#EF4444' : '#10B981'
      },
      { label: 'Préstamos activos:', val: '0 equipos', color: '#FFFFFF' },
      {
        label: 'Sanciones acumuladas:',
        val: isSanctioned ? '1 ACTIVA (Adeudo PC-PUMA-01)' : '0 incidencias',
        color: isSanctioned ? '#EF4444' : '#10B981'
      }
    ];

    dataRows.forEach((row, idx) => {
      const y = 220 + (idx * 32);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText(row.label, 70, y);

      ctx.fillStyle = row.color;
      ctx.font = 'bold 17px monospace';
      ctx.fillText(row.val, 280, y);
    });

    if (isSanctioned) {
      // Panel de sanción activa normativa
      const boxX = 570;
      const boxW = 380;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
      ctx.fillRect(boxX, 160, boxW, 110);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, 160, boxW, 110);

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('⛔ RESTRICCIÓN NORMATIVA VIGENTE', boxX + 16, 190);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px sans-serif';
      ctx.fillText(this.activeStudent.sanctionReason || 'Adeudo de equipo previo', boxX + 16, 218);
      ctx.fillText('Art. 31: Denegación obligatoria de préstamo.', boxX + 16, 240);

      // Botón de rechazo normativo
      this.registerButton({
        id: 'btn_rechazar_prestamo',
        x: boxX,
        y: 290,
        w: boxW,
        h: 65,
        label: this.loanRejected ? '✔ RECHAZO REGISTRADO' : '[ ✖ RECHAZAR PRÉSTAMO POR NORMA ]',
        bgColor: this.loanRejected ? '#475569' : '#DC2626',
        activeBgColor: this.loanRejected ? '#64748B' : '#B91C1C',
        textColor: '#FFFFFF',
        action: () => {
          if (!this.loanRejected) {
            this.loanRejected = true;
            events.emit('LOAN_REJECTED_SANCTION');
            this.render();
          }
        }
      });

      if (this.loanRejected) {
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('✔ Rechazo fundado registrado (+100 PTS)', boxX, 390);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px sans-serif';
        ctx.fillText('➔ Devuelve la credencial a Carlos en el mostrador.', boxX, 420);
      }
    } else {
      // Indicador de validación regular
      ctx.fillStyle = this.isUserValidated ? '#10B981' : '#F59E0B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(
        this.isUserValidated ? '✔ USUARIO VALIDADO CORRECTAMENTE' : '⚠ PENDIENTE DE VALIDACIÓN',
        600,
        230
      );

      // Botón de validación
      this.registerButton({
        id: 'btn_validar_usuario',
        x: 600,
        y: 270,
        w: 320,
        h: 60,
        label: this.isUserValidated ? 'REVOCAR VALIDACIÓN' : '[ VALIDAR USUARIO ]',
        bgColor: this.isUserValidated ? '#475569' : '#10B981',
        activeBgColor: this.isUserValidated ? '#64748B' : '#059669',
        textColor: '#FFFFFF',
        action: () => {
          this.isUserValidated = !this.isUserValidated;
          events.emit('USER_VALIDATION_TOGGLED', this.isUserValidated);
          if (this.isUserValidated) {
            this.setTab('PRESTAMO');
          }
        }
      });

      if (this.isUserValidated) {
        this.registerButton({
          id: 'btn_pasar_prestamo',
          x: 600,
          y: 350,
          w: 320,
          h: 60,
          label: 'SELECCIONAR EQUIPO ➔',
          bgColor: '#D59F0F',
          activeBgColor: '#EAB308',
          textColor: '#001726',
          action: () => this.setTab('PRESTAMO')
        });
      }
    }
  }

  private renderViewInventario(w: number, _h: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('INVENTARIO EN VIVO • CARRO 01 (RESGUARDO TECNOLÓGICO)', 40, 145);

    const items: EquipmentItem[] = inventory.getAllItems();
    const startY = 175;
    const cardHeight = 65;

    items.forEach((item, idx) => {
      const y = startY + (idx * (cardHeight + 10));

      // Tarjeta de cada equipo
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(40, y, w - 80, cardHeight);
      ctx.strokeStyle = item.status === 'MANTENIMIENTO' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(40, y, w - 80, cardHeight);

      // Icono / Slot
      ctx.fillStyle = '#D59F0F';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`BAHÍA 0${item.slotNumber}`, 60, y + 38);

      // Nombre y Etiqueta
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${item.name} (${item.tag})`, 180, y + 38);

      // Batería
      ctx.fillStyle = '#38BDF8';
      ctx.font = '16px monospace';
      ctx.fillText(`⚡ ${item.batteryLevel}%`, 480, y + 38);

      // Estado Badge
      let badgeColor = '#10B981';
      if (item.status === 'MANTENIMIENTO') badgeColor = '#F59E0B';
      if (item.status === 'EN_MANOS') badgeColor = '#38BDF8';
      if (item.status === 'EN_MOSTRADOR') badgeColor = '#A855F7';

      ctx.fillStyle = badgeColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`[ ${item.status} ]`, 620, y + 38);

      // Notas breves
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText(item.notes, 780, y + 38);
    });
  }

  private renderViewPrestamo(w: number, _h: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ASIGNACIÓN Y ENTREGA DE EQUIPO', 40, 145);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(40, 165, w - 80, 140);
    ctx.strokeStyle = '#00B4D8';
    ctx.strokeRect(40, 165, w - 80, 140);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '18px sans-serif';
    ctx.fillText('1. Selecciona una laptop disponible del Carro 01:', 60, 205);

    // Botones de selección de equipo
    const laptops = ['Laptop 01', 'Laptop 02', 'Laptop 04', 'Laptop 05'];
    laptops.forEach((lap, idx) => {
      const isSel = this.selectedLaptopForLoan === lap;
      this.registerButton({
        id: `sel_${lap}`,
        x: 60 + (idx * 215),
        y: 225,
        w: 195,
        h: 55,
        label: `${isSel ? '✔ ' : ''}${lap}`,
        bgColor: isSel ? '#10B981' : '#002B49',
        activeBgColor: isSel ? '#059669' : '#004578',
        textColor: '#FFFFFF',
        action: () => {
          this.selectedLaptopForLoan = lap;
          this.render();
        }
      });
    });

    // Panel de instrucción física o estado activo
    if (loanManager.currentLoan) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(40, 320, w - 80, 200);
      ctx.strokeStyle = '#10B981';
      ctx.strokeRect(40, 320, w - 80, 200);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✔ PRÉSTAMO ACTIVO ASIGNADO SATISFACTORIAMENTE', 65, 355);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`FOLIO: ${loanManager.currentLoan.loanId} • EQUIPO: ${loanManager.currentLoan.laptopTag}`, 65, 395);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Alumno: ${loanManager.currentLoan.studentName} (${loanManager.currentLoan.career})`, 65, 430);
      ctx.fillText(`Hora de inicio: ${loanManager.currentLoan.startTime.toLocaleTimeString()} • Estado: Sesión activa en sala de estudio`, 65, 458);

      this.registerButton({
        id: 'btn_pedir_devolucion_prestamo',
        x: 65,
        y: 470,
        w: 360,
        h: 42,
        label: '🔔 SOLICITAR DEVOLUCIÓN DE EQUIPO',
        bgColor: '#002B49',
        activeBgColor: '#00406C',
        textColor: '#D59F0F',
        action: () => {
          loanManager.requestReturn();
          this.setTab('DEVOLUCION');
        }
      });
    } else {
      ctx.fillStyle = 'rgba(0, 43, 73, 0.6)';
      ctx.fillRect(40, 320, w - 80, 200);
      ctx.strokeStyle = '#D59F0F';
      ctx.strokeRect(40, 320, w - 80, 200);

      ctx.fillStyle = '#D59F0F';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('INSTRUCCIÓN OPERATIVA AL OPERADOR:', 65, 355);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '21px monospace';
      ctx.fillText(`➔ TOMA ${this.selectedLaptopForLoan.toUpperCase()} DEL CARRO 01 Y COLÓCALA EN EL MOSTRADOR`, 65, 395);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText('1. Camina físicamente hacia el Carro 01 situado a tu izquierda (puedes usar [F] o [E]).', 65, 430);
      ctx.fillText('2. Al soltar la laptop en el mostrador, Juan la tomará en sus manos automáticamente.', 65, 458);
      ctx.fillText('3. Juan se sentará en la mesa de estudio y el folio de préstamo quedará registrado.', 65, 486);
    }
  }

  private renderViewDevolucion(w: number, _h: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('RECEPCIÓN Y DEVOLUCIÓN DE EQUIPO', 40, 145);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(40, 165, w - 80, 340);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(40, 165, w - 80, 340);

    const loan = loanManager.currentLoan;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('EQUIPO EN PRÉSTAMO / ESPERADO PARA DEVOLUCIÓN:', 70, 205);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(loan ? `${loan.laptopTag} (${loan.laptopId.toUpperCase()})` : 'Laptop 02 • PC-PUMA-02', 70, 245);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '17px sans-serif';
    ctx.fillText(`Usuario solicitante: ${loan ? loan.studentName : 'Juan Pérez López'} (${loan ? loan.accountNumber : '32145678'})`, 70, 285);
    ctx.fillText(`Facultad / Escuela: ${loan ? loan.career : 'Facultad de Ingeniería'}`, 70, 315);
    ctx.fillText(`Folio de Préstamo: ${loan ? loan.loanId : 'PUMA-2026-0842'}`, 70, 345);

    // Estatus de la devolución
    let statusText = '● Estudiante realizando sesión de trabajo en sala de estudio';
    let statusColor = '#38BDF8';

    if (loanManager.currentState === 'RETURN_IN_PROGRESS') {
      statusText = '⏳ Estudiante en camino al mostrador para entregar equipo...';
      statusColor = '#F59E0B';
    } else if (loanManager.currentState === 'RETURN_PENDING_INSPECTION') {
      statusText = '✔ EQUIPO DEPOSITADO EN MOSTRADOR • PENDIENTE DE INSPECCIÓN TÉCNICA';
      statusColor = '#10B981';
    } else if (loanManager.currentState === 'INSPECTED_CONFORME') {
      statusText = '✔ INSPECCIÓN CONFORME • DEVUELVE EL EQUIPO A LA BAHÍA DEL CARRO 01';
      statusColor = '#10B981';
    } else if (loanManager.currentState === 'LOAN_COMPLETED') {
      statusText = '✔ PRÉSTAMO Y DEVOLUCIÓN COMPLETADOS CON ÉXITO';
      statusColor = '#10B981';
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(statusText, 70, 385);

    // Botones de acción
    if (loanManager.currentState === 'LOAN_ACTIVE') {
      this.registerButton({
        id: 'btn_pedir_devolucion',
        x: 70,
        y: 420,
        w: 360,
        h: 60,
        label: '🔔 SOLICITAR DEVOLUCIÓN',
        bgColor: '#002B49',
        activeBgColor: '#00406C',
        textColor: '#D59F0F',
        action: () => {
          loanManager.requestReturn();
          this.render();
        }
      });
    }

    this.registerButton({
      id: 'btn_ir_a_inspeccionar',
      x: loanManager.currentState === 'LOAN_ACTIVE' ? 460 : 70,
      y: 420,
      w: 360,
      h: 60,
      label: 'INICIAR INSPECCIÓN FÍSICA ➔',
      bgColor: '#D59F0F',
      activeBgColor: '#EAB308',
      textColor: '#001726',
      action: () => this.setTab('INSPECCION')
    });
  }

  private renderViewInspeccion(_w: number, _h: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('INSPECCIÓN DIAGNÓSTICA DE EQUIPO DE CÓMPUTO', 40, 145);

    const loan = loanManager.currentLoan;

    // Checklist de inspección
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(40, 165, 480, 340);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(40, 165, 480, 340);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`EQUIPO: ${loan ? loan.laptopTag : 'PC-PUMA-02'} • PROTOCOLO UNAM:`, 65, 205);

    const checklist = [
      '✔ Pantalla: Sin fracturas, rayones ni artefactos',
      '✔ Bisagras y chasis: Estructura firme y alineada',
      '✔ Teclado y Trackpad: Sin teclas sueltas ni derrame',
      '✔ Cargador original: Conector en buen estado',
      '✔ Puertos USB/HDMI: Limpios y funcionales'
    ];

    checklist.forEach((item, i) => {
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '16px monospace';
      ctx.fillText(item, 65, 245 + (i * 32));
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.fillText('Revisa visualmente el equipo depositado en el mostrador.', 65, 430);
    ctx.fillText('Al emitir dictamen, resguarda la laptop en el Carro 01.', 65, 455);

    // Panel de decisión con los dos botones obligatorios
    const rightX = 545;
    ctx.fillStyle = 'rgba(0, 43, 73, 0.5)';
    ctx.fillRect(rightX, 165, 435, 340);
    ctx.strokeStyle = '#D59F0F';
    ctx.strokeRect(rightX, 165, 435, 340);

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('DICTAMEN OPERATIVO FINAL:', rightX + 25, 205);

    // Botón Verde
    const isBuenEstado = this.inspectionDecision === 'BUEN_ESTADO';
    this.registerButton({
      id: 'btn_buen_estado',
      x: rightX + 25,
      y: 235,
      w: 385,
      h: 70,
      label: '✔ EQUIPO EN BUEN ESTADO',
      bgColor: isBuenEstado ? '#059669' : '#10B981',
      activeBgColor: '#047857',
      textColor: '#FFFFFF',
      action: () => {
        this.inspectionDecision = 'BUEN_ESTADO';
        events.emit('INSPECTION_DECISION_MADE', 'BUEN_ESTADO');
        this.render();
      }
    });

    // Botón Rojo
    const isIncidencia = this.inspectionDecision === 'INCIDENCIA';
    this.registerButton({
      id: 'btn_incidencia',
      x: rightX + 25,
      y: 325,
      w: 385,
      h: 70,
      label: '✖ EQUIPO CON INCIDENCIA',
      bgColor: isIncidencia ? '#DC2626' : '#EF4444',
      activeBgColor: '#B91C1C',
      textColor: '#FFFFFF',
      action: () => {
        this.inspectionDecision = 'INCIDENCIA';
        events.emit('INSPECTION_DECISION_MADE', 'INCIDENCIA');
        this.render();
      }
    });

    // Resultado actual
    if (this.inspectionDecision === 'INCIDENCIA') {
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('DICTAMEN: EQUIPO CON DAÑO FÍSICO', rightX + 25, 412);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '12px monospace';
      ctx.fillText(`Falla: ${this.activeStudent.incidentType || 'Fisura en panel LCD'}`, rightX + 25, 430);

      this.registerButton({
        id: 'btn_firmar_acta_incidencia',
        x: rightX + 25,
        y: 442,
        w: 385,
        h: 52,
        label: this.incidentActSigned ? '✔ ACTA UNAM REGISTRADA (+150 PTS)' : '[ 📋 FIRMAR ACTA Y ENVIAR A TALLER ]',
        bgColor: this.incidentActSigned ? '#475569' : '#D97706',
        activeBgColor: this.incidentActSigned ? '#64748B' : '#B45309',
        textColor: '#FFFFFF',
        action: () => {
          if (!this.incidentActSigned) {
            this.incidentActSigned = true;
            events.emit('INCIDENT_ACT_SIGNED');
            inventory.updateStatus('laptop_02', 'MANTENIMIENTO');
            this.render();
          }
        }
      });
    } else if (this.inspectionDecision === 'BUEN_ESTADO') {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Dictamen: RECEPCIÓN CONFORME', rightX + 25, 425);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px monospace';
      ctx.fillText('➔ Lleva la laptop a la Bahía 02 del Carro 01', rightX + 25, 460);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Decisión pendiente de registrar', rightX + 25, 435);
    }
  }

  private renderViewResultados(_w: number, _h: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('EVALUACIÓN INTEGRAL DEL OPERADOR • RESULTADOS OFICIALES UNAM', 30, 132);

    // ================= COLUMNA IZQUIERDA =================
    // 1. Tarjeta de Puntuación Total y Rango
    const leftX = 30;
    const leftW = 460;

    ctx.fillStyle = 'rgba(0, 43, 73, 0.75)';
    ctx.fillRect(leftX, 145, leftW, 175);
    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX, 145, leftW, 175);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PUNTUACIÓN GLOBAL INSTITUCIONAL:', leftX + 20, 172);

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`⭐ ${scoreManager.currentScore.toLocaleString()} PTS`, leftX + 20, 212);

    // Rango oficial
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`🏅 ${scoreManager.getOperatorRank()}`, leftX + 20, 245);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '14px monospace';
    ctx.fillText(`🔥 Racha Máxima: x${scoreManager.maxStreakReached} (Actual: x${scoreManager.streak})`, leftX + 20, 276);
    ctx.fillText(`⏱ Tiempo Total de Turno: ${scoreManager.getFormattedShiftTime()}`, leftX + 20, 302);

    // 2. Tarjeta de Índices de Calidad (Gauges)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(leftX, 335, leftW, 175);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftX, 335, leftW, 175);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ÍNDICES INSTITUCIONALES DE DESEMPEÑO:', leftX + 20, 360);

    const drawGauge = (label: string, pct: number, x: number, y: number, gw: number) => {
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px sans-serif';
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, x + gw, y);
      ctx.textAlign = 'left';

      // Fondo barra
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, y + 6, gw, 9);
      // Relleno barra
      ctx.fillStyle = pct >= 90 ? '#10B981' : pct >= 75 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(x, y + 6, (gw * pct) / 100, 9);
    };

    const gaugeW = leftW - 40;
    drawGauge('Eficiencia Operativa en Módulo:', scoreManager.getEfficiencyPercent(), leftX + 20, 390, gaugeW);
    drawGauge('Seguridad de Datos y Protocolo:', scoreManager.getSecurityPercent(), leftX + 20, 435, gaugeW);
    drawGauge('Control y Precisión de Inventario:', scoreManager.getInventoryPercent(), leftX + 20, 480, gaugeW);

    // Botón de apoyo izquierdo
    this.registerButton({
      id: 'btn_ir_inventario_res',
      x: leftX,
      y: 525,
      w: leftW,
      h: 50,
      label: '📦 REVISAR INVENTARIO CARRO 01',
      bgColor: '#002B49',
      activeBgColor: '#00406C',
      textColor: '#FFFFFF',
      action: () => this.setTab('INVENTARIO')
    });

    // ================= COLUMNA DERECHA =================
    const rightX = 510;
    const rightW = 484;

    // 4 Mini tarjetas KPI (2 x 2)
    const kpis = [
      { label: 'Préstamos Conformes', val: `${scoreManager.completedLoans} eq.` },
      { label: 'Peritajes Conformes', val: `${scoreManager.inspectedReturns} rev.` },
      { label: 'Incidencias Reportadas', val: `${scoreManager.detectedIncidents}` },
      { label: 'Omisiones / Fallas', val: `${scoreManager.mistakesCount}` }
    ];

    const miniW = 234;
    const miniH = 55;
    kpis.forEach((kpi, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const mx = rightX + col * (miniW + 16);
      const my = 145 + row * (miniH + 12);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(mx, my, miniW, miniH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(mx, my, miniW, miniH);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText(kpi.label, mx + 12, my + 22);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(kpi.val, mx + 12, my + 44);
    });

    // Resumen de Casos de Atención del Turno
    ctx.fillStyle = 'rgba(0, 30, 55, 0.85)';
    ctx.fillRect(rightX, 280, rightW, 160);
    ctx.strokeStyle = 'rgba(213, 159, 15, 0.4)';
    ctx.strokeRect(rightX, 280, rightW, 160);

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('CASOS DEL TURNO • ATENCIÓN A USUARIOS UNAM:', rightX + 16, 305);

    const cases = [
      { num: '1.', name: 'Juan Pérez (Ingeniería)', desc: 'Préstamo y devolución conforme', status: '✔ COMPLETADO', color: '#10B981' },
      { num: '2.', name: 'Sofía Ramírez (Ciencias)', desc: 'Fisura en LCD • Acta UNAM levantada', status: '✔ SANCIONADA', color: '#F59E0B' },
      { num: '3.', name: 'Carlos Mendoza (Derecho)', desc: 'Adeudo previo • Rechazo por norma', status: '✔ RESTRINGIDO', color: '#38BDF8' }
    ];

    cases.forEach((c, idx) => {
      const cy = 335 + idx * 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(c.num, rightX + 16, cy);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${c.name}: ${c.desc}`, rightX + 38, cy);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(c.status, rightX + rightW - 16, cy);
      ctx.textAlign = 'left';
    });

    // Botón principal de reinicio para nuevo turno
    this.registerButton({
      id: 'btn_iniciar_nuevo_turno',
      x: rightX,
      y: 455,
      w: rightW,
      h: 55,
      label: '🔄 INICIAR NUEVO TURNO / REINICIAR CICLO',
      bgColor: '#D59F0F',
      activeBgColor: '#EAB308',
      textColor: '#001726',
      action: () => {
        scoreManager.resetShift();
        loanManager.resetLoan();
        this.inspectionDecision = 'NONE';
        this.isUserValidated = false;
        this.isCredentialScanned = false;
        events.emit('SHIFT_RESET');
        this.setTab('INICIO');
      }
    });

    // Botón de volver a inicio
    this.registerButton({
      id: 'btn_volver_inicio_res',
      x: rightX,
      y: 525,
      w: rightW,
      h: 50,
      label: '🏠 MENÚ PRINCIPAL',
      bgColor: '#002B49',
      activeBgColor: '#00406C',
      textColor: '#FFFFFF',
      action: () => this.setTab('INICIO')
    });
  }

  private renderFooter(w: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#001E33';
    ctx.fillRect(0, h - 45, w, 45);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.fillText('Meta Quest 3S / Desktop Mode • WebXR Interactive Screen API', 20, h - 17);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('CONEXIÓN CARRO 01: ONLINE [5/5 SLOTS]', w - 20, h - 17);
    ctx.textAlign = 'left';
  }

  private registerButton(btn: UIButton): void {
    this.buttons.push(btn);

    const isHovered = this.hoveredButtonId === btn.id;
    const ctx = this.ctx;

    ctx.fillStyle = isHovered ? (btn.activeBgColor || '#D59F0F') : (btn.bgColor || '#002B49');
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 8);
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = btn.textColor || '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
