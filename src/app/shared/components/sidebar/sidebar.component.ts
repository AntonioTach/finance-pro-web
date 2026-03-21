import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo" [class.logo-centered]="isCollapsed()">
          <div class="logo-mark">
            <i class="pi pi-chart-line"></i>
          </div>
          @if (!isCollapsed()) {
            <span class="logo-text">FinancePro</span>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
              [pTooltip]="isCollapsed() ? item.label : ''"
              tooltipPosition="right"
            >
              <span class="nav-icon-wrap">
                <i class="pi" [ngClass]="item.icon"></i>
              </span>
              @if (!isCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
              @if (!isCollapsed()) {
                <span class="nav-active-indicator"></span>
              }
            </a>
          }
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="sidebar-divider"></div>
        <button
          class="nav-item logout-btn"
          (click)="handleLogout()"
          [pTooltip]="isCollapsed() ? 'Cerrar sesión' : ''"
          tooltipPosition="right"
        >
          <span class="nav-icon-wrap logout-icon">
            <i class="pi pi-sign-out"></i>
          </span>
          @if (!isCollapsed()) {
            <span class="nav-label">Cerrar sesión</span>
          }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 260px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      overflow: hidden;
    }

    .sidebar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: radial-gradient(ellipse at top left, rgba(99,102,241,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .sidebar.collapsed {
      width: 72px;
    }

    /* Header */
    .sidebar-header {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0.25rem;
    }

    .logo.logo-centered {
      justify-content: center;
    }

    .logo-mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }

    .logo-mark i {
      color: #fff;
      font-size: 1rem;
    }

    .logo-text {
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
    }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar-nav::-webkit-scrollbar { width: 3px; }
    .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: 10px;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: inherit;
      white-space: nowrap;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-color);
    }

    .nav-item:hover .nav-icon-wrap {
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary-light);
    }

    .nav-item.active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary-light);
    }

    .nav-item.active .nav-icon-wrap {
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .nav-item.active .nav-active-indicator {
      opacity: 1;
    }

    .nav-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: transparent;
      color: var(--text-muted);
      transition: all 200ms ease;
    }

    .nav-icon-wrap i {
      font-size: 1rem;
    }

    .logout-icon {
      color: var(--danger-color);
    }

    .nav-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.875rem;
    }

    .nav-active-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary-color);
      opacity: 0;
      margin-left: auto;
      flex-shrink: 0;
      transition: opacity 200ms ease;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.625rem;
    }

    .sidebar.collapsed .nav-item:hover .nav-label,
    .sidebar.collapsed .nav-item .nav-label {
      display: none;
    }

    /* Footer */
    .sidebar-footer {
      padding: 0.75rem;
      flex-shrink: 0;
    }

    .sidebar-divider {
      height: 1px;
      background: var(--border-color);
      margin-bottom: 0.75rem;
    }

    .logout-btn:hover {
      background: rgba(244, 63, 94, 0.1) !important;
      color: var(--danger-color) !important;
    }

    .logout-btn:hover .logout-icon {
      background: rgba(244, 63, 94, 0.15);
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        box-shadow: none;
      }

      .sidebar:not(.collapsed) {
        transform: translateX(0);
        box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
      }
    }
  `],
})
export class SidebarComponent {
  private authService = inject(AuthService);

  isCollapsed = input<boolean>(false);
  toggleCollapse = output<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'pi-home',          route: '/dashboard' },
    { label: 'Transacciones',  icon: 'pi-money-bill',    route: '/transactions' },
    { label: 'Tarjetas',       icon: 'pi-credit-card',   route: '/cards' },
    { label: 'Cash Flow',      icon: 'pi-dollar',        route: '/cash-flow' },
    { label: 'Calendario',     icon: 'pi-calendar-plus', route: '/calendar' },
    { label: 'Suscripciones',  icon: 'pi-sync',          route: '/subscriptions' },
    { label: 'Categorías',     icon: 'pi-tags',          route: '/categories' },
    { label: 'Presupuestos',   icon: 'pi-wallet',        route: '/budgets' },
    { label: 'Reportes',       icon: 'pi-chart-bar',     route: '/reports' },
    { label: 'Perfil',         icon: 'pi-user',          route: '/profile' },
    { label: 'Configuración',  icon: 'pi-palette',       route: '/settings' },
  ];

  handleLogout(): void {
    this.authService.logout();
  }
}
