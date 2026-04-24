import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DebtService } from '../services/debt.service';
import { CategoryService } from '../../categories/services/category.service';
import { Debt, CreateDebtPaymentDto } from '../../../core/models/debt.model';
import { Category, CategoryType } from '../../../core/models/category.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    TranslatePipe,
    CurrencyFormatPipe,
  ],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
})
export class PaymentFormComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private debtService = inject(DebtService);
  private categoryService = inject(CategoryService);

  saving = signal(false);
  categories = signal<Category[]>([]);
  createTransaction = true;

  debt!: Debt;
  currency = 'MXN';
  paidAmount = 0;
  remaining = 0;

  paymentDateObj: Date = new Date();

  dto: CreateDebtPaymentDto = {
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    installmentNumber: undefined,
    notes: undefined,
  };

  ngOnInit(): void {
    this.debt = this.config.data.debt as Debt;
    this.currency = this.config.data.currency ?? 'MXN';
    this.paidAmount = this.debt.payments.reduce((s, p) => s + Number(p.amount), 0);
    this.remaining = Math.max(0, Number(this.debt.totalAmount) - this.paidAmount);

    if (this.debt.installments) {
      this.dto.installmentNumber = this.debt.payments.length + 1;
    }
    this.dto.amount = this.remaining;

    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        const neededType = this.debt.direction === 'owed_by_me'
          ? CategoryType.EXPENSE
          : CategoryType.INCOME;
        this.categories.set(cats.filter(c => c.type === neededType));
      },
    });
  }

  isValid(): boolean {
    const categoryOk = !this.createTransaction || !!this.dto.categoryId;
    return this.dto.amount > 0 && !!this.paymentDateObj && categoryOk;
  }

  submit(): void {
    if (!this.isValid()) return;
    const payload: CreateDebtPaymentDto = {
      ...this.dto,
      paymentDate: this.paymentDateObj.toISOString().split('T')[0],
      categoryId: this.createTransaction ? this.dto.categoryId : undefined,
      createTransaction: this.createTransaction,
    };
    this.saving.set(true);
    this.debtService.addPayment(this.debt.id, payload).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.ref.close(updated);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.ref.close();
  }
}
