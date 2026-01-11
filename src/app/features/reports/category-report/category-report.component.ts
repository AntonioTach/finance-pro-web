import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ReportService } from '../services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { CategoryReport } from '../../../core/models/report.model';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

@Component({
  selector: 'app-category-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DatePickerModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './category-report.component.html',
  styleUrls: ['./category-report.component.scss'],
})
export class CategoryReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  report = signal<CategoryReport | null>(null);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  startDate: Date = startOfMonth(subMonths(new Date(), 5));
  endDate: Date = endOfMonth(new Date());

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            if (isNaN(value)) return ` ${context.label}: 0%`;
            return ` ${context.label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
  };

  netBalance = computed(() => {
    const r = this.report();
    if (!r) return 0;
    const income = Number(r.totalIncome || 0);
    const expenses = Number(r.totalExpenses || 0);
    return income - expenses;
  });

  expenseChartData = computed((): ChartData<'doughnut'> => {
    const data = this.report()?.expenseByCategory || [];
    return {
      labels: data.map((c) => c.categoryName),
      datasets: [
        {
          data: data.map((c) => Number(c.percentage || 0)),
          backgroundColor: data.map((c) => c.categoryColor),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  });

  incomeChartData = computed((): ChartData<'doughnut'> => {
    const data = this.report()?.incomeByCategory || [];
    return {
      labels: data.map((c) => c.categoryName),
      datasets: [
        {
          data: data.map((c) => Number(c.percentage || 0)),
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

    const filters = {
      startDate: format(this.startDate, 'yyyy-MM-dd'),
      endDate: format(this.endDate, 'yyyy-MM-dd'),
    };

    this.reportService.generateCategoryReport(filters).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading category report:', error);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.loadReport();
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
}
