import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { Budget } from '../../../core/models/budget.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CurrencyFormatPipe, TranslatePipe],
  template: `
    <div class="budget-page">
      <header class="budget-header">
        <div class="header-left">
          <h1>{{ 'budgets.title' | translate }}</h1>
          <p>{{ 'budgets.subtitle' | translate }}</p>
        </div>
        <span class="wip-badge">
          <span class="wip-dot"></span>
          {{ 'budgets.wip.badge' | translate }}
        </span>
      </header>

      <div class="wip-container">
        <!-- Decorative blurred cards (background) -->
        <div class="wip-cards-preview" aria-hidden="true">
          <div class="ghost-card">
            <div class="ghost-icon"></div>
            <div class="ghost-lines">
              <div class="ghost-line w-60"></div>
              <div class="ghost-line w-40"></div>
            </div>
            <div class="ghost-bar" style="width: 72%"></div>
          </div>
          <div class="ghost-card">
            <div class="ghost-icon"></div>
            <div class="ghost-lines">
              <div class="ghost-line w-50"></div>
              <div class="ghost-line w-35"></div>
            </div>
            <div class="ghost-bar" style="width: 45%"></div>
          </div>
          <div class="ghost-card ghost-card-faded">
            <div class="ghost-icon"></div>
            <div class="ghost-lines">
              <div class="ghost-line w-55"></div>
              <div class="ghost-line w-30"></div>
            </div>
            <div class="ghost-bar" style="width: 88%"></div>
          </div>
        </div>

        <!-- Main WIP content -->
        <div class="wip-content">
          <div class="wip-icon-wrap">
            <i class="pi pi-hammer"></i>
            <span class="wip-icon-ring"></span>
          </div>

          <div class="wip-text">
            <h2>{{ 'budgets.wip.title' | translate }}</h2>
            <p>{{ 'budgets.wip.desc' | translate }}</p>
          </div>

          <div class="wip-features">
            <div class="wip-feature">
              <i class="pi pi-check-circle"></i>
              <span>{{ 'budgets.wip.f1' | translate }}</span>
            </div>
            <div class="wip-feature">
              <i class="pi pi-check-circle"></i>
              <span>{{ 'budgets.wip.f2' | translate }}</span>
            </div>
            <div class="wip-feature">
              <i class="pi pi-check-circle"></i>
              <span>{{ 'budgets.wip.f3' | translate }}</span>
            </div>
            <div class="wip-feature">
              <i class="pi pi-check-circle"></i>
              <span>{{ 'budgets.wip.f4' | translate }}</span>
            </div>
          </div>

          <div class="wip-progress">
            <div class="progress-label">
              <span>{{ 'budgets.wip.progress' | translate }}</span>
              <span class="progress-pct">65%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .budget-page {
      padding: 1.75rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header */
    .budget-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.03em;
    }

    .header-left p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    /* WIP badge */
    .wip-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--warning-color);
      letter-spacing: 0.03em;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .wip-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--warning-color);
      animation: pulse 1.8s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.7); }
    }

    /* Main container */
    .wip-container {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      min-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Ghost cards (blurred background decoration) */
    .wip-cards-preview {
      position: absolute;
      inset: 0;
      display: flex;
      gap: 1.25rem;
      padding: 2.5rem;
      align-items: flex-start;
      filter: blur(3px);
      opacity: 0.25;
      pointer-events: none;
    }

    .ghost-card {
      flex: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ghost-card-faded { opacity: 0.5; }

    .ghost-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--primary-subtle);
    }

    .ghost-lines {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ghost-line {
      height: 10px;
      border-radius: 999px;
      background: var(--border-color);
    }

    .w-60 { width: 60%; }
    .w-50 { width: 50%; }
    .w-55 { width: 55%; }
    .w-40 { width: 40%; }
    .w-35 { width: 35%; }
    .w-30 { width: 30%; }

    .ghost-bar {
      height: 8px;
      border-radius: 999px;
      background: var(--gradient-primary);
      opacity: 0.5;
    }

    /* Overlay gradient */
    .wip-container::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        ellipse at center,
        var(--bg-elevated) 20%,
        transparent 75%
      );
      z-index: 1;
      pointer-events: none;
    }

    /* WIP Content */
    .wip-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 2rem;
      gap: 1.75rem;
      max-width: 480px;
    }

    .wip-icon-wrap {
      position: relative;
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wip-icon-wrap i {
      font-size: 1.75rem;
      color: var(--warning-color);
      position: relative;
      z-index: 1;
    }

    .wip-icon-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.12);
      border: 2px solid rgba(245, 158, 11, 0.2);
      animation: ring-pulse 2.5s ease-in-out infinite;
    }

    @keyframes ring-pulse {
      0%, 100% { transform: scale(1);    opacity: 1; }
      50%       { transform: scale(1.15); opacity: 0.5; }
    }

    .wip-text h2 {
      margin: 0 0 0.75rem 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }

    .wip-text p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.7;
    }

    /* Feature list */
    .wip-features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.625rem;
      width: 100%;
    }

    .wip-feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-align: left;
    }

    .wip-feature i {
      color: var(--success-color);
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    /* Progress bar */
    .wip-progress {
      width: 100%;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .progress-pct {
      color: var(--warning-color);
    }

    .progress-track {
      height: 6px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      width: 65%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--warning-color) 0%, #f97316 100%);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
      animation: fill-in 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes fill-in {
      from { width: 0; }
      to   { width: 65%; }
    }

    @media (max-width: 640px) {
      .budget-page { padding: 1rem; }
      .wip-cards-preview { display: none; }
      .wip-features { grid-template-columns: 1fr; }
    }
  `],
})
export class BudgetListComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  budgets = signal<Budget[]>([]);
  currency = signal(this.authService.currentUser()?.currency || 'USD');

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets(): void {
    this.isLoading.set(true);
    this.budgetService.getAll().subscribe({
      next: (budgets) => {
        this.budgets.set(budgets);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.isLoading.set(false);
      },
    });
  }
}

