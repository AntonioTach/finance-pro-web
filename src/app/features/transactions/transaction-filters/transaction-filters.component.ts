import { Component, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CategoryService } from '../../categories/services/category.service';
import { CardService } from '../../cards/services/card.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { Category } from '../../../core/models/category.model';
import { Card } from '../../../core/models/card.model';
import { TransactionType } from '../../../core/models/transaction.model';
import { AnalyticsFilters } from '../models/transaction-list-filters.model';
import { format } from 'date-fns';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-transaction-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    InputNumberModule,
    TranslatePipe,
  ],
  templateUrl: './transaction-filters.component.html',
  styleUrls: ['./transaction-filters.component.scss'],
})
export class TransactionFiltersComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private cardService = inject(CardService);
  private authService = inject(AuthService);
  private ts = inject(TranslationService);

  filtersChange = output<Partial<AnalyticsFilters>>();

  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  categories = signal<Category[]>([]);
  cards = signal<Card[]>([]);

  categoryOptions = computed<SelectOption[]>(() =>
    this.categories().map((c) => ({ label: c.name, value: c.id })),
  );
  cardOptions = computed<SelectOption[]>(() =>
    this.cards().map((c) => ({ label: c.name, value: c.id })),
  );
  typeOptions: SelectOption[] = [
    { label: this.ts.t('transactions.type.income'), value: TransactionType.INCOME },
    { label: this.ts.t('transactions.type.expense'), value: TransactionType.EXPENSE },
    { label: this.ts.t('transactions.type.card_purchase'), value: TransactionType.CARD_PURCHASE },
    { label: this.ts.t('transactions.type.card_payment'), value: TransactionType.CARD_PAYMENT },
  ];

  // Local state — search is debounced before it ever reaches filtersChange;
  // every other control fires immediately since it isn't keystroke-driven.
  searchTerm = signal('');
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  selectedType = signal<TransactionType | null>(null);
  selectedCategoryId = signal<string | null>(null);
  selectedCardId = signal<string | null>(null);
  minAmount = signal<number | null>(null);
  maxAmount = signal<number | null>(null);

  constructor() {
    toObservable(this.searchTerm)
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((search) => this.emitChange({ search: search.trim() || undefined }));
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Error loading categories:', err),
    });
    this.cardService.getAll().subscribe({
      next: (cards) => this.cards.set(cards),
      error: (err) => console.error('Error loading cards:', err),
    });
  }

  onDateChange(): void {
    this.emitChange({
      startDate: this.startDate() ? format(this.startDate()!, 'yyyy-MM-dd') : undefined,
      endDate: this.endDate() ? format(this.endDate()!, 'yyyy-MM-dd') : undefined,
    });
  }

  onTypeChange(): void {
    this.emitChange({ type: this.selectedType() ?? undefined });
  }

  onCategoryChange(): void {
    this.emitChange({ categoryId: this.selectedCategoryId() ?? undefined });
  }

  onCardChange(): void {
    this.emitChange({ cardId: this.selectedCardId() ?? undefined });
  }

  onAmountChange(): void {
    this.emitChange({
      minAmount: this.minAmount() ?? undefined,
      maxAmount: this.maxAmount() ?? undefined,
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.startDate.set(null);
    this.endDate.set(null);
    this.selectedType.set(null);
    this.selectedCategoryId.set(null);
    this.selectedCardId.set(null);
    this.minAmount.set(null);
    this.maxAmount.set(null);
    this.filtersChange.emit({
      search: undefined,
      startDate: undefined,
      endDate: undefined,
      type: undefined,
      categoryId: undefined,
      cardId: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    });
  }

  private emitChange(partial: Partial<AnalyticsFilters>): void {
    this.filtersChange.emit(partial);
  }
}
