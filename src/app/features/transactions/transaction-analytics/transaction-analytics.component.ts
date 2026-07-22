import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { StatTileComponent } from '../../../shared/components/stat-tile/stat-tile.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FinancialSummary, CategoryBreakdown, TimeSeriesDataPoint } from '../../../core/models/report.model';
import { TrendGranularity } from '../models/transaction-list-filters.model';
import { CHART_INCOME_COLOR, CHART_EXPENSE_COLOR } from '../../../shared/constants/chart-colors.const';
import { formatTrendLabel } from './trend-granularity.util';

@Component({
  selector: 'app-transaction-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, StatTileComponent, TranslatePipe],
  templateUrl: './transaction-analytics.component.html',
  styleUrls: ['./transaction-analytics.component.scss'],
})
export class TransactionAnalyticsComponent {
  summary = input<FinancialSummary | null>(null);
  categoryBreakdown = input<CategoryBreakdown[]>([]);
  trend = input<Omit<TimeSeriesDataPoint, 'label'>[]>([]);
  granularity = input<TrendGranularity>('month');
  loading = input<boolean>(false);
  currency = input<string>('USD');

  hasData = computed(() => (this.summary()?.transactionCount ?? 0) > 0);

  // Chart.js has no notion of the x-axis label band being "included" in a
  // fixed-height canvas — size the container to the bar count so it never
  // gets a nested vertical scroll (see dataviz anti-patterns).
  categoryChartHeight = computed(() => Math.max(180, this.categoryBreakdown().length * 32));

  trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 15 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw || 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
      x: { grid: { display: false } },
    },
  };

  categoryChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = this.categoryBreakdown()[ctx.dataIndex];
            return ` ${ctx.label}: ${Number(ctx.raw || 0).toLocaleString()} (${(item?.percentage ?? 0).toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
      y: { grid: { display: false } },
    },
  };

  trendChartData = computed<ChartData<'line'>>(() => {
    const points = this.trend();
    const granularity = this.granularity();
    return {
      labels: points.map((p) => formatTrendLabel(p.date, granularity)),
      datasets: [
        {
          label: 'Income',
          data: points.map((p) => Number(p.income || 0)),
          borderColor: CHART_INCOME_COLOR,
          backgroundColor: `${CHART_INCOME_COLOR}1a`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Expenses',
          data: points.map((p) => Number(p.expenses || 0)),
          borderColor: CHART_EXPENSE_COLOR,
          backgroundColor: `${CHART_EXPENSE_COLOR}1a`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  });

  categoryChartData = computed<ChartData<'bar'>>(() => {
    const items = this.categoryBreakdown();
    return {
      labels: items.map((c) => c.categoryName),
      datasets: [
        {
          data: items.map((c) => Number(c.amount || 0)),
          backgroundColor: items.map((c) => c.categoryColor),
          barThickness: 20,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  });
}
