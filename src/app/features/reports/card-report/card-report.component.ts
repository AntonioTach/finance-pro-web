import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ReportService } from '../services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { CardReport } from '../../../core/models/report.model';
import { CardType } from '../../../core/models/card.model';

@Component({
  selector: 'app-card-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    KnobModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './card-report.component.html',
  styleUrls: ['./card-report.component.scss'],
})
export class CardReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  report = signal<CardReport | null>(null);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  utilizationValue = 0;

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
            if (isNaN(value)) return ' Spent: $0.00';
            return ` Spent: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  spendingChartData = computed((): ChartData<'bar'> => {
    const cards = this.report()?.cardsBySpending || [];
    return {
      labels: cards.map((c) => c.cardName),
      datasets: [
        {
          data: cards.map((c) => Number(c.totalSpent || 0)),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
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
    this.reportService.generateCardReport().subscribe({
      next: (report) => {
        this.report.set(report);
        this.utilizationValue = Math.round(Number(report.overallUtilization || 0));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading card report:', error);
        this.isLoading.set(false);
      },
    });
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

  formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0';
    }
    return value.toFixed(1);
  }

  getOverallUtilization(): number {
    return this.report()?.overallUtilization ?? 0;
  }

  getCardColor(type: CardType): string {
    return type === CardType.CREDIT ? '#3b82f6' : '#22c55e';
  }

  getUtilizationColor(percentage: number): string {
    if (percentage <= 30) return '#22c55e';
    if (percentage <= 50) return '#eab308';
    if (percentage <= 75) return '#f97316';
    return '#ef4444';
  }

  getUtilizationStatus(percentage: number): string {
    if (percentage <= 30) return 'good';
    if (percentage <= 50) return 'moderate';
    if (percentage <= 75) return 'high';
    return 'critical';
  }

  getUtilizationIcon(percentage: number): string {
    if (percentage <= 30) return 'pi-check-circle';
    if (percentage <= 50) return 'pi-info-circle';
    if (percentage <= 75) return 'pi-exclamation-triangle';
    return 'pi-times-circle';
  }

  getUtilizationMessage(percentage: number): string {
    if (percentage <= 30) return 'Excellent! Keep it below 30%';
    if (percentage <= 50) return 'Good, but try to keep under 30%';
    if (percentage <= 75) return 'Consider paying down some debt';
    return 'Critical! High utilization affects credit score';
  }

  getUtilizationBarClass(percentage: number): string {
    if (percentage <= 30) return 'util-good';
    if (percentage <= 50) return 'util-moderate';
    if (percentage <= 75) return 'util-high';
    return 'util-critical';
  }

  getSpendingPercentage(spent: number | undefined | null): number {
    const safeSpent = spent ?? 0;
    const maxSpent = this.report()?.totalSpentAllCards || 1;
    return (safeSpent / maxSpent) * 100;
  }
}
