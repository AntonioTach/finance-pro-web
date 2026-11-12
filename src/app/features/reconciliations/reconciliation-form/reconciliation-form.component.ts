import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReconciliationService } from '../services/reconciliation.service';
import { ReconciliationPreview } from '../../../core/models/reconciliation.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { toLocalDateStr } from '../../../shared/utils/date.util';

interface Row {
  kind: 'account' | 'card';
  id: string;
  name: string;
  subtitle: string | null;
  computed: number;
  msiPending: number;
  lastDate: string | null;
  real: number | null;
}

@Component({
  selector: 'app-reconciliation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
    TranslatePipe,
  ],
  templateUrl: './reconciliation-form.component.html',
  styleUrls: ['../../accounts/accounts-shared.scss', './reconciliation-form.component.scss'],
})
export class ReconciliationFormComponent implements OnInit {
  private service = inject(ReconciliationService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private ts = inject(TranslationService);

  currency = this.authService.currentUser()?.currency ?? 'MXN';
  today = new Date();
  date: Date = new Date();
  notes = '';

  isLoading = signal(false);
  saving = signal(false);
  accountRows = signal<Row[]>([]);
  cardRows = signal<Row[]>([]);
  /** Bumped on every input change so the computed summaries re-evaluate. */
  private tick = signal(0);

  filledCount = computed(() => {
    this.tick();
    return [...this.accountRows(), ...this.cardRows()].filter((r) => r.real !== null).length;
  });

  /** Net money difference across reconciled accounts (positive = more than recorded). */
  accountsDiff = computed(() => {
    this.tick();
    return this.sumDiff(this.accountRows());
  });

  /** Net debt difference across reconciled cards (positive = more debt than recorded). */
  cardsDiff = computed(() => {
    this.tick();
    return this.sumDiff(this.cardRows());
  });

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    if (!this.date) return;
    this.isLoading.set(true);
    this.service.preview(toLocalDateStr(this.date)).subscribe({
      next: (p) => {
        this.setRows(p);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onInput(): void {
    this.tick.update((v) => v + 1);
  }

  /** Copies the computed amount as the real one ("this one is already right"). */
  matchComputed(row: Row): void {
    row.real = row.computed;
    this.onInput();
  }

  diff(row: Row): number | null {
    return row.real === null ? null : Math.round((row.real - row.computed) * 100) / 100;
  }

  save(): void {
    const items = [
      ...this.accountRows().filter((r) => r.real !== null).map((r) => ({ accountId: r.id, realAmount: r.real! })),
      ...this.cardRows().filter((r) => r.real !== null).map((r) => ({ cardId: r.id, realAmount: r.real! })),
    ];
    if (items.length === 0) return;

    this.saving.set(true);
    this.service.create({ date: toLocalDateStr(this.date), notes: this.notes.trim() || undefined, items }).subscribe({
      next: () => {
        this.saving.set(false);
        // Toast after navigating so the history page's <p-toast> shows it.
        this.router.navigate(['/reconciliations']).then(() =>
          this.messageService.add({ severity: 'success', summary: '✓', detail: this.ts.t('reconciliations.toast.saved') }),
        );
      },
      error: () => this.saving.set(false),
    });
  }

  private setRows(p: ReconciliationPreview): void {
    // Keep what the user already typed when they only change the date.
    const typed = new Map([...this.accountRows(), ...this.cardRows()].map((r) => [r.id, r.real]));
    this.accountRows.set(
      p.accounts.map((a) => ({
        kind: 'account',
        id: a.accountId,
        name: a.name,
        subtitle: this.ts.t(`accounts.type.${a.type}`),
        computed: a.computedAmount,
        msiPending: 0,
        lastDate: a.lastReconciliation?.date ?? null,
        real: typed.get(a.accountId) ?? null,
      })),
    );
    this.cardRows.set(
      p.cards.map((c) => ({
        kind: 'card',
        id: c.cardId,
        name: c.name,
        subtitle: c.last4 ? `•••• ${c.last4}` : null,
        computed: c.computedAmount,
        msiPending: c.msiPending,
        lastDate: c.lastReconciliation?.date ?? null,
        real: typed.get(c.cardId) ?? null,
      })),
    );
    this.onInput();
  }

  private sumDiff(rows: Row[]): number {
    return Math.round(rows.reduce((s, r) => s + (this.diff(r) ?? 0), 0) * 100) / 100;
  }
}
