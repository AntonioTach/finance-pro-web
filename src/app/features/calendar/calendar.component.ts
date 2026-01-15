import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { CalendarService } from './services/calendar.service';
import {
  CalendarView,
  MonthlyCalendarResponse,
  YearlyProjectionResponse,
  MONTH_NAMES,
} from './models/calendar.model';
import { MonthlyViewComponent } from './components/monthly-view/monthly-view.component';
import { YearlyViewComponent } from './components/yearly-view/yearly-view.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    MonthlyViewComponent,
    YearlyViewComponent,
  ],
  template: `
    <div class="calendar-page">
      <header class="calendar-header">
        <div class="header-left">
          <h1>Calendario Financiero</h1>
          <p class="subtitle">{{ getHeaderSubtitle() }}</p>
        </div>

        <div class="header-controls">
          <p-selectbutton
            [options]="viewOptions"
            [(ngModel)]="selectedView"
            (onChange)="onViewChange()"
            [allowEmpty]="false"
          />
        </div>
      </header>

      <div class="calendar-navigation">
        <p-button
          icon="pi pi-chevron-left"
          [rounded]="true"
          [text]="true"
          (onClick)="navigatePrevious()"
          [ariaLabel]="selectedView === 'monthly' ? 'Mes anterior' : 'Año anterior'"
        />
        
        <span class="navigation-label">
          @if (selectedView === 'monthly') {
            {{ MONTH_NAMES[currentMonth - 1] }} {{ currentYear }}
          } @else {
            {{ currentYear }}
          }
        </span>
        
        <p-button
          icon="pi pi-chevron-right"
          [rounded]="true"
          [text]="true"
          (onClick)="navigateNext()"
          [ariaLabel]="selectedView === 'monthly' ? 'Mes siguiente' : 'Año siguiente'"
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
        } @else {
          @if (selectedView === 'monthly' && monthlyData) {
            <app-monthly-view
              [data]="monthlyData"
              [year]="currentYear"
              [month]="currentMonth"
            />
          }
          
          @if (selectedView === 'yearly' && yearlyData) {
            <app-yearly-view
              [data]="yearlyData"
              [year]="currentYear"
            />
          }
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

  selectedView: CalendarView = 'monthly';
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  monthlyData: MonthlyCalendarResponse | null = null;
  yearlyData: YearlyProjectionResponse | null = null;

  isLoading = false;
  errorMessage = '';

  viewOptions = [
    { label: 'Mensual', value: 'monthly' as CalendarView },
    { label: 'Anual', value: 'yearly' as CalendarView },
  ];

  getHeaderSubtitle(): string {
    if (this.selectedView === 'monthly') {
      const total = this.monthlyData?.summary.totalToPay ?? 0;
      return `Este mes debes pagar: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
    } else {
      return 'Proyección de deuda por tarjeta';
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.selectedView === 'monthly') {
      this.loadMonthlyData();
    } else {
      this.loadYearlyData();
    }
  }

  private loadMonthlyData(): void {
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

  private loadYearlyData(): void {
    this.calendarService.getYearlyProjection(this.currentYear).subscribe({
      next: (data) => {
        this.yearlyData = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar la proyección anual';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Error loading yearly projection:', error);
      },
    });
  }

  onViewChange(): void {
    this.loadData();
  }

  navigatePrevious(): void {
    if (this.selectedView === 'monthly') {
      if (this.currentMonth === 1) {
        this.currentMonth = 12;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
    } else {
      this.currentYear--;
    }
    this.loadData();
  }

  navigateNext(): void {
    if (this.selectedView === 'monthly') {
      if (this.currentMonth === 12) {
        this.currentMonth = 1;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
    } else {
      this.currentYear++;
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
