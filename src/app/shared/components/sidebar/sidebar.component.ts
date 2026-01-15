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
      <!-- Logo Section -->
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">💰</span>
          @if (!isCollapsed()) {
            <span class="logo-text">FinancePro</span>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [pTooltip]="isCollapsed() ? item.label : ''"
            tooltipPosition="right"
          >
            <i class="nav-icon pi" [ngClass]="item.icon"></i>
            @if (!isCollapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button
          class="nav-item logout-btn"
          (click)="handleLogout()"
          [pTooltip]="isCollapsed() ? 'Cerrar sesión' : ''"
          tooltipPosition="right"
        >
          <i class="nav-icon pi pi-sign-out"></i>
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
      width: 280px;
      background: var(--surface-card);
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      z-index: 1000;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 1.75rem;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-400));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
    }

    .sidebar.collapsed .logo {
      justify-content: center;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      color: var(--text-color-secondary);
      text-decoration: none;
      border-radius: var(--border-radius);
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      font-size: 0.95rem;
    }

    .nav-item:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .nav-item.active {
      background: var(--primary-color);
      color: var(--primary-contrast-color, #fff);
    }

    .nav-item.active .nav-icon {
      color: var(--primary-contrast-color, #fff);
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.875rem;
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 1.5rem;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .logout-btn {
      color: var(--red-500);
    }

    .logout-btn:hover {
      background: var(--red-50);
      color: var(--red-600);
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar:not(.collapsed) {
        transform: translateX(0);
        box-shadow: var(--shadow-lg);
      }
    }
  `],
})
export class SidebarComponent {
  private authService = inject(AuthService);

  isCollapsed = input<boolean>(false);
  toggleCollapse = output<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'Transacciones', icon: 'pi-money-bill', route: '/transactions' },
    { label: 'Tarjetas', icon: 'pi-credit-card', route: '/cards' },
    { label: 'Calendario', icon: 'pi-calendar-plus', route: '/calendar' },
    { label: 'Suscripciones', icon: 'pi-sync', route: '/subscriptions' },
    { label: 'Categorías', icon: 'pi-tags', route: '/categories' },
    { label: 'Presupuestos', icon: 'pi-wallet', route: '/budgets' },
    { label: 'Reportes', icon: 'pi-chart-bar', route: '/reports' },
    { label: 'Perfil', icon: 'pi-user', route: '/profile' },
  ];

  handleLogout(): void {
    this.authService.logout();
  }
}
