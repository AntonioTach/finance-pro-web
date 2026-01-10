import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active">
          <span>📊</span> Dashboard
        </a>
        <a routerLink="/transactions" routerLinkActive="active">
          <span>💳</span> Transactions
        </a>
        <a routerLink="/categories" routerLinkActive="active">
          <span>📁</span> Categories
        </a>
        <a routerLink="/budgets" routerLinkActive="active">
          <span>💰</span> Budgets
        </a>
        <a routerLink="/reports" routerLinkActive="active">
          <span>📈</span> Reports
        </a>
        <a routerLink="/profile" routerLinkActive="active">
          <span>👤</span> Profile
        </a>
      </nav>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 250px;
        background: var(--bg-color);
        border-right: 1px solid var(--border-color);
        min-height: calc(100vh - 60px);
        padding: var(--spacing-lg);
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .sidebar-nav a {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        color: var(--text-color);
        text-decoration: none;
        border-radius: var(--border-radius-sm);
        transition: background-color 0.2s;
      }

      .sidebar-nav a:hover,
      .sidebar-nav a.active {
        background-color: var(--bg-secondary);
        color: var(--primary-color);
      }

      .sidebar-nav a span {
        font-size: 1.2rem;
      }
    `,
  ],
})
export class SidebarComponent {}

