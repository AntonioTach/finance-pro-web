import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CalendarService } from './services/calendar.service';
import { MonthlyCalendarResponse, MONTH_NAMES } from './models/calendar.model';
import { MonthlyViewComponent } from './components/monthly-view/monthly-view.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ButtonModule, MonthlyViewComponent],
  template: `
    <div class="calendar-page">
      <header class="calendar-header">
        <div class="header-left">
          <h1>Calendario Financiero</h1>
          <p class="subtitle">{{ getHeaderSubtitle() }}</p>
        </div>
      </header>

      <div class="calendar-navigation">
        <p-button
          icon="pi pi-chevron-left"
          [rounded]="true"
          [text]="true"
          (onClick)="navigatePrevious()"
          ariaLabel="Mes anterior"
        />

        <span class="navigation-label">
          {{ MONTH_NAMES[currentMonth - 1] }} {{ currentYear }}
        </span>

        <p-button
          icon="pi pi-chevron-right"
          [rounded]="true"
          [text]="true"
          (onClick)="navigateNext()"
          ariaLabel="Mes siguiente"
        />

        <p-button
          label="Hoy"
          [text]="true"
          (onClick)="goToToday()"
          styleClass="today-button"
        />
      </div>

      <div class="calendar-content">
        @if (isLoading) {
          <div class="loading-container">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Cargando...</span>
          </div>
        } @else if (errorMessage) {
          <div class="error-container">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ errorMessage }}</span>
            <p-button label="Reintentar" (onClick)="loadData()" />
          </div>
        } @else if (monthlyData) {
          <app-monthly-view
            [data]="monthlyData"
            [year]="currentYear"
            [month]="currentMonth"
          />
        }
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private cdr = inject(ChangeDetectorRef);

  readonly MONTH_NAMES = MONTH_NAMES;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  monthlyData: MonthlyCalendarResponse | null = null;

  isLoading = false;
  errorMessage = '';

  getHeaderSubtitle(): string {
    const total = this.monthlyData?.summary.totalToPay ?? 0;
    return `Este mes debes pagar: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.calendarService
      .getMonthlyCalendar(this.currentYear, this.currentMonth)
      .subscribe({
        next: (data) => {
          this.monthlyData = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar el calendario';
          this.isLoading = false;
          this.cdr.detectChanges();
          console.error('Error loading monthly calendar:', error);
        },
      });
  }

  navigatePrevious(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadData();
  }

  navigateNext(): void {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadData();
  }

  goToToday(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1;
    this.loadData();
  }
}
