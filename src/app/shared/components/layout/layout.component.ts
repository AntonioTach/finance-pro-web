import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TranslatePipe],
  template: `
    <div class="layout" [class.sidebar-collapsed]="isSidebarCollapsed()">
      <app-sidebar
        [isCollapsed]="isSidebarCollapsed()"
        (toggleCollapse)="toggleSidebar()"
      />

      <!-- Mobile overlay -->
      @if (!isSidebarCollapsed()) {
        <div class="mobile-overlay" (click)="toggleSidebar()"></div>
      }

      <main class="main-content">
        <header class="top-header">
          <button class="menu-toggle" (click)="toggleSidebar()" aria-label="Toggle sidebar">
            <i class="pi pi-bars"></i>
          </button>

          <div class="header-right">
            <div class="header-sep"></div>
            <div class="user-chip">
              <div class="user-avatar">
                {{ getInitials() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ currentUser()?.name }}</span>
                <span class="user-role">{{ 'common.personal' | translate }}</span>
              </div>
            </div>
          </div>
        </header>

        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-color);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 260px;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 0;
    }

    .layout.sidebar-collapsed .main-content {
      margin-left: 72px;
    }

    /* Header */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5rem;
      height: 60px;
      background: rgba(8, 12, 20, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      position: sticky;
      top: 0;
      z-index: 100;
      flex-shrink: 0;
    }

    .menu-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 200ms ease;
      font-family: inherit;
    }

    .menu-toggle:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--border-color);
      color: var(--text-color);
    }

    .menu-toggle i { font-size: 1rem; }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-sep {
      width: 1px;
      height: 24px;
      background: var(--border-color);
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.375rem 0.75rem 0.375rem 0.375rem;
      border-radius: 999px;
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.03);
      cursor: pointer;
      transition: all 200ms ease;
    }

    .user-chip:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      letter-spacing: 0.05em;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-color);
      line-height: 1;
    }

    .user-role {
      font-size: 0.65rem;
      color: var(--text-muted);
      line-height: 1;
    }

    /* Page content */
    .page-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Mobile overlay */
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 999;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0 !important;
      }

      .mobile-overlay {
        display: block;
      }
    }
  `],
})
export class LayoutComponent {
  private authService = inject(AuthService);

  isSidebarCollapsed = signal(false);
  currentUser = this.authService.currentUser;

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }

  getInitials(): string {
    const name = this.currentUser()?.name ?? '';
    return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
  }
}
