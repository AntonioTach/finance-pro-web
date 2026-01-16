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
import { Transaction, TransactionType, MSI_OPTIONS, MsiOption } from '../../../core/models/transaction.model';
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
  isMsiEnabled = signal(false);
  selectedCardId = signal<string | null>(null);
  currentAmount = signal<number | null>(null);
  currentInstallmentMonths = signal<number | null>(null);
  showMsiSection = false;

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
    // Map card transaction types to category types
    let categoryType: string;
    if (type === TransactionType.CARD_PURCHASE || type === TransactionType.EXPENSE || type === TransactionType.CARD_PAYMENT) {
      categoryType = 'expense';
    } else {
      categoryType = 'income';
    }
    return this.categories().filter((cat) => cat.type === categoryType);
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
    
    console.log('🔍 canUseMsi computed:', {
      isCardTransaction: isCardTrans,
      type,
      isPurchase,
      cardType: card?.type,
      isCreditCard,
      billingCutoffDay: card?.billingCutoffDay,
      hasCutoffDay,
      result,
      fullCard: card
    });
    
    return result;
  });

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

  constructor() {
    this.transactionForm = this.fb.group({
      type: [TransactionType.EXPENSE, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      categoryId: [null, Validators.required],
      description: ['', Validators.required],
      date: [new Date(), Validators.required],
      notes: [''],
      cardId: [null],
      installmentMonths: [null],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCards();

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
        date: new Date(this.transaction.date),
        notes: this.transaction.notes || '',
        cardId: this.transaction.cardId || null,
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
        installmentMonths: null,
      });
      this.selectedType.set(TransactionType.EXPENSE);
      this.selectedCardId.set(null);
      this.isMsiEnabled.set(false);
      this.currentInstallmentMonths.set(null);
    }
    
    // Update MSI section visibility
    this.updateMsiSectionVisibility();
  }

  onTypeChange(): void {
    const newType = this.transactionForm.get('type')?.value;
    this.selectedType.set(newType);
    this.transactionForm.patchValue({ categoryId: null });
    
    // Update MSI section visibility
    this.updateMsiSectionVisibility();
    
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
    console.log('Card changed to:', cardId);
    this.selectedCardId.set(cardId);
    
    // Update MSI section visibility
    this.updateMsiSectionVisibility();
    
    // Reset MSI if the new card doesn't support it
    if (!this.canUseMsi()) {
      this.isMsiEnabled.set(false);
      this.transactionForm.patchValue({ installmentMonths: null });
      this.currentInstallmentMonths.set(null);
    }
  }

  private updateMsiSectionVisibility(): void {
    const canUse = this.canUseMsi();
    this.showMsiSection = canUse;
    console.log('🎯 MSI Section visibility updated:', canUse);
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

  getMsiMonthlyAmount(): number {
    if (!this.transaction?.installmentMonths || !this.transaction?.amount) {
      return 0;
    }
    // The transaction amount is already the monthly payment
    // But if we have the parent transaction, calculate from total
    if (this.transaction.parentTransaction) {
      return this.transaction.parentTransaction.amount / this.transaction.installmentMonths;
    }
    // Otherwise, use the current transaction amount (which is the monthly payment)
    return this.transaction.amount;
  }

  viewMsiGroup(): void {
    if (!this.transaction) return;

    const transactionId = this.transaction.parentTransactionId || this.transaction.id;
    this.isLoading = true;

    this.transactionService.getMsiGroup(transactionId).subscribe({
      next: (msiGroup) => {
        this.isLoading = false;
        // Show dialog with MSI group details
        console.log('MSI Group:', msiGroup);
        
        const totalInstallments = msiGroup.installments.length;
        const totalAmount = msiGroup.parent.amount;
        const monthlyAmount = totalAmount / totalInstallments;
        const completedPayments = msiGroup.installments.filter(i => i.date <= new Date().toISOString().split('T')[0]).length;
        
        alert(`Grupo MSI:\n${totalInstallments} pagos de ${monthlyAmount.toFixed(2)} MXN\nPagos completados: ${completedPayments}\nPagos pendientes: ${totalInstallments - completedPayments}`);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar el grupo MSI';
        console.error('Error loading MSI group:', error);
      },
    });
  }

  cancelMsiGroup(): void {
    if (!this.transaction || !this.transaction.parentTransactionId) return;

    if (!confirm('¿Estás seguro de cancelar todas las parcialidades MSI pendientes? Esta acción no se puede deshacer.')) {
      return;
    }

    this.isLoading = true;
    this.transactionService.cancelMsi(this.transaction.parentTransactionId).subscribe({
      next: (result) => {
        this.isLoading = false;
        alert(`MSI cancelado. Se eliminaron ${result.deletedCount} parcialidades pendientes.`);
        this.dialogRef.close({ cancelled: true });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cancelar MSI';
        console.error('Error cancelling MSI:', error);
      },
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
          ? formValue.date.toISOString().split('T')[0]
          : formValue.date,
      };

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
