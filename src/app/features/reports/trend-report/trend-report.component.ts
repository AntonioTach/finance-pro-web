import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ReportService } from '../services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TrendReport, ReportPeriod } from '../../../core/models/report.model';

interface PeriodOption {
  label: string;
  value: ReportPeriod;
}

interface MonthOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-trend-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    SelectModule,
    ButtonModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './trend-report.component.html',
  styleUrls: ['./trend-report.component.scss'],
})
export class TrendReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  report = signal<TrendReport | null>(null);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  selectedPeriod: ReportPeriod = ReportPeriod.MONTHLY;
  selectedMonths = 6;

  periodOptions: PeriodOption[] = [
    { label: 'Daily', value: ReportPeriod.DAILY },
    { label: 'Weekly', value: ReportPeriod.WEEKLY },
    { label: 'Monthly', value: ReportPeriod.MONTHLY },
  ];

  monthOptions: MonthOption[] = [
    { label: 'Last 3 months', value: 3 },
    { label: 'Last 6 months', value: 6 },
    { label: 'Last 12 months', value: 12 },
  ];

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => '$' + Number(value).toLocaleString(),
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            if (isNaN(value)) return ' Balance: $0';
            return ` Balance: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => '$' + Number(value).toLocaleString(),
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  incomeExpenseChartData = computed((): ChartData<'line'> => {
    const points = this.report()?.dataPoints || [];
    return {
      labels: points.map((p) => p.label),
      datasets: [
        {
          label: 'Income',
          data: points.map((p) => Number(p.income || 0)),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Expenses',
          data: points.map((p) => Number(p.expenses || 0)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  });

  balanceChartData = computed((): ChartData<'bar'> => {
    const points = this.report()?.dataPoints || [];
    return {
      labels: points.map((p) => p.label),
      datasets: [
        {
          data: points.map((p) => Number(p.balance || 0)),
          backgroundColor: points.map((p) =>
            Number(p.balance || 0) >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
          ),
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.reportService.generateTrendReport(this.selectedPeriod, this.selectedMonths).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading trend report:', error);
        this.isLoading.set(false);
      },
    });
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case ReportPeriod.DAILY:
        return 'day';
      case ReportPeriod.WEEKLY:
        return 'week';
      case ReportPeriod.MONTHLY:
      default:
        return 'month';
    }
  }

  getProjectedBalance(): number {
    return Number(this.report()?.projectedBalance || 0);
  }

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency(),
      }).format(0);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
    }).format(value);
  }
}
