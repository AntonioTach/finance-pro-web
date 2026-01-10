import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/dashboard">FinancePro</a>
      </div>
      <div class="navbar-menu">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/transactions" routerLinkActive="active">Transactions</a>
        <a routerLink="/categories" routerLinkActive="active">Categories</a>
        <a routerLink="/budgets" routerLinkActive="active">Budgets</a>
        <a routerLink="/reports" routerLinkActive="active">Reports</a>
        <a routerLink="/profile" routerLinkActive="active">Profile</a>
        <button (click)="handleLogout()" class="logout-btn">Logout</button>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--bg-color);
        border-bottom: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
      }

      .navbar-brand a {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .navbar-menu {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
      }

      .navbar-menu a {
        padding: var(--spacing-sm) var(--spacing-md);
        color: var(--text-color);
        text-decoration: none;
        border-radius: var(--border-radius-sm);
        transition: background-color 0.2s;
      }

      .navbar-menu a:hover,
      .navbar-menu a.active {
        background-color: var(--bg-secondary);
        color: var(--primary-color);
      }

      .logout-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background-color: var(--danger-color);
        color: white;
        border-radius: var(--border-radius-sm);
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .logout-btn:hover {
        opacity: 0.9;
      }
    `,
  ],
})
export class NavbarComponent {
  private authService = inject(AuthService);

  handleLogout(): void {
    this.authService.logout();
  }
}

