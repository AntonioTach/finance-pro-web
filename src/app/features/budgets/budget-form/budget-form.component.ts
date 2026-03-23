import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { BudgetService } from '../services/budget.service';
import {
  BudgetPeriod,
  BudgetAmountType,
  BudgetProgress,
  BudgetSuggestion,
  CreateBudgetDto,
} from '../../../core/models/budget.model';
import { Category } from '../../../core/models/category.model';
import { ApiService } from '../../../core/services/api.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { CategoryIconComponent } from '../../../shared/components/category-icon/category-icon.component';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    CheckboxModule,
    TranslatePipe,
    CurrencyFormatPipe,
    CategoryIconComponent,
  ],
  template: `
    <div class="budget-form">
      <!-- Category -->
      <div class="form-field">
        <label>{{ 'budgets.form.category' | translate }} *</label>
        <p-select
          [options]="categories()"
          [(ngModel)]="form.categoryId"
          optionLabel="name"
          optionValue="id"
          [placeholder]="'budgets.form.category' | translate"
          [filter]="true"
          filterBy="name"
          (onChange)="onCategoryChange()"
          styleClass="w-full"
        >
          <ng-template #item let-cat>
            <div class="cat-option">
              <span class="cat-dot" [style.background]="cat.color"></span>
              <app-cat-icon [icon]="cat.icon" />
              {{ cat.name }}
            </div>
          </ng-template>
        </p-select>

        @if (suggestion()) {
          <div class="suggestion-banner">
            <i class="pi pi-lightbulb"></i>
            <span>{{ suggestionText() }}</span>
            <button class="use-suggestion-btn" (click)="useSuggestion()">
              {{ 'budgets.form.useSuggestion' | translate }}
            </button>
          </div>
        }
      </div>

      <!-- Name -->
      <div class="form-field">
        <label>{{ 'budgets.form.name' | translate }}</label>
        <input
          pInputText
          [(ngModel)]="form.name"
          [placeholder]="'budgets.form.namePlaceholder' | translate"
          class="w-full"
        />
      </div>

      <!-- Amount -->
      <div class="form-row">
        <div class="form-field flex-1">
          <label>{{ 'budgets.form.amount' | translate }} *</label>
          <p-inputnumber
            [(ngModel)]="form.amount"
            [min]="0.01"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
            styleClass="w-full"
          />
        </div>
        <div class="form-field" style="min-width: 160px">
          <label>{{ 'budgets.form.period' | translate }} *</label>
          <p-select
            [options]="periodOptions"
            [(ngModel)]="form.period"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
          />
        </div>
      </div>

      <!-- Date range (only for custom period) -->
      <div class="form-row">
        <div class="form-field flex-1">
          <label>{{ 'budgets.form.startDate' | translate }} *</label>
          <p-datepicker
            [(ngModel)]="startDateObj"
            dateFormat="dd/mm/yy"
            styleClass="w-full"
          />
        </div>
        @if (form.period === 'custom') {
          <div class="form-field flex-1">
            <label>{{ 'budgets.form.endDate' | translate }} *</label>
            <p-datepicker
              [(ngModel)]="endDateObj"
              dateFormat="dd/mm/yy"
              [minDate]="startDateObj"
              styleClass="w-full"
            />
          </div>
        }
      </div>

      <!-- Alert threshold -->
      <div class="form-field">
        <label>{{ 'budgets.form.alertThreshold' | translate }}</label>
        <div class="threshold-row">
          <p-inputnumber
            [(ngModel)]="form.alertThreshold"
            [min]="10" [max]="100" [step]="5"
            suffix="%"
            styleClass="threshold-input"
          />
          <div class="threshold-hints-inline">
            <button class="threshold-btn" (click)="form.alertThreshold = 50" [class.active]="form.alertThreshold === 50">50%</button>
            <button class="threshold-btn" (click)="form.alertThreshold = 75" [class.active]="form.alertThreshold === 75">75%</button>
            <button class="threshold-btn" (click)="form.alertThreshold = 80" [class.active]="form.alertThreshold === 80">80%</button>
            <button class="threshold-btn" (click)="form.alertThreshold = 90" [class.active]="form.alertThreshold === 90">90%</button>
          </div>
        </div>
      </div>

      <!-- Toggles -->
      <div class="toggles-row">
        <div class="toggle-item">
          <p-checkbox [(ngModel)]="form.autoRenew" [binary]="true" inputId="autoRenew" />
          <label for="autoRenew">{{ 'budgets.form.autoRenew' | translate }}</label>
        </div>
        <div class="toggle-item">
          <p-checkbox [(ngModel)]="form.rolloverEnabled" [binary]="true" inputId="rollover" />
          <label for="rollover">{{ 'budgets.form.rollover' | translate }}</label>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-field">
        <label>{{ 'budgets.form.notes' | translate }}</label>
        <textarea
          pTextarea
          [(ngModel)]="form.notes"
          rows="2"
          class="w-full"
          style="resize: vertical"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <p-button
          [label]="'common.cancel' | translate"
          severity="secondary"
          [text]="true"
          (onClick)="cancel()"
        />
        <p-button
          [label]="'common.save' | translate"
          [loading]="saving()"
          [disabled]="!isValid()"
          (onClick)="submit()"
        />
      </div>
    </div>
  `,
  styles: [`
    .budget-form { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem 0; }

    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .flex-1 { flex: 1; min-width: 140px; }
    .w-full { width: 100%; }

    .cat-option { display: flex; align-items: center; gap: 0.5rem; }
    .cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .suggestion-banner {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 0.875rem;
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 10px;
      font-size: 0.8rem; color: var(--text-secondary);
      flex-wrap: wrap;
    }
    .suggestion-banner i { color: var(--primary-color); flex-shrink: 0; }
    .use-suggestion-btn {
      margin-left: auto; background: none; border: none; cursor: pointer;
      font-size: 0.8rem; font-weight: 700; color: var(--primary-color);
      padding: 0; text-decoration: underline;
    }

    .threshold-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .threshold-input { width: 100px !important; }
    .threshold-hints-inline { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .threshold-btn {
      padding: 0.25rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-color);
      background: var(--bg-secondary); cursor: pointer; font-size: 0.75rem; font-weight: 600;
      color: var(--text-muted); transition: all 0.15s;
    }
    .threshold-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .threshold-btn.active { background: var(--primary-subtle, rgba(99,102,241,0.1)); border-color: var(--primary-color); color: var(--primary-color); }

    .toggles-row { display: flex; flex-direction: column; gap: 0.75rem; }
    .toggle-item { display: flex; align-items: center; gap: 0.75rem; }
    .toggle-item label { font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding-top: 0.5rem; border-top: 1px solid var(--border-color);
      margin-top: 0.25rem;
    }
  `],
})
export class BudgetFormComponent implements OnInit {
  private ref    = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private budgetService  = inject(BudgetService);
  private api    = inject(ApiService);
  private i18n   = inject(TranslationService);

  saving      = signal(false);
  categories  = signal<Category[]>([]);
  suggestions = signal<BudgetSuggestion[]>([]);
  suggestion  = signal<BudgetSuggestion | null>(null);

  isEdit  = false;
  editId  = '';
  currency: string = 'MXN';

  startDateObj: Date = new Date();
  endDateObj:   Date | null = null;

  form: CreateBudgetDto = {
    categoryId:     '',
    name:           '',
    amount:         0,
    amountType:     BudgetAmountType.FIXED,
    period:         BudgetPeriod.MONTHLY,
    startDate:      new Date().toISOString().split('T')[0],
    alertThreshold: 80,
    rolloverEnabled: false,
    autoRenew:      true,
    notes:          '',
  };

  periodOptions = [
    { label: 'Semanal',       value: BudgetPeriod.WEEKLY    },
    { label: 'Quincenal',     value: BudgetPeriod.BIWEEKLY  },
    { label: 'Mensual',       value: BudgetPeriod.MONTHLY   },
    { label: 'Anual',         value: BudgetPeriod.YEARLY    },
    { label: 'Personalizado', value: BudgetPeriod.CUSTOM    },
  ];

  ngOnInit(): void {
    const progress: BudgetProgress | undefined = this.config.data?.progress;
    this.currency = this.config.data?.currency ?? 'MXN';

    if (progress) {
      this.isEdit = true;
      this.editId = progress.budget.id;
      this.form = {
        categoryId:     progress.budget.category?.id ?? '',
        name:           progress.budget.name ?? '',
        amount:         progress.budget.baseAmount,
        amountType:     BudgetAmountType.FIXED,
        period:         progress.budget.period,
        startDate:      progress.budget.periodStart?.toString().split('T')[0] ?? new Date().toISOString().split('T')[0],
        alertThreshold: progress.budget.alertThreshold,
        rolloverEnabled: progress.budget.rolloverEnabled,
        autoRenew:      progress.budget.autoRenew,
        notes:          progress.budget.notes ?? '',
      };
      this.startDateObj = new Date(this.form.startDate + 'T12:00:00');
    } else {
      // Default start = first day of current month
      const now = new Date();
      this.startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    this.loadCategories();
    this.loadSuggestions();
  }

  loadCategories(): void {
    this.api.get<Category[]>('/categories').subscribe({
      next: (cats) => this.categories.set(cats.filter(c => c.type === 'expense')),
    });
  }

  loadSuggestions(): void {
    this.budgetService.getSuggestions().subscribe({
      next: (s) => this.suggestions.set(s),
    });
  }

  onCategoryChange(): void {
    const found = this.suggestions().find(s => s.categoryId === this.form.categoryId);
    this.suggestion.set(found ?? null);
  }

  useSuggestion(): void {
    if (this.suggestion()) {
      this.form.amount = this.suggestion()!.monthlyAverage;
    }
  }

  isValid(): boolean {
    const hasEnd = this.form.period !== BudgetPeriod.CUSTOM || !!this.endDateObj;
    return !!(
      this.form.categoryId &&
      this.form.amount > 0 &&
      this.form.period &&
      this.startDateObj &&
      hasEnd
    );
  }

  submit(): void {
    if (!this.isValid()) return;
    this.saving.set(true);

    const dto: CreateBudgetDto = {
      ...this.form,
      name: this.form.name?.trim() || undefined,
      notes: this.form.notes?.trim() || undefined,
      startDate: this.startDateObj.toISOString().split('T')[0],
      endDate: this.endDateObj ? this.endDateObj.toISOString().split('T')[0] : undefined,
    };

    const obs = this.isEdit
      ? this.budgetService.update(this.editId, dto)
      : this.budgetService.create(dto);

    obs.subscribe({
      next: (budget) => { this.saving.set(false); this.ref.close(budget); },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void { this.ref.close(); }

  suggestionText(): string {
    const s = this.suggestion();
    if (!s) return '';
    const tpl = this.i18n.t('budgets.form.suggestion');
    return tpl.replace('{amount}', this.formatAmount(s.monthlyAverage));
  }

  formatAmount(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: this.currency }).format(n);
  }
}
