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
import { CheckboxModule } from 'primeng/checkbox';
import { TransactionService } from '../services/transaction.service';
import { CategoryService } from '../../categories/services/category.service';
import { CardService } from '../../cards/services/card.service';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';
import { Card, CardType } from '../../../core/models/card.model';

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
    CheckboxModule,
  ],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss'],
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private cardService = inject(CardService);
  private dialogRef = inject(DynamicDialogRef);
  private dialogConfig = inject(DynamicDialogConfig);

  transactionForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  categories = signal<Category[]>([]);
  cards = signal<Card[]>([]);
  selectedType = signal<TransactionType>(TransactionType.EXPENSE);
  isCardTransaction = signal(false);

  regularTransactionTypes = [
    { label: '📤 Gasto', value: TransactionType.EXPENSE },
    { label: '📥 Ingreso', value: TransactionType.INCOME },
  ];

  cardTransactionTypes = [
    { label: '🛒 Compra', value: TransactionType.CARD_PURCHASE },
    { label: '💳 Pago', value: TransactionType.CARD_PAYMENT },
  ];

  transactionTypes = computed(() => {
    return this.isCardTransaction() ? this.cardTransactionTypes : this.regularTransactionTypes;
  });

  filteredCategories = computed(() => {
    const type = this.selectedType();
    // Map card transaction types to category types
    let categoryType: string;
    if (type === TransactionType.CARD_PURCHASE || type === TransactionType.EXPENSE) {
      categoryType = 'expense';
    } else {
      categoryType = 'income';
    }
    return this.categories().filter((cat) => cat.type === categoryType);
  });

  get transaction(): Transaction | null {
    return this.dialogConfig.data?.transaction || null;
  }

  get prefilled(): Partial<Transaction> | null {
    return this.dialogConfig.data?.prefilled || null;
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
      cardId: [null],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCards();

    if (this.transaction) {
      this.selectedType.set(this.transaction.type as TransactionType);
      const hasCard = !!this.transaction.cardId;
      this.isCardTransaction.set(hasCard);

      this.transactionForm.patchValue({
        type: this.transaction.type,
        amount: this.transaction.amount,
        categoryId: this.transaction.categoryId,
        description: this.transaction.description,
        date: new Date(this.transaction.date),
        notes: this.transaction.notes || '',
        cardId: this.transaction.cardId || null,
      });
    } else if (this.prefilled) {
      const prefilledType = this.prefilled.type as TransactionType || TransactionType.EXPENSE;
      this.selectedType.set(prefilledType);
      const hasCard = !!this.prefilled.cardId;
      this.isCardTransaction.set(hasCard);

      this.transactionForm.patchValue({
        type: prefilledType,
        amount: this.prefilled.amount || null,
        categoryId: this.prefilled.categoryId || null,
        description: this.prefilled.description || '',
        date: this.prefilled.date ? new Date(this.prefilled.date) : new Date(),
        notes: this.prefilled.notes || '',
        cardId: this.prefilled.cardId || null,
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

  loadCards(): void {
    this.cardService.getAll().subscribe({
      next: (cards) => {
        this.cards.set(cards);
      },
      error: (error) => {
        console.error('Error loading cards:', error);
      },
    });
  }

  onCardTransactionToggle(): void {
    const isCard = this.isCardTransaction();
    if (isCard) {
      // Switch to card transaction type
      this.transactionForm.patchValue({ 
        type: TransactionType.CARD_PURCHASE,
        categoryId: null,
      });
      this.selectedType.set(TransactionType.CARD_PURCHASE);
    } else {
      // Switch to regular transaction type
      this.transactionForm.patchValue({ 
        type: TransactionType.EXPENSE, 
        cardId: null,
        categoryId: null,
      });
      this.selectedType.set(TransactionType.EXPENSE);
    }
  }

  onTypeChange(): void {
    const newType = this.transactionForm.get('type')?.value;
    this.selectedType.set(newType);
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
      const formData: Record<string, unknown> = {
        ...formValue,
        date: formValue.date instanceof Date
          ? formValue.date.toISOString().split('T')[0]
          : formValue.date,
      };

      // Remove cardId if not a card transaction
      if (!this.isCardTransaction()) {
        delete formData['cardId'];
      }

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
