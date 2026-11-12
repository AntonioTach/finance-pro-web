import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AccountService } from '../services/account.service';
import { Account, AccountType, CreateAccountDto } from '../../../core/models/account.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    TranslatePipe,
  ],
  template: `
    <div class="dialog-form">
      <div class="form-field">
        <label for="accName">{{ 'accounts.form.name' | translate }}</label>
        <input id="accName" pInputText [(ngModel)]="dto.name" [placeholder]="'accounts.form.namePlaceholder' | translate" class="w-full" />
      </div>

      <div class="form-field">
        <label>{{ 'accounts.form.type' | translate }}</label>
        <p-select [options]="typeOptions" [(ngModel)]="dto.type" optionLabel="label" optionValue="value" [fluid]="true" />
      </div>

      <div class="form-field">
        <label for="accInitial">{{ 'accounts.form.initialBalance' | translate }}</label>
        <p-inputNumber inputId="accInitial" [(ngModel)]="dto.initialBalance" mode="decimal"
          [minFractionDigits]="2" [maxFractionDigits]="2" [fluid]="true" />
        <small class="hint">{{ 'accounts.form.initialBalanceHint' | translate }}</small>
      </div>

      @if (!editing?.isDefault) {
        <div class="toggle-row">
          <span>{{ 'accounts.form.makeDefault' | translate }}</span>
          <p-toggleswitch [(ngModel)]="dto.isDefault" />
        </div>
      }

      <div class="form-actions">
        <p-button [label]="'common.cancel' | translate" severity="secondary" [outlined]="true" (onClick)="ref.close()" />
        <p-button [label]="'common.save' | translate" [loading]="saving()" [disabled]="!dto.name.trim()" (onClick)="submit()" />
      </div>
    </div>
  `,
  styleUrls: ['../accounts-shared.scss'],
})
export class AccountFormComponent implements OnInit {
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private accountService = inject(AccountService);
  private ts = inject(TranslationService);

  saving = signal(false);
  editing: Account | null = null;

  dto: CreateAccountDto & { name: string } = { name: '', type: 'bank', initialBalance: 0, isDefault: false };

  typeOptions: { label: string; value: AccountType }[] = (
    ['cash', 'bank', 'digital_wallet', 'other'] as AccountType[]
  ).map((value) => ({ value, label: this.ts.t(`accounts.type.${value}`) }));

  ngOnInit(): void {
    this.editing = this.config.data?.account ?? null;
    if (this.editing) {
      this.dto = {
        name: this.editing.name,
        type: this.editing.type,
        initialBalance: this.editing.initialBalance,
        isDefault: this.editing.isDefault,
      };
    }
  }

  submit(): void {
    const payload: CreateAccountDto = { ...this.dto, name: this.dto.name.trim(), initialBalance: this.dto.initialBalance ?? 0 };
    if (this.editing?.isDefault) delete payload.isDefault;
    this.saving.set(true);
    const req = this.editing
      ? this.accountService.update(this.editing.id, payload)
      : this.accountService.create(payload);
    req.subscribe({
      next: (acc) => { this.saving.set(false); this.ref.close(acc); },
      error: () => this.saving.set(false),
    });
  }
}
