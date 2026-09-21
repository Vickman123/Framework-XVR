import { soundManager } from '../core/AudioSystem.js';
import type { PlayerController } from '../player/PlayerController.js';
import type { WorldManager } from '../world/WorldManager.js';
import { PORTFOLIO_DATA } from '../data/portfolioData.js';

export class ModalManager {
  private modalContainer: HTMLElement | null;
  private modalBadge: HTMLElement | null;
  private modalTitle: HTMLElement | null;
  private modalBody: HTMLElement | null;
  private modalActions: HTMLElement | null;
  private closeBtn: HTMLElement | null;

  public isOpen: boolean = false;
  private playerController: PlayerController | null = null;
  private worldManager: WorldManager | null = null;

  constructor() {
    this.modalContainer = document.getElementById('modal-container');
    this.modalBadge = document.getElementById('modal-badge');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.modalActions = document.getElementById('modal-actions');
    this.closeBtn = document.getElementById('modal-close-btn');

    this.bindEvents();
  }

  public setDependencies(player: PlayerController, world: WorldManager): void {
    this.playerController = player;
    this.worldManager = world;
  }

  private bindEvents(): void {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modalContainer) {
      this.modalContainer.addEventListener('click', (e) => {
        if (e.target === this.modalContainer) {
          this.close();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Fast travel & Exit buttons in HUD
    const mapBtn = document.getElementById('btn-map');
    if (mapBtn) {
      mapBtn.addEventListener('click', () => this.openFastTravel());
    }

    const exitBtn = document.getElementById('btn-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.openExitDossier());
    }
  }

  public open(type: string, data: any): void {
    if (!this.modalContainer || !this.modalBadge || !this.modalTitle || !this.modalBody || !this.modalActions) return;

    soundManager.playSelect();
    this.isOpen = true;
    this.modalActions.innerHTML = '';
    this.modalBody.innerHTML = '';

    if (this.playerController) {
      this.playerController.unlockPointer();
    }

    switch (type) {
      case 'project':
        this.renderProject(data);
        break;
      case 'metric':
        this.renderMetric(data);
        break;
      case 'timeline':
        this.renderTimeline(data);
        break;
      case 'vxr':
        this.renderVxr(data);
        break;
      case 'skills':
        this.renderSkills(data);
        break;
      case 'education':
        this.renderEducation(data);
        break;
      case 'certifications':
        this.renderCertifications(data);
        break;
      case 'iot':
      case 'archive':
        this.renderGenericArticle(data);
        break;
      case 'exit':
      case 'profile':
        this.renderExitDossier();
        break;
      default:
        this.renderGenericArticle(data);
    }

    this.modalContainer.classList.add('visible');
  }

  public close(): void {
    if (!this.isOpen || !this.modalContainer) return;
    soundManager.playClose();
    this.isOpen = false;
    this.modalContainer.classList.remove('visible');
  }

  public openFastTravel(): void {
    if (!this.worldManager) return;
    this.modalBadge!.textContent = 'WAYPOINT NAVIGATION';
    this.modalTitle!.textContent = 'FACILITY FAST TRAVEL';

    let html = `
      <p>Select any sector to instantly synchronize your position to its control node:</p>
      <div class="room-nav-grid">
    `;

    this.worldManager.roomsInfo.forEach((room) => {
      html += `
        <div class="room-nav-card" data-room-id="${room.id}">
          <div class="room-nav-title">${room.code} // ${room.name}</div>
          <div class="room-nav-desc">Coordinates: [${room.center.x.toFixed(0)}, ${room.center.z.toFixed(0)}]</div>
        </div>
      `;
    });

    html += `</div>`;
    this.modalBody!.innerHTML = html;
    this.modalActions!.innerHTML = `
      <button class="action-link secondary" id="modal-cancel-btn">CANCEL</button>
    `;

    // Bind card clicks
    const cards = this.modalBody!.querySelectorAll('.room-nav-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const roomId = card.getAttribute('data-room-id');
        const targetRoom = this.worldManager?.roomsInfo.find((r) => r.id === roomId);
        if (targetRoom && this.playerController) {
          this.playerController.teleportTo(targetRoom.center);
          this.close();
        }
      });
    });

    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close());
    }

    this.modalContainer!.classList.add('visible');
    this.isOpen = true;
  }

  public openExitDossier(): void {
    this.open('exit', PORTFOLIO_DATA.profile);
  }

  private renderProject(p: any): void {
    this.modalBadge!.textContent = p.badge || p.category;
    this.modalTitle!.textContent = p.title;

    let html = `
      <p>${p.longDescription || p.description}</p>
      <div class="tech-tags">
        ${p.technologies.map((t: string) => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
      <h4 style="margin: 16px 0 8px; font-size: 13px; font-family: var(--font-mono); color: var(--accent-cyan);">KEY ARCHITECTURAL HIGHLIGHTS</h4>
      <ul style="padding-left: 20px; line-height: 1.8; color: #cbd5e1;">
        ${p.highlights.map((h: string) => `<li>${h}</li>`).join('')}
      </ul>
    `;
    this.modalBody!.innerHTML = html;

    let actions = '';
    if (p.demoUrl) {
      actions += `<a href="${p.demoUrl}" target="_blank" rel="noopener noreferrer" class="action-link primary">LAUNCH LIVE DEMO ↗</a>`;
    }
    if (p.githubUrl) {
      actions += `<a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="action-link secondary">VIEW ON GITHUB ↗</a>`;
    }
    this.modalActions!.innerHTML = actions;
  }

  private renderMetric(m: any): void {
    this.modalBadge!.textContent = `UNAM INFRASTRUCTURE // ${m.category}`;
    this.modalTitle!.textContent = m.label;

    this.modalBody!.innerHTML = `
      <div class="metric-box" style="margin-bottom: 20px;">
        <div class="metric-val" style="font-size: 38px;">${m.value}</div>
        <div class="metric-lbl">${m.label}</div>
      </div>
      <p style="font-size: 15px;">${m.description}</p>
      <p>Under Victor's service operations leadership at PC PUMA / UNAM, these enterprise metrics represent daily high-availability service delivery, ITIL protocol enforcement, and automated incident resolution for one of the most prestigious university networks globally.</p>
    `;

    this.modalActions!.innerHTML = `
      <a href="https://www.linkedin.com/in/victorcarg/" target="_blank" rel="noopener noreferrer" class="action-link primary">VIEW LINKEDIN ENDORSEMENTS ↗</a>
    `;
  }

  private renderTimeline(t: any): void {
    this.modalBadge!.textContent = `CAREER MILESTONE // ${t.year}`;
    this.modalTitle!.textContent = `${t.organization} — ${t.role}`;

    this.modalBody!.innerHTML = `
      <p style="font-size: 15px; margin-bottom: 16px;">${t.description}</p>
      <h4 style="margin: 16px 0 8px; font-size: 13px; font-family: var(--font-mono); color: var(--accent-cyan);">RESPONSIBILITIES & OUTCOMES</h4>
      <ul style="padding-left: 20px; line-height: 1.8; color: #cbd5e1;">
        ${t.highlights.map((h: string) => `<li>${h}</li>`).join('')}
      </ul>
    `;

    this.modalActions!.innerHTML = `
      <a href="https://www.linkedin.com/in/victorcarg/" target="_blank" rel="noopener noreferrer" class="action-link secondary">EXPAND ON LINKEDIN ↗</a>
    `;
  }

  private renderVxr(vxr: any): void {
    this.modalBadge!.textContent = 'CORE TECHNOLOGY CENTERPIECE';
    this.modalTitle!.textContent = `${vxr.title} — ${vxr.version}`;

    let html = `
      <p style="font-size: 15px;">${vxr.description}</p>
      <div class="tech-tags">
        ${vxr.technologies.map((t: string) => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
      <h4 style="margin: 18px 0 10px; font-size: 13px; font-family: var(--font-mono); color: var(--accent-emerald);">MODULAR ARCHITECTURAL PIPELINE</h4>
      <div style="background: rgba(18, 22, 32, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px; font-family: var(--font-mono); font-size: 12px; line-height: 1.7;">
        ${vxr.architecture.map((a: any) => `<div><span style="color: var(--accent-cyan); font-weight: bold;">[${a.step}]</span>: ${a.desc}</div>`).join('')}
      </div>
    `;
    this.modalBody!.innerHTML = html;

    this.modalActions!.innerHTML = `
      <a href="${vxr.demoUrl}" target="_blank" rel="noopener noreferrer" class="action-link primary">RUN VXR PLAYGROUND ↗</a>
      <a href="${vxr.githubUrl}" target="_blank" rel="noopener noreferrer" class="action-link secondary">VIEW VXR REPOSITORY ↗</a>
    `;
  }

  private renderSkills(s: any): void {
    this.modalBadge!.textContent = 'CAPABILITY MATRIX';
    this.modalTitle!.textContent = 'Technical Engineering Stack';

    this.modalBody!.innerHTML = `
      <p>A comprehensive overview of programming languages, spatial runtimes, frontend and backend technologies utilized in production:</p>
      <div style="margin-top: 16px;">
        <h5 style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 12px; margin-bottom: 6px;">CORE / SPATIAL COMPUTING</h5>
        <div class="tech-tags">${s.core.map((t: string) => `<span class="tech-tag">${t}</span>`).join('')}</div>
        
        <h5 style="color: var(--accent-emerald); font-family: var(--font-mono); font-size: 12px; margin-bottom: 6px;">FRONTEND & WEBGL</h5>
        <div class="tech-tags">${s.frontend.map((t: string) => `<span class="tech-tag">${t}</span>`).join('')}</div>

        <h5 style="color: var(--accent-amber); font-family: var(--font-mono); font-size: 12px; margin-bottom: 6px;">BACKEND & CLOUD INFRASTRUCTURE</h5>
        <div class="tech-tags">${s.backendCloud.map((t: string) => `<span class="tech-tag">${t}</span>`).join('')}</div>

        <h5 style="color: #cbd5e1; font-family: var(--font-mono); font-size: 12px; margin-bottom: 6px;">DOMAINS OF EXCELLENCE</h5>
        <div class="tech-tags">${s.specialties.map((t: string) => `<span class="tech-tag">${t}</span>`).join('')}</div>
      </div>
    `;

    this.modalActions!.innerHTML = `
      <a href="https://github.com/Vickman123" target="_blank" rel="noopener noreferrer" class="action-link primary">EXPLORE GITHUB PROJECTS ↗</a>
    `;
  }

  private renderEducation(e: any): void {
    this.modalBadge!.textContent = 'ACADEMIC CREDENTIAL';
    this.modalTitle!.textContent = e.degree;

    this.modalBody!.innerHTML = `
      <div style="margin-bottom: 14px; font-family: var(--font-mono); color: var(--accent-cyan); font-size: 13px;">
        ${e.institution} · ${e.period}
      </div>
      <p>${e.description}</p>
      <h4 style="margin: 16px 0 8px; font-size: 13px; font-family: var(--font-mono); color: var(--accent-cyan);">SPECIALIZED TRAINING & EMBEDDED SYSTEMS</h4>
      <ul style="padding-left: 20px; line-height: 1.8; color: #cbd5e1;">
        ${e.additionalTraining.map((t: string) => `<li>${t}</li>`).join('')}
      </ul>
    `;

    this.modalActions!.innerHTML = `
      <button class="action-link secondary" id="modal-ok-btn">DONE</button>
    `;
    document.getElementById('modal-ok-btn')?.addEventListener('click', () => this.close());
  }

  private renderCertifications(certs: any[]): void {
    this.modalBadge!.textContent = 'VALIDATED CREDENTIALS';
    this.modalTitle!.textContent = 'Industry Certifications';

    let html = `<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">`;
    certs.forEach((c) => {
      html += `
        <div style="background: rgba(22, 27, 38, 0.7); border: 1px solid rgba(255,255,255,0.06); padding: 14px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #fff; font-size: 14px;">${c.name}</strong>
            <span style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-amber);">${c.year}</span>
          </div>
          <div style="color: var(--accent-cyan); font-size: 12px; font-family: var(--font-mono); margin-bottom: 4px;">${c.issuer}</div>
          <div style="color: var(--text-secondary); font-size: 12px;">${c.focus}</div>
        </div>
      `;
    });
    html += `</div>`;
    this.modalBody!.innerHTML = html;

    this.modalActions!.innerHTML = `
      <a href="https://www.linkedin.com/in/victorcarg/" target="_blank" rel="noopener noreferrer" class="action-link primary">VERIFY ON LINKEDIN ↗</a>
    `;
  }

  private renderGenericArticle(data: any): void {
    this.modalBadge!.textContent = data.badge || data.category || 'LAB ARTICLE';
    this.modalTitle!.textContent = data.title;
    this.modalBody!.innerHTML = `
      <p style="font-size: 15px;">${data.description}</p>
      ${data.highlights ? `<ul style="padding-left: 20px; line-height: 1.8; color: #cbd5e1;">${data.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
    `;
    this.modalActions!.innerHTML = `
      <button class="action-link secondary" id="modal-ok-btn">CLOSE</button>
    `;
    document.getElementById('modal-ok-btn')?.addEventListener('click', () => this.close());
  }

  public renderExitDossier(): void {
    const prof = PORTFOLIO_DATA.profile;
    this.modalBadge!.textContent = 'FACILITY EXIT TERMINAL';
    this.modalTitle!.textContent = prof.name;

    this.modalBody!.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 13px; color: var(--accent-cyan); margin-bottom: 12px;">
        ${prof.title}
      </div>
      <p style="font-size: 14px; margin-bottom: 20px;">${prof.summary}</p>
      
      <div class="modal-metrics-grid">
        <div class="metric-box">
          <div class="metric-val">300K+</div>
          <div class="metric-lbl">Users Impacted</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">4+</div>
          <div class="metric-lbl">XR Projects</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">VXR</div>
          <div class="metric-lbl">Custom Engine</div>
        </div>
      </div>
    `;

    this.modalActions!.innerHTML = `
      <a href="${prof.links.linkedin}" target="_blank" rel="noopener noreferrer" class="action-link primary">LINKEDIN PROFILE ↗</a>
      <a href="${prof.links.github}" target="_blank" rel="noopener noreferrer" class="action-link secondary">GITHUB REPOSITORIES ↗</a>
      <a href="${prof.links.email}" class="action-link secondary">SEND DIRECT EMAIL ↗</a>
      <button class="action-link secondary" id="btn-return-hub">RETURN TO HUB</button>
    `;

    document.getElementById('btn-return-hub')?.addEventListener('click', () => {
      if (this.playerController && this.worldManager) {
        this.playerController.teleportTo(this.worldManager.roomsInfo[0].center);
        this.close();
      }
    });

    this.modalContainer!.classList.add('visible');
    this.isOpen = true;
  }
}
