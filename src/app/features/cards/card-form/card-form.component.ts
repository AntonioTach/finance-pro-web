import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { CardService } from '../services/card.service';
import {
  Card,
  CardType,
  CardNetwork,
  PaymentDueType,
} from '../../../core/models/card.model';

@Component({
  selector: 'app-card-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    MessageModule,
  ],
  template: `
    <form [formGroup]="cardForm" (ngSubmit)="handleSubmit()" class="card-form">
      <!-- Card Type -->
      <div class="form-field">
        <label>Tipo de Tarjeta</label>
        <p-selectbutton
          [options]="cardTypes"
          formControlName="type"
          (onChange)="onTypeChange()"
          [allowEmpty]="false"
        />
      </div>

      <!-- Name -->
      <div class="form-field">
        <label for="name">Nombre de la Tarjeta</label>
        <input
          id="name"
          type="text"
          pInputText
          formControlName="name"
          placeholder="ej. BBVA Azul"
          class="w-full"
        />
        @if (cardForm.get('name')?.invalid && cardForm.get('name')?.touched) {
          <small class="error-text">El nombre es requerido</small>
        }
      </div>

      <!-- Network -->
      <div class="form-field">
        <label for="network">Red</label>
        <p-select
          id="network"
          formControlName="network"
          [options]="networks"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecciona una red"
          [fluid]="true"
          [showClear]="true"
        />
      </div>

      <!-- Last 4 digits -->
      <div class="form-field">
        <label for="last4">Últimos 4 dígitos (opcional)</label>
        <input
          id="last4"
          type="text"
          pInputText
          formControlName="last4"
          placeholder="1234"
          maxlength="4"
          class="w-full"
        />
      </div>

      <!-- Credit Card Fields -->
      @if (isCreditCard()) {
        <div class="credit-fields">
          <h3>Configuración de Crédito</h3>

          <!-- Credit Limit -->
          <div class="form-field">
            <label for="creditLimit">Límite de Crédito</label>
            <p-inputnumber
              id="creditLimit"
              formControlName="creditLimit"
              mode="currency"
              currency="MXN"
              locale="es-MX"
              [minFractionDigits]="2"
              placeholder="0.00"
              [fluid]="true"
            />
            @if (cardForm.get('creditLimit')?.invalid && cardForm.get('creditLimit')?.touched) {
              <small class="error-text">El límite de crédito es requerido</small>
            }
          </div>

          <!-- Billing Cutoff Day -->
          <div class="form-field">
            <label for="billingCutoffDay">Día de Corte</label>
            <p-inputnumber
              id="billingCutoffDay"
              formControlName="billingCutoffDay"
              [min]="1"
              [max]="31"
              placeholder="15"
              [fluid]="true"
              [showButtons]="true"
            />
            @if (cardForm.get('billingCutoffDay')?.invalid && cardForm.get('billingCutoffDay')?.touched) {
              <small class="error-text">El día de corte debe estar entre 1 y 31</small>
            }
          </div>

          <!-- Payment Due Type -->
          <div class="form-field">
            <label for="paymentDueType">Tipo de Fecha de Pago</label>
            <p-select
              id="paymentDueType"
              formControlName="paymentDueType"
              [options]="paymentDueTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona el tipo"
              [fluid]="true"
            />
            @if (cardForm.get('paymentDueType')?.invalid && cardForm.get('paymentDueType')?.touched) {
              <small class="error-text">El tipo de fecha de pago es requerido</small>
            }
          </div>

          <!-- Payment Due Value -->
          <div class="form-field">
            <label for="paymentDueValue">
              {{ paymentDueValueLabel() }}
            </label>
            <p-inputnumber
              id="paymentDueValue"
              formControlName="paymentDueValue"
              [min]="1"
              [max]="31"
              [placeholder]="paymentDueValuePlaceholder()"
              [fluid]="true"
              [showButtons]="true"
            />
            @if (cardForm.get('paymentDueValue')?.invalid && cardForm.get('paymentDueValue')?.touched) {
              <small class="error-text">Este valor es requerido</small>
            }
          </div>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage) {
        <p-message severity="error" [text]="errorMessage" />
      }

      <!-- Actions -->
      <div class="form-actions">
        <p-button
          label="Cancelar"
          severity="secondary"
          [outlined]="true"
          (onClick)="handleCancel()"
        />
        <p-button
          type="submit"
          [label]="isLoading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Guardar')"
          [disabled]="cardForm.invalid || isLoading"
          [loading]="isLoading"
        />
      </div>
    </form>
  `,
  styles: [`
    .card-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-color);
    }

    .error-text {
      color: var(--red-500);
      font-size: 0.8rem;
    }

    .credit-fields {
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem;
      margin-top: 0.5rem;
    }

    .credit-fields h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: var(--primary-color);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .w-full {
      width: 100%;
    }
  `],
})
export class CardFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cardService = inject(CardService);
  private dialogRef = inject(DynamicDialogRef);
  private dialogConfig = inject(DynamicDialogConfig);

  cardForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedType = signal<CardType>(CardType.CREDIT);

  cardTypes = [
    { label: '💳 Crédito', value: CardType.CREDIT },
    { label: '🏧 Débito', value: CardType.DEBIT },
  ];

  networks = [
    { label: 'Visa', value: CardNetwork.VISA },
    { label: 'Mastercard', value: CardNetwork.MASTERCARD },
    { label: 'American Express', value: CardNetwork.AMEX },
    { label: 'Otra', value: CardNetwork.OTHER },
  ];

  paymentDueTypes = [
    { label: 'Día fijo del mes', value: PaymentDueType.FIXED_DAY_OF_MONTH },
    { label: 'Días después del corte', value: PaymentDueType.DAYS_AFTER_CUTOFF },
  ];

  isCreditCard = computed(() => this.selectedType() === CardType.CREDIT);

  paymentDueValueLabel = computed(() => {
    const dueType = this.cardForm?.get('paymentDueType')?.value;
    return dueType === PaymentDueType.DAYS_AFTER_CUTOFF
      ? 'Días después del corte'
      : 'Día de pago del mes';
  });

  paymentDueValuePlaceholder = computed(() => {
    const dueType = this.cardForm?.get('paymentDueType')?.value;
    return dueType === PaymentDueType.DAYS_AFTER_CUTOFF ? '20' : '10';
  });

  get card(): Card | null {
    return this.dialogConfig.data?.card || null;
  }

  get isEditMode(): boolean {
    return !!this.card;
  }

  constructor() {
    this.cardForm = this.fb.group({
      type: [CardType.CREDIT, Validators.required],
      name: ['', Validators.required],
      network: [null],
      last4: [''],
      creditLimit: [null],
      billingCutoffDay: [null],
      paymentDueType: [null],
      paymentDueValue: [null],
    });
  }

  ngOnInit(): void {
    if (this.card) {
      this.selectedType.set(this.card.type);
      this.cardForm.patchValue({
        type: this.card.type,
        name: this.card.name,
        network: this.card.network,
        last4: this.card.last4,
        creditLimit: this.card.creditLimit,
        billingCutoffDay: this.card.billingCutoffDay,
        paymentDueType: this.card.paymentDueType,
        paymentDueValue: this.card.paymentDueValue,
      });
    }

    this.updateCreditValidators();
  }

  onTypeChange(): void {
    const newType = this.cardForm.get('type')?.value;
    this.selectedType.set(newType);
    this.updateCreditValidators();
  }

  private updateCreditValidators(): void {
    const creditFields = ['creditLimit', 'billingCutoffDay', 'paymentDueType', 'paymentDueValue'];

    if (this.isCreditCard()) {
      creditFields.forEach((field) => {
        this.cardForm.get(field)?.setValidators([Validators.required]);
        this.cardForm.get(field)?.updateValueAndValidity();
      });
    } else {
      creditFields.forEach((field) => {
        this.cardForm.get(field)?.clearValidators();
        this.cardForm.get(field)?.setValue(null);
        this.cardForm.get(field)?.updateValueAndValidity();
      });
    }
  }

  handleCancel(): void {
    this.dialogRef.close();
  }

  handleSubmit(): void {
    if (this.cardForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = { ...this.cardForm.value };

      // Remove credit fields for debit cards
      if (formData.type === CardType.DEBIT) {
        delete formData.creditLimit;
        delete formData.billingCutoffDay;
        delete formData.paymentDueType;
        delete formData.paymentDueValue;
      }

      const request$ = this.isEditMode
        ? this.cardService.update(this.card!.id, formData)
        : this.cardService.create(formData);

      request$.subscribe({
        next: (card) => {
          this.isLoading = false;
          this.dialogRef.close(card);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al guardar la tarjeta';
        },
      });
    }
  }
}
