import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AccountService } from '../services/account.service';
import { Account } from '../../../core/models/account.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { toLocalDateStr } from '../../../shared/utils/date.util';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    TranslatePipe,
    CurrencyFormatPipe,
  ],
  template: `
    <div class="dialog-form">
      <div class="form-field">
        <label>{{ 'accounts.transfer.from' | translate }}</label>
        <p-select [options]="accounts" [(ngModel)]="fromAccountId" optionLabel="name" optionValue="id" [fluid]="true">
          <ng-template let-acc #item>
            <div class="option-row"><span>{{ acc.name }}</span><span class="muted">{{ acc.balance | currencyFormat:currency }}</span></div>
          </ng-template>
        </p-select>
      </div>

      <div class="form-field">
        <label>{{ 'accounts.transfer.to' | translate }}</label>
        <p-select [options]="accounts" [(ngModel)]="toAccountId" optionLabel="name" optionValue="id" [fluid]="true" />
      </div>

      <div class="form-field">
        <label for="trAmount">{{ 'accounts.transfer.amount' | translate }}</label>
        <p-inputNumber inputId="trAmount" [(ngModel)]="amount" mode="decimal"
          [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0.01" [fluid]="true" />
      </div>

      <div class="form-field">
        <label for="trDate">{{ 'accounts.transfer.date' | translate }}</label>
        <p-datepicker inputId="trDate" [(ngModel)]="date" dateFormat="dd/mm/yy" [showIcon]="true" [fluid]="true" />
      </div>

      <div class="form-field">
        <label for="trNotes">{{ 'accounts.transfer.notes' | translate }} <span class="hint">({{ 'common.optional' | translate }})</span></label>
        <textarea id="trNotes" pTextarea [(ngModel)]="notes" rows="2" class="w-full"></textarea>
      </div>

      @if (fromAccountId && fromAccountId === toAccountId) {
        <small class="error-text">{{ 'accounts.transfer.sameAccount' | translate }}</small>
      }

      <div class="form-actions">
        <p-button [label]="'common.cancel' | translate" severity="secondary" [outlined]="true" (onClick)="ref.close()" />
        <p-button [label]="'accounts.transfer.submit' | translate" [loading]="saving()" [disabled]="!isValid()" (onClick)="submit()" />
      </div>
    </div>
  `,
  styleUrls: ['../accounts-shared.scss'],
})
export class TransferFormComponent implements OnInit {
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private accountService = inject(AccountService);

  saving = signal(false);
  accounts: Account[] = [];
  currency = 'MXN';

  fromAccountId = '';
  toAccountId = '';
  amount: number | null = null;
  date: Date = new Date();
  notes = '';

  ngOnInit(): void {
    this.accounts = this.config.data?.accounts ?? [];
    this.currency = this.config.data?.currency ?? 'MXN';
    this.fromAccountId = this.accounts[0]?.id ?? '';
    this.toAccountId = this.accounts[1]?.id ?? '';
  }

  isValid(): boolean {
    return !!this.fromAccountId && !!this.toAccountId && this.fromAccountId !== this.toAccountId
      && !!this.amount && this.amount > 0 && !!this.date;
  }

  submit(): void {
    if (!this.isValid()) return;
    this.saving.set(true);
    this.accountService.createTransfer({
      fromAccountId: this.fromAccountId,
      toAccountId: this.toAccountId,
      amount: this.amount!,
      date: toLocalDateStr(this.date),
      notes: this.notes.trim() || undefined,
    }).subscribe({
      next: (t) => { this.saving.set(false); this.ref.close(t); },
      error: () => this.saving.set(false),
    });
  }
}
