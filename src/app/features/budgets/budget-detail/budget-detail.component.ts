import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { BudgetService } from '../services/budget.service';
import { BudgetProgress } from '../../../core/models/budget.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-budget-detail',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, TranslatePipe, LoadingSpinnerComponent],
  template: `
    <div class="detail-wrap">
      @if (isLoading()) {
        <app-loading-spinner />
      }

      @if (!isLoading() && progress()) {
        <!-- Main metrics -->
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-label">Presupuestado</span>
            <span class="metric-value">{{ progress()!.budget.amount | currencyFormat:currency }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Gastado</span>
            <span class="metric-value" [class.text-danger]="progress()!.isExceeded">
              {{ progress()!.spent | currencyFormat:currency }}
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Disponible</span>
            <span class="metric-value" [class.text-danger]="progress()!.remaining < 0">
              {{ progress()!.remaining | currencyFormat:currency }}
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Días restantes</span>
            <span class="metric-value">{{ progress()!.daysLeft }}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-pct"
              [class.text-warning]="progress()!.percentage >= progress()!.budget.alertThreshold && !progress()!.isExceeded"
              [class.text-danger]="progress()!.isExceeded">
              {{ progress()!.percentage | number:'1.0-1' }}%
            </span>
            <span class="progress-label">{{ statusText() }}</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              [class.fill-warning]="progress()!.percentage >= progress()!.budget.alertThreshold && !progress()!.isExceeded"
              [class.fill-danger]="progress()!.isExceeded"
              [style.width.%]="min100(progress()!.percentage)"
            ></div>
          </div>
        </div>

        <!-- Burn rate / projection -->
        <div class="projection-card">
          <div class="proj-row">
            <span class="proj-label">
              <i class="pi pi-chart-line"></i>
              Gasto diario (burn rate)
            </span>
            <span class="proj-value">{{ progress()!.burnRate | currencyFormat:currency }}/día</span>
          </div>
          <div class="proj-row">
            <span class="proj-label">
              <i class="pi pi-calendar"></i>
              Proyección de cierre
            </span>
            <span class="proj-value"
              [class.text-danger]="progress()!.projected > progress()!.budget.amount">
              {{ progress()!.projected | currencyFormat:currency }}
              @if (progress()!.projected > progress()!.budget.amount) {
                <span class="overshoot">
                  (+{{ (progress()!.projected - progress()!.budget.amount) | currencyFormat:currency }})
                </span>
              }
            </span>
          </div>
          <div class="proj-row">
            <span class="proj-label">
              <i class="pi pi-clock"></i>
              Periodo activo
            </span>
            <span class="proj-value">
              {{ progress()!.budget.periodStart | date:'d MMM' }} —
              {{ progress()!.budget.periodEnd | date:'d MMM yyyy' }}
            </span>
          </div>
        </div>

        <!-- Transactions -->
        <div class="tx-section">
          <h3 class="tx-title">{{ 'budgets.detail.transactions' | translate }}</h3>

          @if (txLoading()) {
            <app-loading-spinner />
          }

          @if (!txLoading() && transactions().length === 0) {
            <p class="tx-empty">{{ 'budgets.detail.noTx' | translate }}</p>
          }

          @if (!txLoading() && transactions().length > 0) {
            <div class="tx-list">
              @for (tx of transactions(); track tx.id) {
                <div class="tx-row">
                  <div class="tx-info">
                    <span class="tx-desc">{{ tx.description }}</span>
                    <span class="tx-date">{{ tx.date | date:'d MMM' }}</span>
                  </div>
                  <span class="tx-amount"
                    [class.text-income]="tx.type === 'income'"
                    [class.text-expense]="tx.type === 'expense'">
                    {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currencyFormat:currency }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-wrap { display: flex; flex-direction: column; gap: 1.5rem; padding: 0.25rem 0; }

    .metrics-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
    }
    .metric {
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 1rem 1.25rem;
      display: flex; flex-direction: column; gap: 0.35rem;
    }
    .metric-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .metric-value { font-size: 1.3rem; font-weight: 800; color: var(--text-color); }

    .progress-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .progress-header { display: flex; justify-content: space-between; align-items: center; }
    .progress-pct { font-size: 1.1rem; font-weight: 800; color: var(--text-color); }
    .progress-label { font-size: 0.8rem; color: var(--text-muted); }
    .progress-track { height: 12px; background: var(--bg-secondary); border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--gradient-primary); border-radius: 999px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
    .fill-warning { background: linear-gradient(90deg, #f59e0b, #f97316) !important; }
    .fill-danger  { background: linear-gradient(90deg, #ef4444, #dc2626) !important; }

    .projection-card {
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 1rem 1.25rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .proj-row { display: flex; justify-content: space-between; align-items: center; }
    .proj-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.83rem; color: var(--text-secondary); }
    .proj-label i { font-size: 0.8rem; color: var(--text-muted); }
    .proj-value { font-size: 0.9rem; font-weight: 700; color: var(--text-color); }
    .overshoot { font-size: 0.78rem; font-weight: 600; margin-left: 0.25rem; }

    .tx-section { display: flex; flex-direction: column; gap: 0.75rem; }
    .tx-title { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .tx-empty { font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem 0; margin: 0; }

    .tx-list { display: flex; flex-direction: column; gap: 0; }
    .tx-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .tx-row:last-child { border-bottom: none; }
    .tx-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .tx-desc { font-size: 0.85rem; color: var(--text-color); font-weight: 500; }
    .tx-date { font-size: 0.72rem; color: var(--text-muted); }
    .tx-amount { font-size: 0.88rem; font-weight: 700; }

    .text-danger  { color: var(--danger-color, #ef4444) !important; }
    .text-warning { color: var(--warning-color, #f59e0b) !important; }
    .text-income  { color: var(--success-color, #22c55e); }
    .text-expense { color: var(--danger-color, #ef4444); }

    @media (max-width: 480px) {
      .metrics-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class BudgetDetailComponent implements OnInit {
  private config        = inject(DynamicDialogConfig);
  private budgetService = inject(BudgetService);

  isLoading  = signal(false);
  txLoading  = signal(false);
  progress   = signal<BudgetProgress | null>(null);
  transactions = signal<any[]>([]);
  currency   = 'MXN';

  ngOnInit(): void {
    const initial: BudgetProgress | undefined = this.config.data?.progress;
    this.currency = this.config.data?.currency ?? 'MXN';

    if (initial) {
      this.progress.set(initial);
      this.loadFresh(initial.budget.id);
      this.loadTransactions(initial.budget.id);
    }
  }

  /** Refresh progress from API to get latest numbers */
  loadFresh(id: string): void {
    this.isLoading.set(true);
    this.budgetService.getProgress(id).subscribe({
      next: (p) => { this.progress.set(p); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  loadTransactions(id: string): void {
    this.txLoading.set(true);
    this.budgetService.getPeriodTransactions(id).subscribe({
      next: (data) => { this.transactions.set(data.transactions ?? []); this.txLoading.set(false); },
      error: () => this.txLoading.set(false),
    });
  }

  min100(v: number): number { return Math.min(v, 100); }

  statusText(): string {
    const p = this.progress();
    if (!p) return '';
    if (p.isExceeded) return 'Excedido';
    if (p.percentage >= p.budget.alertThreshold) return 'En riesgo';
    return 'Al día';
  }
}
