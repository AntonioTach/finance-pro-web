import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  YearlyProjectionResponse,
  CardYearlyProjection,
  MonthProjection,
  MONTH_NAMES_SHORT,
} from '../../models/msi.model';

type ProjectionMode = 'remaining' | 'due';

@Component({
  selector: 'app-msi-yearly-projection',
  standalone: true,
  imports: [CommonModule, FormsModule, TooltipModule, DialogModule, SelectButtonModule],
  templateUrl: './yearly-projection.component.html',
  styleUrls: ['./yearly-projection.component.scss'],
})
export class MsiYearlyProjectionComponent {
  @Input({ required: true }) data!: YearlyProjectionResponse;
  @Input({ required: true }) year!: number;

  readonly MONTH_NAMES_SHORT = MONTH_NAMES_SHORT;

  showDetailDialog = false;
  selectedCard = signal<CardYearlyProjection | null>(null);
  selectedMonth = signal<MonthProjection | null>(null);

  mode = signal<ProjectionMode>('remaining');
  modeOptions: { label: string; value: ProjectionMode }[] = [
    { label: 'Deuda restante', value: 'remaining' },
    { label: 'Pago mensual', value: 'due' },
  ];

  modeDescription = computed(() =>
    this.mode() === 'remaining'
      ? 'Cuánto quedaría por pagar de tus MSI si dejaras de comprar hoy — va bajando cada mes.'
      : 'Cuánto se carga realmente cada mes a tus MSI activos — se mantiene igual mientras dure el plan.',
  );

  totalSeries = computed(() =>
    this.mode() === 'remaining' ? (this.data?.totalByMonth ?? []) : (this.data?.paymentDueByMonth ?? []),
  );

  totalMax = computed(() => {
    if (this.mode() === 'due') return this.data?.totalMaxPaymentDue ?? 0;
    return Math.max(...(this.data?.totalByMonth ?? [0]), 0);
  });

  detailDialogHeader = () => {
    const card = this.selectedCard();
    const month = this.selectedMonth();
    if (!card || !month) return '';
    return `${card.cardName} - ${MONTH_NAMES_SHORT[month.month - 1]} ${this.year}`;
  };

  getMonthValue(month: MonthProjection): number {
    return this.mode() === 'remaining' ? month.totalDebt : month.monthlyPaymentDue;
  }

  getCardMax(card: CardYearlyProjection): number {
    return this.mode() === 'remaining' ? card.maxDebt : card.maxPaymentDue;
  }

  /** The "Liquidado" checkmark only makes sense for the remaining-balance
   * view (it means "nothing left to pay"); in the monthly-payment view a
   * $0 month just means nothing is charged that month, shown as "-". */
  isPaidOffCell(month: MonthProjection): boolean {
    return this.mode() === 'remaining' && month.isPaidOff;
  }

  formatAmount(amount: number): string {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  }

  getBarHeight(value: number, max: number): number {
    if (max === 0) return 0;
    return Math.min((value / max) * 100, 100);
  }

  getBarColor(value: number, max: number): string {
    if (max === 0) return 'var(--green-500)';
    const ratio = value / max;
    if (ratio > 0.66) return 'var(--red-400)';
    if (ratio > 0.33) return 'var(--orange-400)';
    return 'var(--green-400)';
  }

  showMonthDetail(card: CardYearlyProjection, month: MonthProjection): void {
    if (this.getMonthValue(month) === 0 && month.msiDetails.length === 0) return;
    this.selectedCard.set(card);
    this.selectedMonth.set(month);
    this.showDetailDialog = true;
  }
}
