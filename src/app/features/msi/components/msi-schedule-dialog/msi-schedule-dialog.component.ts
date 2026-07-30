import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { TransactionService, MsiGroup } from '../../../transactions/services/transaction.service';
import { Transaction } from '../../../../core/models/transaction.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';

export interface MsiScheduleDialogResult {
  cancelled: boolean;
  deletedCount?: number;
}

/**
 * Shared MSI installment-schedule viewer + canceller. Opened as a
 * PrimeNG dynamic dialog with `data: { transactionId }` (either the parent
 * transaction's id or any of its installments' id — the backend resolves
 * the group either way). Self-contained (own confirm step, own error/empty
 * states) so it can be opened from the transaction form and from the /msi
 * dashboard without either caller needing to know its internals.
 */
@Component({
  selector: 'app-msi-schedule-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ProgressBarModule, MessageModule, CurrencyFormatPipe, DateFormatPipe],
  template: `
    <div class="msi-schedule-dialog">
      @if (isLoading()) {
        <div class="state-row">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Cargando calendario de pagos...</span>
        </div>
      } @else if (errorMessage()) {
        <p-message severity="error" [text]="errorMessage()!" />
      } @else if (group(); as g) {
        <div class="msi-summary">
          <div class="msi-summary-title">{{ groupTitle() }}</div>
          @if (g.parent.card) {
            <div class="msi-summary-card">
              <i class="pi pi-credit-card"></i>
              {{ g.parent.card.name }}
              @if (g.parent.card.last4) { <span>•••• {{ g.parent.card.last4 }}</span> }
            </div>
          }

          <div class="msi-progress">
            <p-progressBar [value]="progressPct()" [showValue]="false" [style]="{ height: '8px' }" />
            <span class="msi-progress-label">{{ paidCount() }} de {{ installments().length }} pagos realizados</span>
          </div>

          <div class="msi-totals">
            <div>
              <span class="label">Total</span>
              <span class="value">{{ totalAmount() | currencyFormat }}</span>
            </div>
            <div>
              <span class="label">Mensualidad</span>
              <span class="value">{{ monthlyAmount() | currencyFormat }}</span>
            </div>
            <div>
              <span class="label">Restante</span>
              <span class="value">{{ remainingAmount() | currencyFormat }}</span>
            </div>
          </div>
        </div>

        <ul class="installment-list">
          @for (installment of installments(); track installment.id) {
            <li class="installment-row" [class.is-paid]="isPaid(installment)">
              <span class="installment-number">{{ installment.installmentCurrent }}/{{ installment.installmentMonths }}</span>
              <span class="installment-date">{{ installment.date | dateFormat }}</span>
              <span class="installment-amount">{{ installment.amount | currencyFormat }}</span>
              <p-tag
                [value]="isPaid(installment) ? 'Pagada' : 'Pendiente'"
                [severity]="isPaid(installment) ? 'success' : 'secondary'"
              />
            </li>
          }
        </ul>

        @if (cancelError()) {
          <p-message severity="error" [text]="cancelError()!" />
        }

        <div class="msi-actions">
          @if (!canCancel()) {
            <span class="completed-hint"><i class="pi pi-check-circle"></i> Este MSI ya está completamente pagado.</span>
          } @else if (!confirmingCancel()) {
            <p-button
              label="Cancelar MSI"
              icon="pi pi-times-circle"
              severity="danger"
              [outlined]="true"
              size="small"
              type="button"
              (onClick)="confirmingCancel.set(true)"
            />
          } @else {
            <div class="cancel-confirm">
              <p>
                Se eliminarán las {{ remainingCount() }} parcialidades pendientes. Esta acción no se puede deshacer.
              </p>
              <div class="cancel-confirm-actions">
                <p-button label="Volver" severity="secondary" [outlined]="true" size="small" type="button" (onClick)="confirmingCancel.set(false)" />
                <p-button
                  label="Sí, cancelar MSI"
                  severity="danger"
                  size="small"
                  type="button"
                  [loading]="isCancelling()"
                  (onClick)="cancelMsi()"
                />
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .msi-schedule-dialog {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .state-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted, var(--text-color-secondary));
      padding: 1.5rem 0;
      justify-content: center;
    }

    .msi-summary-title {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-color);
    }

    .msi-summary-card {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-muted, var(--text-color-secondary));
      font-size: 0.85rem;
      margin-top: 0.2rem;
    }

    .msi-progress {
      margin-top: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .msi-progress-label {
      font-size: 0.78rem;
      color: var(--text-muted, var(--text-color-secondary));
    }

    .msi-totals {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
      gap: 0.5rem;
    }

    .msi-totals > div {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .msi-totals .label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted, var(--text-color-secondary));
    }

    .msi-totals .value {
      font-weight: 700;
      color: var(--text-color);
    }

    .installment-list {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 260px;
      overflow-y: auto;
      border: 1px solid var(--border-color, var(--surface-border));
      border-radius: 8px;
    }

    .installment-row {
      display: grid;
      grid-template-columns: 2.5rem 1fr auto auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border-bottom: 1px solid var(--border-color, var(--surface-border));
      font-size: 0.85rem;
    }

    .installment-row:last-child {
      border-bottom: none;
    }

    .installment-row.is-paid {
      opacity: 0.65;
    }

    .installment-number {
      font-weight: 600;
      color: var(--primary-light, #818cf8);
    }

    .installment-date {
      color: var(--text-color);
    }

    .installment-amount {
      font-weight: 600;
      color: var(--text-color);
    }

    .msi-actions {
      display: flex;
      justify-content: flex-end;
    }

    .completed-hint {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--success-color, var(--green-500));
      font-size: 0.85rem;
    }

    .cancel-confirm {
      width: 100%;
      background: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.25);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .cancel-confirm p {
      margin: 0 0 0.65rem 0;
      font-size: 0.82rem;
      color: var(--text-color);
    }

    .cancel-confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class MsiScheduleDialogComponent implements OnInit {
  private dialogRef = inject(DynamicDialogRef);
  private dialogConfig = inject(DynamicDialogConfig);
  private transactionService = inject(TransactionService);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  group = signal<MsiGroup | null>(null);
  confirmingCancel = signal(false);
  isCancelling = signal(false);
  cancelError = signal<string | null>(null);

  installments = computed(() => this.group()?.installments ?? []);

  groupTitle = computed(() => {
    const description = this.group()?.parent.description ?? '';
    return description.replace(/\s*\(\d+\/\d+\)\s*$/, '');
  });

  totalAmount = computed(() => this.installments().reduce((sum, t) => sum + Number(t.amount), 0));

  monthlyAmount = computed(() => {
    const items = this.installments();
    if (items.length === 0) return 0;
    // The last installment can differ by a cent (rounding remainder), so use
    // any non-last installment as the representative monthly amount.
    const totalMonths = this.group()?.parent.installmentMonths ?? items.length;
    const nonLast = items.find((t) => (t.installmentCurrent ?? 0) < totalMonths) ?? items[0];
    return Number(nonLast.amount);
  });

  paidCount = computed(() => this.installments().filter((t) => this.isPaid(t)).length);
  remainingCount = computed(() => this.installments().length - this.paidCount());
  remainingAmount = computed(() =>
    this.installments()
      .filter((t) => !this.isPaid(t))
      .reduce((sum, t) => sum + Number(t.amount), 0),
  );
  canCancel = computed(() => this.remainingCount() > 0);

  progressPct = computed(() => {
    const total = this.installments().length;
    return total ? Math.round((this.paidCount() / total) * 100) : 0;
  });

  ngOnInit(): void {
    const transactionId = this.dialogConfig.data?.transactionId;
    if (!transactionId) {
      this.errorMessage.set('No se especificó la compra a meses a consultar');
      this.isLoading.set(false);
      return;
    }

    this.transactionService.getMsiGroup(transactionId).subscribe({
      next: (msiGroup) => {
        this.group.set(msiGroup);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading MSI group:', error);
        this.errorMessage.set('No se pudo cargar el calendario de pagos');
        this.isLoading.set(false);
      },
    });
  }

  isPaid(installment: Transaction): boolean {
    const todayStr = new Date().toISOString().split('T')[0];
    return installment.date.substring(0, 10) <= todayStr;
  }

  cancelMsi(): void {
    const parent = this.group()?.parent;
    if (!parent) return;

    this.isCancelling.set(true);
    this.cancelError.set(null);

    this.transactionService.cancelMsi(parent.id).subscribe({
      next: (result) => {
        this.isCancelling.set(false);
        const closeResult: MsiScheduleDialogResult = {
          cancelled: true,
          deletedCount: result.deletedCount,
        };
        this.dialogRef.close(closeResult);
      },
      error: (error) => {
        console.error('Error cancelling MSI:', error);
        this.isCancelling.set(false);
        this.cancelError.set('No se pudo cancelar el MSI');
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
