import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { TransactionService } from '../services/transaction.service';
import { CategoryService } from '../../categories/services/category.service';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    SelectButtonModule,
    MessageModule,
  ],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss'],
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(DynamicDialogRef);
  private dialogConfig = inject(DynamicDialogConfig);

  transactionForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  categories = signal<Category[]>([]);

  transactionTypes = [
    { label: '📤 Expense', value: TransactionType.EXPENSE },
    { label: '📥 Income', value: TransactionType.INCOME },
  ];

  filteredCategories = computed(() => {
    const type = this.transactionForm?.get('type')?.value;
    return this.categories().filter((cat) => cat.type === type);
  });

  get transaction(): Transaction | null {
    return this.dialogConfig.data?.transaction || null;
  }

  get isEditMode(): boolean {
    return !!this.transaction;
  }

  constructor() {
    this.transactionForm = this.fb.group({
      type: [TransactionType.EXPENSE, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      categoryId: [null, Validators.required],
      description: ['', Validators.required],
      date: [new Date(), Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();

    if (this.transaction) {
      this.transactionForm.patchValue({
        type: this.transaction.type,
        amount: this.transaction.amount,
        categoryId: this.transaction.categoryId,
        description: this.transaction.description,
        date: new Date(this.transaction.date),
        notes: this.transaction.notes || '',
      });
    }
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  onTypeChange(): void {
    this.transactionForm.patchValue({ categoryId: null });
  }

  handleCancel(): void {
    this.dialogRef.close();
  }

  handleSubmit(): void {
    if (this.transactionForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.transactionForm.value;
      const formData = {
        ...formValue,
        date: formValue.date instanceof Date
          ? formValue.date.toISOString().split('T')[0]
          : formValue.date,
      };

      const request$ = this.isEditMode
        ? this.transactionService.update(this.transaction!.id, formData)
        : this.transactionService.create(formData);

      request$.subscribe({
        next: (transaction) => {
          this.isLoading = false;
          this.dialogRef.close(transaction);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to save transaction';
        },
      });
    }
  }
}
