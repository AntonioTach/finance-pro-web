import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DebtService } from '../services/debt.service';
import { Debt, CreateDebtDto, DebtDirection } from '../../../core/models/debt.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectButtonModule,
    DatePickerModule,
    TextareaModule,
    TranslatePipe,
  ],
  templateUrl: './debt-form.component.html',
  styleUrls: ['./debt-form.component.scss'],
})
export class DebtFormComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private debtService = inject(DebtService);

  saving = signal(false);
  isEdit = false;
  editId = '';

  startDateObj: Date | null = null;
  dueDateObj: Date | null = null;

  form: CreateDebtDto = {
    direction: 'owed_by_me',
    counterparty: '',
    description: '',
    totalAmount: 0,
    installments: undefined,
    interestRate: undefined,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: undefined,
    notes: undefined,
  };

  directionOptions = [
    { label: 'Yo debo', value: 'owed_by_me' as DebtDirection },
    { label: 'Me deben', value: 'owed_to_me' as DebtDirection },
  ];

  ngOnInit(): void {
    const debt: Debt | undefined = this.config.data?.debt;
    if (debt) {
      this.isEdit = true;
      this.editId = debt.id;
      this.form = {
        direction: debt.direction,
        counterparty: debt.counterparty,
        description: debt.description,
        totalAmount: Number(debt.totalAmount),
        installments: debt.installments ?? undefined,
        interestRate: debt.interestRate ?? undefined,
        startDate: debt.startDate,
        dueDate: debt.dueDate ?? undefined,
        notes: debt.notes ?? undefined,
      };
      this.startDateObj = new Date(debt.startDate + 'T12:00:00');
      if (debt.dueDate) this.dueDateObj = new Date(debt.dueDate + 'T12:00:00');
    } else {
      this.startDateObj = new Date();
    }
  }

  isValid(): boolean {
    return !!(
      this.form.direction &&
      this.form.counterparty?.trim() &&
      this.form.description?.trim() &&
      this.form.totalAmount > 0
    );
  }

  submit(): void {
    if (!this.isValid()) return;

    const dto: CreateDebtDto = {
      ...this.form,
      startDate: this.startDateObj
        ? this.startDateObj.toISOString().split('T')[0]
        : this.form.startDate,
      dueDate: this.dueDateObj
        ? this.dueDateObj.toISOString().split('T')[0]
        : undefined,
      installments: this.form.installments || undefined,
      interestRate: this.form.interestRate ?? undefined,
    };

    this.saving.set(true);
    const obs = this.isEdit
      ? this.debtService.update(this.editId, dto)
      : this.debtService.create(dto);

    obs.subscribe({
      next: (debt) => {
        this.saving.set(false);
        this.ref.close(debt);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.ref.close();
  }
}
