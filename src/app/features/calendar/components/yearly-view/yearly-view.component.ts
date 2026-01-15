import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import {
  YearlyProjectionResponse,
  CardYearlyProjection,
  MonthProjection,
  MONTH_NAMES_SHORT,
} from '../../models/calendar.model';

@Component({
  selector: 'app-yearly-view',
  standalone: true,
  imports: [CommonModule, TooltipModule, DialogModule],
  template: `
    <div class="yearly-view">
      <div class="projection-header">
        <h2>Proyección de Deuda {{ year }}</h2>
        <p class="projection-subtitle">
          Visualiza cómo evoluciona tu deuda de MSI mes a mes
        </p>
      </div>

      @if (!data?.cards || data.cards.length === 0) {
        <div class="empty-state">
          <i class="pi pi-credit-card"></i>
          <h3>Sin tarjetas de crédito</h3>
          <p>Agrega una tarjeta de crédito para ver proyecciones de deuda</p>
        </div>
      } @else {
        <div class="projection-table">
          <div class="table-header">
            <div class="card-column">Tarjeta</div>
            @for (monthName of MONTH_NAMES_SHORT; track $index) {
              <div class="month-column">{{ monthName }}</div>
            }
          </div>

          @for (card of data.cards; track card.cardId) {
            <div class="table-row">
              <div class="card-column">
                <div class="card-info">
                  <span class="card-name">{{ card.cardName }}</span>
                  @if (card.last4) {
                    <small class="card-last4">•••• {{ card.last4 }}</small>
                  }
                </div>
              </div>

              @for (month of card.projection; track month.month) {
                <div
                  class="month-column"
                  [class.paid-off]="month.isPaidOff"
                  [class.has-debt]="month.totalDebt > 0"
                  (click)="showMonthDetail(card, month)"
                >
                  @if (month.isPaidOff) {
                    <div class="paid-off-indicator">
                      <i class="pi pi-check-circle"></i>
                    </div>
                  } @else if (month.totalDebt > 0) {
                    <div class="debt-cell">
                      <span class="debt-amount">
                        {{ formatAmount(month.totalDebt) }}
                      </span>
                      <div
                        class="debt-bar"
                        [style.height.%]="getBarHeight(month.totalDebt, card.maxDebt)"
                        [style.background]="getBarColor(month.totalDebt, card.maxDebt)"
                      ></div>
                    </div>
                  } @else {
                    <div class="no-debt">-</div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="legend-section">
          <h4>Leyenda</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-bar high"></div>
              <span>Deuda alta</span>
            </div>
            <div class="legend-item">
              <div class="legend-bar medium"></div>
              <span>Deuda media</span>
            </div>
            <div class="legend-item">
              <div class="legend-bar low"></div>
              <span>Deuda baja</span>
            </div>
            <div class="legend-item">
              <i class="pi pi-check-circle" style="color: var(--green-500)"></i>
              <span>Liquidado</span>
            </div>
          </div>
        </div>
      }

      <!-- Month Detail Dialog -->
      <p-dialog
        [(visible)]="showDetailDialog"
        [header]="detailDialogHeader()"
        [modal]="true"
        [style]="{ width: '400px' }"
        [dismissableMask]="true"
      >
        @if (selectedMonth() && selectedCard()) {
          <div class="detail-content">
            <div class="detail-total">
              <span class="label">Deuda total:</span>
              <span class="value">
                {{ selectedMonth()!.totalDebt | currency:'MXN':'symbol':'1.2-2':'es-MX' }}
              </span>
            </div>

            @if (selectedMonth()!.msiDetails.length > 0) {
              <div class="msi-breakdown">
                <h4>Desglose MSI</h4>
                @for (msi of selectedMonth()!.msiDetails; track msi.transactionId) {
                  <div class="msi-item">
                    <div class="msi-description">{{ msi.description }}</div>
                    <div class="msi-info">
                      <span class="monthly">
                        {{ msi.monthlyAmount | currency:'MXN':'symbol':'1.2-2':'es-MX' }}/mes
                      </span>
                      <span class="remaining">
                        {{ msi.remainingMonths }} de {{ msi.totalMonths }} meses restantes
                      </span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="no-msi">
                <i class="pi pi-info-circle"></i>
                <span>Sin compras a MSI activas</span>
              </div>
            }
          </div>
        }
      </p-dialog>
    </div>
  `,
  styleUrls: ['./yearly-view.component.scss'],
})
export class YearlyViewComponent {
  @Input({ required: true }) data!: YearlyProjectionResponse;
  @Input({ required: true }) year!: number;

  readonly MONTH_NAMES_SHORT = MONTH_NAMES_SHORT;

  showDetailDialog = false;
  selectedCard = signal<CardYearlyProjection | null>(null);
  selectedMonth = signal<MonthProjection | null>(null);

  detailDialogHeader = () => {
    const card = this.selectedCard();
    const month = this.selectedMonth();
    if (!card || !month) return '';
    return `${card.cardName} - ${MONTH_NAMES_SHORT[month.month - 1]} ${this.year}`;
  };

  formatAmount(amount: number): string {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  }

  getBarHeight(debt: number, maxDebt: number): number {
    if (maxDebt === 0) return 0;
    return Math.min((debt / maxDebt) * 100, 100);
  }

  getBarColor(debt: number, maxDebt: number): string {
    if (maxDebt === 0) return 'var(--green-500)';
    const ratio = debt / maxDebt;
    if (ratio > 0.66) return 'var(--red-400)';
    if (ratio > 0.33) return 'var(--orange-400)';
    return 'var(--green-400)';
  }

  showMonthDetail(card: CardYearlyProjection, month: MonthProjection): void {
    if (month.totalDebt === 0 && month.msiDetails.length === 0) return;
    this.selectedCard.set(card);
    this.selectedMonth.set(month);
    this.showDetailDialog = true;
  }
}
