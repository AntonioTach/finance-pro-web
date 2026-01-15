import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import {
  MonthlyCalendarResponse,
  CalendarDay,
  CalendarEvent,
  WEEKDAY_NAMES,
} from '../../models/calendar.model';

@Component({
  selector: 'app-monthly-view',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <div class="monthly-view">
      <div class="calendar-grid">
        <!-- Weekday headers -->
        <div class="weekday-header">
          @for (day of WEEKDAY_NAMES; track day) {
            <div class="weekday-name">{{ day }}</div>
          }
        </div>

        <!-- Calendar days -->
        <div class="days-grid">
          <!-- Empty cells for days before month starts -->
          @for (empty of getEmptyDaysBefore(); track $index) {
            <div class="day-cell empty"></div>
          }

          <!-- Actual days -->
          @for (day of getCalendarDays(); track day.day) {
            <div
              class="day-cell"
              [class.today]="day.isToday"
              [class.has-events]="day.events.length > 0"
            >
              <div class="day-number">{{ day.day }}</div>
              <div class="day-events">
                @for (event of day.events.slice(0, 3); track event.id) {
                  <div
                    class="event-pill"
                    [style.background-color]="event.color"
                    [pTooltip]="getEventTooltip(event)"
                    tooltipPosition="top"
                  >
                    @if (event.type === 'cutoff' || event.type === 'due_date') {
                      <i class="pi" [class]="getEventIcon(event.type)"></i>
                    }
                    <span class="event-title">{{ event.title }}</span>
                    @if (event.amount) {
                      <span class="event-amount">{{ event.amount | currency:'MXN':'symbol':'1.0-0':'es-MX' }}</span>
                    }
                  </div>
                }
                @if (day.events.length > 3) {
                  <div class="more-events">+{{ day.events.length - 3 }} más</div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Summary panel -->
      <div class="summary-panel">
        <h3>Resumen del Mes</h3>
        
        <div class="total-section">
          <span class="total-label">Total a pagar:</span>
          <span class="total-amount">
            {{ data.summary.totalToPay | currency:'MXN':'symbol':'1.2-2':'es-MX' }}
          </span>
        </div>

        <div class="cards-breakdown">
          @for (card of data.summary.byCard; track card.cardId) {
            <div class="card-summary">
              <div class="card-header">
                <span class="card-name">{{ card.cardName }}</span>
                @if (card.last4) {
                  <small class="card-last4">•••• {{ card.last4 }}</small>
                }
              </div>
              
              <div class="card-total">
                {{ card.totalAmount | currency:'MXN':'symbol':'1.2-2':'es-MX' }}
              </div>

              <div class="card-details">
                @if (card.msiAmount > 0) {
                  <div class="detail-row">
                    <span class="detail-label">
                      <span class="dot msi"></span>
                      MSI
                    </span>
                    <span class="detail-value">{{ card.msiAmount | currency:'MXN':'symbol':'1.2-2':'es-MX' }}</span>
                  </div>
                }
                @if (card.purchasesAmount > 0) {
                  <div class="detail-row">
                    <span class="detail-label">
                      <span class="dot purchases"></span>
                      Compras
                    </span>
                    <span class="detail-value">{{ card.purchasesAmount | currency:'MXN':'symbol':'1.2-2':'es-MX' }}</span>
                  </div>
                }
                @if (card.subscriptionsAmount > 0) {
                  <div class="detail-row">
                    <span class="detail-label">
                      <span class="dot subscriptions"></span>
                      Suscripciones
                    </span>
                    <span class="detail-value">{{ card.subscriptionsAmount | currency:'MXN':'symbol':'1.2-2':'es-MX' }}</span>
                  </div>
                }
              </div>

              @if (card.dueDate) {
                <div class="due-date">
                  <i class="pi pi-calendar"></i>
                  Fecha límite: {{ formatDate(card.dueDate) }}
                </div>
              }
            </div>
          }
        </div>

        <div class="legend">
          <h4>Leyenda</h4>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-color" style="background: #FFA726"></span>
              <span>Corte</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #EF5350"></span>
              <span>Pago</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #42A5F5"></span>
              <span>Transacción</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #66BB6A"></span>
              <span>MSI</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #AB47BC"></span>
              <span>Suscripción</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./monthly-view.component.scss'],
})
export class MonthlyViewComponent implements OnInit, OnChanges {
  @Input({ required: true }) data!: MonthlyCalendarResponse;
  @Input({ required: true }) year!: number;
  @Input({ required: true }) month!: number;

  readonly WEEKDAY_NAMES = WEEKDAY_NAMES;

  // Cached values
  private _emptyDaysBefore: null[] = [];
  private _calendarDays: CalendarDay[] = [];

  ngOnInit(): void {
    this.updateEmptyDays();
    this.updateCalendarDays();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['year'] || changes['month']) {
      this.updateEmptyDays();
    }
    if (changes['data'] || changes['year'] || changes['month']) {
      this.updateCalendarDays();
    }
  }

  getEmptyDaysBefore(): null[] {
    return this._emptyDaysBefore;
  }

  getCalendarDays(): CalendarDay[] {
    return this._calendarDays;
  }

  private updateEmptyDays(): void {
    if (!this.year || !this.month) {
      this._emptyDaysBefore = [];
      return;
    }
    const firstDay = new Date(this.year, this.month - 1, 1);
    let dayOfWeek = firstDay.getDay();
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    this._emptyDaysBefore = Array(dayOfWeek).fill(null);
  }

  private updateCalendarDays(): void {
    if (!this.data?.days) {
      this._calendarDays = [];
      return;
    }
    
    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === this.year && today.getMonth() + 1 === this.month;
    const todayDay = today.getDate();

    this._calendarDays = this.data.days.map((day) => ({
      ...day,
      isToday: isCurrentMonth && day.day === todayDay,
      isCurrentMonth: true,
    }));
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'cutoff':
        return 'pi-calendar';
      case 'due_date':
        return 'pi-exclamation-circle';
      default:
        return 'pi-circle-fill';
    }
  }

  getEventTooltip(event: CalendarEvent): string {
    let tooltip = event.title;
    if (event.amount) {
      tooltip += ` - $${event.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }
    if (event.cardName) {
      tooltip += ` (${event.cardName})`;
    }
    return tooltip;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  }
}
