import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BudgetService } from '../services/budget.service';
import { BudgetProgress } from '../../../core/models/budget.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-budget-detail',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, TranslatePipe, LoadingSpinnerComponent, BaseChartDirective],
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

        <!-- Doughnut chart -->
        <div class="donut-section">
          <div class="donut-wrap">
            <canvas baseChart
              width="140"
              height="140"
              [data]="doughnutData()"
              [type]="'doughnut'"
              [options]="doughnutOptions">
            </canvas>
            <div class="donut-center">
              <span class="donut-pct"
                [class.text-warning]="progress()!.percentage >= progress()!.budget.alertThreshold && !progress()!.isExceeded"
                [class.text-danger]="progress()!.isExceeded">
                {{ progress()!.percentage | number:'1.0-1' }}%
              </span>
              <span class="donut-status">{{ statusText() }}</span>
            </div>
          </div>
          <div class="donut-legend">
            <div class="legend-item">
              <span class="legend-dot" [style.background]="categoryColor()"></span>
              <span class="legend-label">Gastado</span>
              <span class="legend-val">{{ progress()!.spent | currencyFormat:currency }}</span>
            </div>
            @if (!progress()!.isExceeded) {
              <div class="legend-item">
                <span class="legend-dot legend-dot--muted"></span>
                <span class="legend-label">Disponible</span>
                <span class="legend-val">{{ progress()!.remaining | currencyFormat:currency }}</span>
              </div>
            } @else {
              <div class="legend-item">
                <span class="legend-dot legend-dot--danger"></span>
                <span class="legend-label">Excedido</span>
                <span class="legend-val text-danger">
                  +{{ (progress()!.spent - progress()!.budget.amount) | currencyFormat:currency }}
                </span>
              </div>
            }
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

        <!-- History -->
        @if (history().length > 0) {
          <div class="hist-section">
            <button class="hist-toggle" (click)="showHistory.set(!showHistory())">
              <span>Historial de periodos ({{ history().length }})</span>
              <i class="pi" [ngClass]="showHistory() ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>

            @if (showHistory()) {
              <!-- History bar chart -->
              @if (history().length > 1) {
                <div class="hist-chart-wrap">
                  <canvas baseChart
                    width="560"
                    height="200"
                    [data]="historyChartData()"
                    [type]="'bar'"
                    [options]="historyChartOptions">
                  </canvas>
                </div>
              }

              <!-- History table -->
              <div class="hist-table">
                <div class="hist-row hist-head">
                  <span>Periodo</span>
                  <span>Presupuestado</span>
                  <span>Gastado</span>
                  <span>Cumpl.</span>
                </div>
                @for (snap of history(); track snap.id) {
                  <div class="hist-row" [class.hist-exceeded]="isOver(snap)">
                    <span class="hist-period">{{ snap.periodStart | date:'MMM yyyy' }}</span>
                    <span>{{ snap.budgetedAmount | currencyFormat:currency }}</span>
                    <span [class.text-danger]="isOver(snap)">
                      {{ snap.spentAmount | currencyFormat:currency }}
                    </span>
                    <span class="hist-badge" [class]="complianceRate(snap) >= 100 ? 'badge-danger' : 'badge-ok'">
                      {{ complianceRate(snap) }}%
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        }

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

    /* ── Doughnut ── */
    .donut-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .donut-wrap {
      position: relative;
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }

    .donut-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .donut-pct {
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--text-color);
      line-height: 1;
    }

    .donut-status {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 0.2rem;
    }

    .donut-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-dot--muted   { background: rgba(255,255,255,0.12); border: 1px solid var(--border-color); }
    .legend-dot--danger  { background: #ef4444; }

    .legend-label { font-size: 0.8rem; color: var(--text-secondary); flex: 1; }
    .legend-val   { font-size: 0.82rem; font-weight: 700; color: var(--text-color); }

    /* ── Projection card ── */
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

    /* ── History ── */
    .hist-section { display: flex; flex-direction: column; gap: 0; }
    .hist-toggle {
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; background: none; border: none; cursor: pointer;
      padding: 0.75rem 0; font-size: 0.82rem; font-weight: 700;
      color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }
    .hist-toggle i { font-size: 0.75rem; }

    .hist-chart-wrap {
      padding: 1rem 0 0.5rem;
      overflow-x: auto;
    }

    .hist-chart-wrap canvas {
      max-width: 100%;
    }

    .hist-table { display: flex; flex-direction: column; }
    .hist-row {
      display: grid; grid-template-columns: 1fr 1fr 1fr auto;
      gap: 0.5rem; padding: 0.6rem 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8rem; align-items: center;
    }
    .hist-row:last-child { border-bottom: none; }
    .hist-head { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .hist-period { font-weight: 600; color: var(--text-color); }
    .hist-exceeded { background: rgba(239,68,68,0.04); }
    .hist-badge { padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-align: center; }
    .badge-ok     { background: rgba(34,197,94,0.12); color: var(--success-color, #22c55e); }
    .badge-danger { background: rgba(239,68,68,0.12); color: var(--danger-color, #ef4444); }

    /* ── Transactions ── */
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
      .donut-section { flex-direction: column; align-items: center; }
    }
  `],
})
export class BudgetDetailComponent implements OnInit {
  private config        = inject(DynamicDialogConfig);
  private budgetService = inject(BudgetService);

  isLoading    = signal(false);
  txLoading    = signal(false);
  histLoading  = signal(false);
  progress     = signal<BudgetProgress | null>(null);
  transactions = signal<any[]>([]);
  history      = signal<any[]>([]);
  showHistory  = signal(false);
  currency     = 'MXN';

  // ── Chart options ────────────────────────────────────────────

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${Number(ctx.raw || 0).toLocaleString('es-MX', { style: 'currency', currency: this.currency })}`,
        },
      },
    },
  };

  historyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: false,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw || 0).toLocaleString('es-MX', { style: 'currency', currency: this.currency })}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          font: { size: 10 },
          callback: (v) => Number(v).toLocaleString('es-MX', { style: 'currency', currency: this.currency, maximumFractionDigits: 0 }),
        },
      },
    },
  };

  // ── Computed chart data ──────────────────────────────────────

  categoryColor = computed(() => this.progress()?.budget.category?.color || '#6366f1');

  doughnutData = computed((): ChartData<'doughnut'> => {
    const p = this.progress();
    if (!p) return { labels: [], datasets: [{ data: [] }] };

    const color = this.categoryColor();
    const warnColor = '#f59e0b';
    const dangerColor = '#ef4444';

    const spentColor = p.isExceeded
      ? dangerColor
      : p.percentage >= p.budget.alertThreshold
        ? warnColor
        : color;

    if (p.isExceeded) {
      return {
        labels: ['Presupuestado', 'Excedido'],
        datasets: [{
          data: [p.budget.amount, p.spent - p.budget.amount],
          backgroundColor: [color, dangerColor],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      };
    }

    return {
      labels: ['Gastado', 'Disponible'],
      datasets: [{
        data: [p.spent, Math.max(0, p.remaining)],
        backgroundColor: [spentColor, 'rgba(255,255,255,0.08)'],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  });

  historyChartData = computed((): ChartData<'bar'> => {
    const h = this.history().slice(-8); // últimos 8 periodos
    if (!h.length) return { labels: [], datasets: [] };

    const labels = h.map(s =>
      new Date(s.periodStart).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Presupuestado',
          data: h.map(s => Number(s.budgetedAmount)),
          backgroundColor: 'rgba(99,102,241,0.65)',
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'Gastado',
          data: h.map(s => Number(s.spentAmount)),
          backgroundColor: h.map(s =>
            Number(s.spentAmount) > Number(s.budgetedAmount)
              ? 'rgba(239,68,68,0.7)'
              : 'rgba(34,197,94,0.7)'
          ),
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    };
  });

  // ── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    const initial: BudgetProgress | undefined = this.config.data?.progress;
    this.currency = this.config.data?.currency ?? 'MXN';

    if (initial) {
      this.progress.set(initial);
      this.loadFresh(initial.budget.id);
      this.loadTransactions(initial.budget.id);
      this.loadHistory(initial.budget.id);
    }
  }

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

  loadHistory(id: string): void {
    this.histLoading.set(true);
    this.budgetService.getHistory(id).subscribe({
      next: (h) => { this.history.set(h); this.histLoading.set(false); },
      error: () => this.histLoading.set(false),
    });
  }

  complianceRate(snap: any): number {
    const budgeted = Number(snap.budgetedAmount);
    const spent    = Number(snap.spentAmount);
    if (!budgeted) return 100;
    return Math.min(100, Math.round((spent / budgeted) * 100));
  }

  isOver(snap: any): boolean {
    return Number(snap.spentAmount) > Number(snap.budgetedAmount);
  }

  statusText(): string {
    const p = this.progress();
    if (!p) return '';
    if (p.isExceeded) return 'Excedido';
    if (p.percentage >= p.budget.alertThreshold) return 'En riesgo';
    return 'Al día';
  }
}
