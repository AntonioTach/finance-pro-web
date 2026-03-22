import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BudgetService } from '../../budgets/services/budget.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { BudgetDashboard, BudgetProgress } from '../../../core/models/budget.model';

interface BudgetOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-budget-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './budget-report.component.html',
  styleUrls: ['./budget-report.component.scss'],
})
export class BudgetReportComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService   = inject(AuthService);

  isLoading      = signal(false);
  histLoading    = signal(false);
  dashboard      = signal<BudgetDashboard | null>(null);
  selectedHistory = signal<any[]>([]);
  selectedBudgetId: string | null = null;
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  // ── Derived KPIs ─────────────────────────────────────────────
  exceededCount = computed(() =>
    (this.dashboard()?.budgets ?? []).filter(b => b.isExceeded).length
  );

  projectedSavings = computed(() => {
    const budgets = this.dashboard()?.budgets ?? [];
    return budgets.reduce((sum, b) => sum + (b.budget.amount - b.projected), 0);
  });

  budgetOptions = computed((): BudgetOption[] =>
    (this.dashboard()?.budgets ?? []).map(b => ({
      label: b.budget.name || b.budget.category?.name || b.budget.id,
      value: b.budget.id,
    }))
  );

  // ── Chart options ─────────────────────────────────────────────

  complianceChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${Number(ctx.raw || 0).toFixed(1)}% utilizado`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 110,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          callback: (v) => `${v}%`,
          font: { size: 11 },
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 12 } },
      },
    },
  };

  distributionChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${this.fmt(Number(ctx.raw || 0))}`,
        },
      },
    },
  };

  historyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { usePointStyle: true, padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${this.fmt(Number(ctx.raw || 0))}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          callback: (v) => this.fmtCompact(Number(v)),
          font: { size: 11 },
        },
      },
    },
  };

  // ── Computed chart data ───────────────────────────────────────

  complianceChartData = computed((): ChartData<'bar'> => {
    const budgets = this.dashboard()?.budgets ?? [];
    const sorted  = [...budgets].sort((a, b) => b.percentage - a.percentage);
    return {
      labels: sorted.map(b => b.budget.name || b.budget.category?.name || ''),
      datasets: [{
        label: '% Utilizado',
        data: sorted.map(b => Math.min(b.percentage, 110)),
        backgroundColor: sorted.map(b =>
          b.isExceeded
            ? 'rgba(239,68,68,0.75)'
            : b.percentage >= b.budget.alertThreshold
              ? 'rgba(245,158,11,0.75)'
              : 'rgba(34,197,94,0.7)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }],
    };
  });

  distributionChartData = computed((): ChartData<'doughnut'> => {
    const budgets = (this.dashboard()?.budgets ?? []).filter(b => b.spent > 0);
    return {
      labels: budgets.map(b => b.budget.name || b.budget.category?.name || ''),
      datasets: [{
        data: budgets.map(b => b.spent),
        backgroundColor: budgets.map(b => b.budget.category?.color || '#6366f1'),
        borderWidth: 0,
        hoverOffset: 5,
      }],
    };
  });

  historyChartData = computed((): ChartData<'bar'> => {
    const h = this.selectedHistory().slice(-12);
    if (!h.length) return { labels: [], datasets: [] };
    const labels = h.map((s: any) =>
      new Date(s.periodStart).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    );
    return {
      labels,
      datasets: [
        {
          label: 'Presupuestado',
          data: h.map((s: any) => Number(s.budgetedAmount)),
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'Gastado',
          data: h.map((s: any) => Number(s.spentAmount)),
          backgroundColor: h.map((s: any) =>
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

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.budgetService.getDashboard().subscribe({
      next: (d) => { this.dashboard.set(d); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onBudgetSelect(id: string | null): void {
    this.selectedBudgetId = id;
    this.selectedHistory.set([]);
    if (!id) return;
    this.histLoading.set(true);
    this.budgetService.getHistory(id).subscribe({
      next: (h) => { this.selectedHistory.set(h); this.histLoading.set(false); },
      error: () => this.histLoading.set(false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  statusClass(b: BudgetProgress): string {
    if (b.isExceeded) return 'status-danger';
    if (b.percentage >= b.budget.alertThreshold) return 'status-warning';
    return 'status-ok';
  }

  statusLabel(b: BudgetProgress): string {
    if (b.isExceeded) return 'Excedido';
    if (b.percentage >= b.budget.alertThreshold) return 'En riesgo';
    return 'Al día';
  }

  periodLabel(period: string): string {
    const map: Record<string, string> = {
      weekly: 'Semanal', biweekly: 'Quincenal',
      monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizado',
    };
    return map[period] ?? period;
  }

  min100(v: number): number { return Math.min(v, 100); }

  isOver(snap: any): boolean {
    return Number(snap.spentAmount) > Number(snap.budgetedAmount);
  }

  complianceRate(snap: any): number {
    const budgeted = Number(snap.budgetedAmount);
    const spent    = Number(snap.spentAmount);
    if (!budgeted) return 0;
    return Math.round((spent / budgeted) * 100);
  }

  diffAbs(snap: any): number {
    return Math.abs(Number(snap.spentAmount) - Number(snap.budgetedAmount));
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: this.currency(), maximumFractionDigits: 0,
    }).format(value || 0);
  }

  fmtCompact(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
}
