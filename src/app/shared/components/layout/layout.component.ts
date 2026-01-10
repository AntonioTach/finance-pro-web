import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="layout" [class.sidebar-collapsed]="isSidebarCollapsed()">
      <app-sidebar
        [isCollapsed]="isSidebarCollapsed()"
        (toggleCollapse)="toggleSidebar()"
      />
      <main class="main-content">
        <header class="top-header">
          <button class="menu-toggle" (click)="toggleSidebar()">
            <i class="pi" [class.pi-bars]="isSidebarCollapsed()" [class.pi-times]="!isSidebarCollapsed()"></i>
          </button>
          <div class="header-right">
            <span class="user-greeting">
              Hola, {{ currentUser()?.name }}
            </span>
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
      background: var(--surface-ground);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 280px;
      transition: margin-left 0.3s ease;
    }

    .layout.sidebar-collapsed .main-content {
      margin-left: 80px;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .menu-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-color);
      transition: background 0.2s;
    }

    .menu-toggle:hover {
      background: var(--surface-hover);
    }

    .menu-toggle i {
      font-size: 1.25rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-greeting {
      font-weight: 500;
      color: var(--text-color-secondary);
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }

      .layout.sidebar-collapsed .main-content {
        margin-left: 0;
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
}
