import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../services/report.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-monthly-report',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CurrencyFormatPipe],
  template: `
    <div class="report-page">
      <h1>Monthly Report</h1>
      <div *ngIf="isLoading()" class="loading-container">
        <app-loading-spinner></app-loading-spinner>
      </div>
      <div *ngIf="!isLoading() && report()" class="report-content">
        <div class="report-summary">
          <div class="summary-item">
            <span class="label">Income:</span>
            <span class="value income">{{ report()?.summary?.income | currencyFormat }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Expense:</span>
            <span class="value expense">{{ report()?.summary?.expense | currencyFormat }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Balance:</span>
            <span class="value" [class.positive]="report()?.summary?.balance >= 0" [class.negative]="report()?.summary?.balance < 0">
              {{ report()?.summary?.balance | currencyFormat }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .report-page {
        padding: var(--spacing-lg);
      }

      .report-summary {
        background: var(--bg-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--border-color);
      }

      .value.income {
        color: var(--success-color);
      }

      .value.expense {
        color: var(--danger-color);
      }

      .value.positive {
        color: var(--success-color);
      }

      .value.negative {
        color: var(--danger-color);
      }
    `,
  ],
})
export class MonthlyReportComponent implements OnInit {
  private reportService = inject(ReportService);

  isLoading = signal(false);
  report = signal<any>(null);

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.reportService.getMonthlyReport().subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading report:', error);
        this.isLoading.set(false);
      },
    });
  }
}

