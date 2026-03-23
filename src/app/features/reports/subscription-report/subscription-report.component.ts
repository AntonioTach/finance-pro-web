import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ReportService } from '../services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { CategoryIconComponent } from '../../../shared/components/category-icon/category-icon.component';
import { SubscriptionReport } from '../../../core/models/report.model';

@Component({
  selector: 'app-subscription-report',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    CategoryIconComponent,
  ],
  templateUrl: './subscription-report.component.html',
  styleUrls: ['./subscription-report.component.scss'],
})
export class SubscriptionReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  report = signal<SubscriptionReport | null>(null);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            if (isNaN(value)) return ` ${context.label}: $0.00/mo`;
            return ` ${context.label}: $${value.toFixed(2)}/mo`;
          },
        },
      },
    },
  };

  categoryChartData = computed((): ChartData<'doughnut'> => {
    const data = this.report()?.subscriptionsByCategory || [];
    return {
      labels: data.map((c) => c.categoryName),
      datasets: [
        {
          data: data.map((c) => Number(c.amount || 0)),
          backgroundColor: data.map((c) => c.categoryColor),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.reportService.generateSubscriptionReport().subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading subscription report:', error);
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
}
