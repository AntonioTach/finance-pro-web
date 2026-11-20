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
import { Transaction, TransactionType, MSI_OPTIONS } from '../../../core/models/transaction.model';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Card, CardType } from '../../../core/models/card.model';
import { CategorySelectComponent } from '../../../shared/components/category-select/category-select.component';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { MsiScheduleDialogComponent, MsiScheduleDialogResult } from '../../msi/components/msi-schedule-dialog/msi-schedule-dialog.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { AccountService } from '../../accounts/services/account.service';
import { Account } from '../../../core/models/account.model';
import { CardSummary } from '../../../core/models/card.model';
import { TranslationService } from '../../../core/services/translation.service';
import { toLocalDateStr } from '../../../shared/utils/date.util';

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
    CategorySelectComponent,
    CurrencyFormatPipe,
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
  private appDialogService = inject(AppDialogService);
  private accountService = inject(AccountService);
  private ts = inject(TranslationService);

  transactionForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  categories = signal<Category[]>([]);
  cards = signal<Card[]>([]);
  accounts = signal<Account[]>([]);
  cardSummaries = signal<CardSummary[]>([]);
  selectedAccountId = signal<string | null>(null);
  selectedDate = signal<Date | null>(new Date());
  selectedType = signal<TransactionType>(TransactionType.EXPENSE);
  isCardTransaction = signal(false);
  isMsiEnabled = signal(false);
  selectedCardId = signal<string | null>(null);
  currentAmount = signal<number | null>(null);
  currentInstallmentMonths = signal<number | null>(null);

  msiOptions = MSI_OPTIONS.map((months) => ({
    label: `${months} meses`,
    value: months,
  }));

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
    const categoryType =
      type === TransactionType.CARD_PURCHASE ||
      type === TransactionType.EXPENSE ||
      type === TransactionType.CARD_PAYMENT
        ? 'expense'
        : 'income';
    return this.categories().filter((cat) => cat.type === categoryType);
  });

  activeCategoryType = computed<CategoryType>(() => {
    const type = this.selectedType();
    return type === TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
  });

  /** Income, expense and card payments move money in/out of an account; card purchases don't
   * (credit) or use the card's own account (debit). */
  showAccountSelect = computed(() => this.selectedType() !== TransactionType.CARD_PURCHASE);

  /** Warns when the movement is dated before the last balance check: it will not move the balance.
   *  Same-day movements logged after the check do count, so they don't warn. */
  reconciliationWarning = computed<string | null>(() => {
    const date = this.selectedDate();
    if (!date) return null;
    const day = toLocalDateStr(this.toLocalMidnight(date));

    let name: string | null = null;
    let last: string | null = null;
    if (this.showAccountSelect()) {
      const acc = this.accounts().find((a) => a.id === this.selectedAccountId());
      name = acc?.name ?? null;
      last = acc?.lastReconciliation?.date ?? null;
    } else {
      const card = this.selectedCard();
      if (card?.type === CardType.DEBIT) {
        const acc = this.accounts().find((a) => a.id === card.accountId);
        name = acc?.name ?? null;
        last = acc?.lastReconciliation?.date ?? null;
      } else if (card) {
        name = card.name;
        last = this.cardSummaries().find((s) => s.cardId === card.id)?.lastReconciliationDate ?? null;
      }
    }

    if (!name || !last || day >= last) return null;
    const [y, m, d] = last.split('-');
    return this.ts.t('transactions.form.beforeReconciliation')
      .replace('{name}', name)
      .replace('{date}', `${d}/${m}/${y}`);
  });

  selectedCard = computed(() => {
    const cardId = this.selectedCardId();
    return this.cards().find((c) => c.id === cardId) ?? null;
  });

  canUseMsi = computed(() => {
    const card = this.selectedCard();
    const type = this.selectedType();
    const isCardTrans = this.isCardTransaction();
    const isPurchase = type === TransactionType.CARD_PURCHASE;
    const isCreditCard = card?.type === CardType.CREDIT;
    const hasCutoffDay = !!card?.billingCutoffDay;
    
    const result = isCardTrans && isPurchase && isCreditCard && hasCutoffDay;
    
    return result;
  });

  /** MSI is toggled on but no term has been picked yet — block submit so a
   * "forgot to pick a term" purchase doesn't silently save as a regular one. */
  msiSelectionIncomplete = computed(() => this.isMsiEnabled() && !this.currentInstallmentMonths());

  monthlyPaymentAmount = computed(() => {
    const amount = this.currentAmount();
    const installmentMonths = this.currentInstallmentMonths();
    if (!amount || !installmentMonths || !this.isMsiEnabled()) {
      return null;
    }
    return amount / installmentMonths;
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

  get isMsiTransaction(): boolean {
    return !!(this.transaction?.installmentMonths && this.transaction.installmentMonths > 0);
  }

  private toLocalMidnight(value: unknown): Date {
    if (!value) return new Date();
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    return new Date(String(value).substring(0, 10) + 'T00:00:00');
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
      accountId: [null],
      installmentMonths: [null],
    });

    this.transactionForm.get('accountId')!.valueChanges.subscribe((v) => this.selectedAccountId.set(v));
    this.transactionForm.get('date')!.valueChanges.subscribe((v) => this.selectedDate.set(v));
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCards();
    this.loadAccounts();

    if (this.transaction) {
      this.selectedType.set(this.transaction.type as TransactionType);
      const hasCard = !!this.transaction.cardId;
      this.isCardTransaction.set(hasCard);
      this.selectedCardId.set(this.transaction.cardId || null);
      this.currentAmount.set(this.transaction.amount);

      this.transactionForm.patchValue({
        type: this.transaction.type,
        amount: this.transaction.amount,
        categoryId: this.transaction.categoryId,
        description: this.transaction.description,
        date: this.toLocalMidnight(this.transaction.date),
        notes: this.transaction.notes || '',
        cardId: this.transaction.cardId || null,
        accountId: this.transaction.accountId || null,
      });

      // Disable amount field for MSI transactions
      if (this.isMsiTransaction) {
        this.transactionForm.get('amount')?.disable();
        this.transactionForm.get('type')?.disable();
        this.transactionForm.get('cardId')?.disable();
      }
    } else if (this.prefilled) {
      const prefilledType = this.prefilled.type as TransactionType || TransactionType.EXPENSE;
      this.selectedType.set(prefilledType);
      const hasCard = !!this.prefilled.cardId;
      this.isCardTransaction.set(hasCard);
      this.selectedCardId.set(this.prefilled.cardId || null);
      this.currentAmount.set(this.prefilled.amount || null);

      this.transactionForm.patchValue({
        type: prefilledType,
        amount: this.prefilled.amount || null,
        categoryId: this.prefilled.categoryId || null,
        description: this.prefilled.description || '',
        date: this.toLocalMidnight(this.prefilled.date),
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

  loadAccounts(): void {
    this.accountService.getAll().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        // New movements default to the user's default account.
        if (!this.transactionForm.get('accountId')?.value) {
          const def = accounts.find((a) => a.isDefault) ?? accounts[0];
          if (def) this.transactionForm.patchValue({ accountId: def.id });
        }
      },
    });
    this.cardService.getAllSummaries().subscribe({
      next: (summaries) => this.cardSummaries.set(summaries),
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
        installmentMonths: null,
      });
      this.selectedType.set(TransactionType.EXPENSE);
      this.selectedCardId.set(null);
      this.isMsiEnabled.set(false);
      this.currentInstallmentMonths.set(null);
    }
  }

  onTypeChange(): void {
    const newType = this.transactionForm.get('type')?.value;
    this.selectedType.set(newType);
    this.transactionForm.patchValue({ categoryId: null });

    // Disable MSI if not a card purchase
    if (newType !== TransactionType.CARD_PURCHASE) {
      this.isMsiEnabled.set(false);
      this.transactionForm.patchValue({ installmentMonths: null });
      this.currentInstallmentMonths.set(null);
    }
  }

  onMsiToggle(): void {
    const isEnabled = this.isMsiEnabled();
    if (!isEnabled) {
      this.transactionForm.patchValue({ installmentMonths: null });
      this.currentInstallmentMonths.set(null);
    }
  }

  onCardChange(): void {
    // Update the signal with the new card ID
    const cardId = this.transactionForm.get('cardId')?.value;
    this.selectedCardId.set(cardId);

    // Reset MSI if the new card doesn't support it
    if (!this.canUseMsi()) {
      this.isMsiEnabled.set(false);
      this.transactionForm.patchValue({ installmentMonths: null });
      this.currentInstallmentMonths.set(null);
    }
  }

  onAmountChange(): void {
    const amount = this.transactionForm.get('amount')?.value;
    this.currentAmount.set(amount);
  }

  onInstallmentMonthsChange(): void {
    const months = this.transactionForm.get('installmentMonths')?.value;
    this.currentInstallmentMonths.set(months);
  }

  handleCancel(): void {
    this.dialogRef.close();
  }

  /** Opens the shared MSI schedule dialog (view + cancel). If the user
   * cancels the MSI from there, this form closes too, since the
   * transaction it was editing may no longer exist as-is. */
  viewMsiSchedule(): void {
    if (!this.transaction) return;

    const transactionId = this.transaction.parentTransactionId || this.transaction.id;
    const ref = this.appDialogService.open<MsiScheduleDialogResult>(MsiScheduleDialogComponent, {
      header: 'Calendario de pagos MSI',
      width: '480px',
      data: { transactionId },
    });

    ref.onClose.subscribe((result) => {
      if (result?.cancelled) {
        this.dialogRef.close({ cancelled: true, deletedCount: result.deletedCount });
      }
    });
  }

  handleSubmit(): void {
    if (this.transactionForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.transactionForm.value;
      const formData: Record<string, unknown> = {
        ...formValue,
        date: formValue.date instanceof Date
          ? toLocalDateStr(formValue.date)
          : formValue.date,
      };

      // Card purchases never carry an account from the client: the API
      // assigns the debit card's account (or none for credit cards).
      if (!this.showAccountSelect() || !formData['accountId']) {
        delete formData['accountId'];
      }

      // Remove cardId if not a card transaction
      if (!this.isCardTransaction()) {
        delete formData['cardId'];
      }

      // Remove installmentMonths if MSI is not enabled
      if (!this.isMsiEnabled() || !formData['installmentMonths']) {
        delete formData['installmentMonths'];
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
