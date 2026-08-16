import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CategoryService } from '../services/category.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { Category, CategoryType, GROUP_ICONS } from '../../../core/models/category.model';

interface CategoryGroup {
  name: string;
  icon: string;
  categories: Category[];
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    TabsModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ColorPickerModule,
    ConfirmDialogModule,
    LoadingSpinnerComponent,
    TranslatePipe,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="cat-page">
      <!-- Header -->
      <div class="cat-header">
        <div class="cat-header-left">
          <h1>{{ 'categories.title' | translate }}</h1>
          <p class="cat-subtitle">{{ subtitle() }}</p>
        </div>
        <div class="cat-header-actions">
          <span class="p-input-icon-left search-wrap">
            <i class="pi pi-search"></i>
            <input
              pInputText
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              [placeholder]="'categories.search' | translate"
              class="search-input"
            />
          </span>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-wrap"><app-loading-spinner /></div>
      } @else {
        <p-tabs [(value)]="activeTab">
          <p-tablist>
            <p-tab value="expense">
              <span class="tab-label">
                <span class="tab-dot expense-dot"></span>
                {{ 'categories.tabs.expense' | translate }}
                <span class="tab-badge">{{ expenseCategories().length }}</span>
              </span>
            </p-tab>
            <p-tab value="income">
              <span class="tab-label">
                <span class="tab-dot income-dot"></span>
                {{ 'categories.tabs.income' | translate }}
                <span class="tab-badge">{{ incomeCategories().length }}</span>
              </span>
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- GASTOS -->
            <p-tabpanel value="expense">
              @if (filteredExpenseGroups().length === 0) {
                <div class="empty-state">
                  <span class="empty-icon">🔍</span>
                  <p>{{ 'categories.empty' | translate }}</p>
                </div>
              }
              @for (group of filteredExpenseGroups(); track group.name) {
                <div class="cat-group">
                  <div class="cat-group-header">
                    <span class="cat-group-icon">{{ group.icon }}</span>
                    <span class="cat-group-name">{{ group.name }}</span>
                    <span class="cat-group-count">{{ group.categories.length }}</span>
                  </div>
                  <div class="cat-grid">
                    @for (cat of group.categories; track cat.id) {
                      <div class="cat-card" [style.--cat-color]="cat.color">
                        <div class="cat-card-color-bar"></div>
                        <div class="cat-card-body">
                          <span class="cat-card-icon">{{ cat.icon }}</span>
                          <div class="cat-card-info">
                            <span class="cat-card-name">{{ cat.name }}</span>
                          </div>
                        </div>
                        @if (!cat.isDefault) {
                          <div class="cat-card-actions">
                            <button class="cat-action-btn cat-action-btn--danger" (click)="confirmDelete(cat)" [title]="'common.delete' | translate">
                              <i class="pi pi-trash"></i>
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </p-tabpanel>

            <!-- INGRESOS -->
            <p-tabpanel value="income">
              @if (filteredIncomeGroups().length === 0) {
                <div class="empty-state">
                  <span class="empty-icon">🔍</span>
                  <p>{{ 'categories.empty' | translate }}</p>
                </div>
              }
              @for (group of filteredIncomeGroups(); track group.name) {
                <div class="cat-group">
                  <div class="cat-group-header">
                    <span class="cat-group-icon">{{ group.icon }}</span>
                    <span class="cat-group-name">{{ group.name }}</span>
                    <span class="cat-group-count">{{ group.categories.length }}</span>
                  </div>
                  <div class="cat-grid">
                    @for (cat of group.categories; track cat.id) {
                      <div class="cat-card" [style.--cat-color]="cat.color">
                        <div class="cat-card-color-bar"></div>
                        <div class="cat-card-body">
                          <span class="cat-card-icon">{{ cat.icon }}</span>
                          <div class="cat-card-info">
                            <span class="cat-card-name">{{ cat.name }}</span>
                          </div>
                        </div>
                        @if (!cat.isDefault) {
                          <div class="cat-card-actions">
                            <button class="cat-action-btn cat-action-btn--danger" (click)="confirmDelete(cat)" [title]="'common.delete' | translate">
                              <i class="pi pi-trash"></i>
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      }
    </div>

    <!-- Create / Edit dialog -->
    <p-dialog
      [(visible)]="showDialog"
      [header]="(editingCategory() ? 'categories.dialog.edit' : 'categories.dialog.create') | translate"
      [modal]="true"
      [style]="{ width: '420px' }"
      [draggable]="false"
    >
      <div class="dialog-form">
        <div class="form-field">
          <label>{{ 'categories.form.name' | translate }} *</label>
          <input
            pInputText
            [(ngModel)]="form.name"
            [placeholder]="'categories.form.namePlaceholder' | translate"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label>{{ 'categories.form.type' | translate }} *</label>
          <p-select
            [(ngModel)]="form.type"
            [options]="typeOptions"
            optionLabel="label"
            optionValue="value"
            [fluid]="true"
          />
        </div>

        <div class="form-field">
          <label>{{ 'categories.form.group' | translate }}</label>
          <input
            pInputText
            [(ngModel)]="form.group"
            [placeholder]="'categories.form.groupPlaceholder' | translate"
            class="w-full"
          />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>{{ 'categories.form.icon' | translate }} *</label>
            <input
              pInputText
              [(ngModel)]="form.icon"
              [placeholder]="'categories.form.iconPlaceholder' | translate"
              class="w-full icon-input"
            />
          </div>
          <div class="form-field">
            <label>{{ 'categories.form.color' | translate }} *</label>
            <div class="color-field">
              <p-colorpicker [(ngModel)]="form.colorHex" format="hex" />
              <span class="color-preview" [style.background]="'#' + form.colorHex"></span>
            </div>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <p-button [label]="'common.cancel' | translate" severity="secondary" [outlined]="true" (onClick)="closeDialog()" />
        <p-button
          [label]="(editingCategory() ? 'common.save' : 'common.add') | translate"
          [loading]="isSaving()"
          [disabled]="!isFormValid()"
          (onClick)="saveCategory()"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .cat-page { padding: 1.5rem; }

    .cat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .cat-header h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
    .cat-subtitle { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.875rem; }

    .cat-header-actions { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }

    .search-wrap { position: relative; display: inline-flex; align-items: center; }
    .search-wrap i { position: absolute; left: 0.75rem; color: var(--text-color-secondary); z-index: 1; }
    .search-input { padding-left: 2.2rem; width: 220px; }

    .loading-wrap { display: flex; justify-content: center; padding: 3rem; }

    .tab-label { display: flex; align-items: center; gap: 0.5rem; }
    .tab-dot { width: 8px; height: 8px; border-radius: 50%; }
    .expense-dot { background: var(--red-400, #f87171); }
    .income-dot { background: var(--green-400, #4ade80); }
    .tab-badge {
      background: var(--surface-200, rgba(0,0,0,.08));
      border-radius: 10px;
      padding: 0 7px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.6;
    }

    .cat-group { margin-bottom: 2rem; }

    .cat-group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .cat-group-icon { font-size: 1.1rem; }
    .cat-group-name { font-weight: 700; font-size: 0.95rem; flex: 1; }
    .cat-group-count {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      background: var(--surface-100, rgba(0,0,0,.05));
      border-radius: 10px;
      padding: 1px 8px;
    }

    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .cat-card {
      background: var(--surface-card);
      border-radius: var(--border-radius, 8px);
      border-left: 4px solid var(--cat-color, #ccc);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,.1));
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.15s, box-shadow 0.15s;
      position: relative;
      overflow: hidden;
    }

    .cat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,.15));
    }

    .cat-card:hover .cat-card-actions { opacity: 1; }

    .cat-card-color-bar {
      position: absolute;
      top: 0; right: 0;
      width: 3px; height: 100%;
      background: var(--cat-color);
      opacity: 0.3;
    }

    .cat-card-body { display: flex; align-items: center; gap: 0.625rem; flex: 1; min-width: 0; }

    .cat-card-icon { font-size: 1.5rem; flex-shrink: 0; }

    .cat-card-info { display: flex; flex-direction: column; min-width: 0; }

    .cat-card-name {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cat-badge-default {
      font-size: 0.65rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .cat-card-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }

    .cat-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: background 0.15s, color 0.15s;
    }

    .cat-action-btn:hover { background: var(--surface-200); color: var(--text-color); }
    .cat-action-btn--danger:hover { background: var(--red-100, rgba(239,68,68,.12)); color: var(--red-500, #ef4444); }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-color-secondary);
    }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }

    /* Dialog form */
    .dialog-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-field label { font-weight: 500; font-size: 0.875rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .icon-input { font-size: 1.25rem; text-align: center; }
    .color-field { display: flex; align-items: center; gap: 0.75rem; }
    .color-preview { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--surface-border); }
    .w-full { width: 100%; }
  `],
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private messageService  = inject(MessageService);
  private confirmService  = inject(ConfirmationService);
  private ts              = inject(TranslationService);

  isLoading  = signal(false);
  isSaving   = signal(false);
  categories = signal<Category[]>([]);
  showDialog = false;
  activeTab  = 'expense';
  searchQuery = signal('');
  editingCat = signal<Category | null>(null);

  form = {
    name:     '',
    type:     CategoryType.EXPENSE as CategoryType,
    icon:     '',
    colorHex: 'A29BFE',
    group:    '',
  };

  get typeOptions() {
    return [
      { label: `📤 ${this.ts.t('categories.tabs.expense')}`, value: CategoryType.EXPENSE },
      { label: `📥 ${this.ts.t('categories.tabs.income')}`,  value: CategoryType.INCOME  },
    ];
  }

  editingCategory = computed(() => this.editingCat());
  totalCount      = computed(() => this.categories().length);

  subtitle = computed(() =>
    `${this.totalCount()} ${this.ts.t('categories.unit')} · ` +
    `${this.expenseCategories().length} ${this.ts.t('categories.tabs.expense')} · ` +
    `${this.incomeCategories().length} ${this.ts.t('categories.tabs.income')}`
  );

  expenseCategories = computed(() => this.categories().filter((c) => c.type === CategoryType.EXPENSE));
  incomeCategories  = computed(() => this.categories().filter((c) => c.type === CategoryType.INCOME));

  private toGroups(cats: Category[]): CategoryGroup[] {
    const q = this.searchQuery().toLowerCase().trim();
    const filtered = q ? cats.filter((c) => c.name.toLowerCase().includes(q)) : cats;
    const map = new Map<string, Category[]>();
    for (const cat of filtered) {
      const g = cat.group ?? 'Otros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(cat);
    }
    return Array.from(map.entries()).map(([name, categories]) => ({
      name,
      icon: GROUP_ICONS[name] ?? '📁',
      categories,
    }));
  }

  filteredExpenseGroups = computed(() => this.toGroups(this.expenseCategories()));
  filteredIncomeGroups  = computed(() => this.toGroups(this.incomeCategories()));

  isFormValid = computed(() => this.form.name.trim() && this.form.icon.trim() && this.form.colorHex);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (cats) => { this.categories.set(cats); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.toast('error', this.ts.t('categories.error.load'));
      },
    });
  }

  openCreateDialog(): void {
    this.editingCat.set(null);
    this.form = { name: '', type: CategoryType.EXPENSE, icon: '', colorHex: 'A29BFE', group: '' };
    this.showDialog = true;
  }

  openEditDialog(cat: Category): void {
    this.editingCat.set(cat);
    this.form = {
      name:     cat.name,
      type:     cat.type,
      icon:     cat.icon,
      colorHex: cat.color.replace('#', ''),
      group:    cat.group ?? '',
    };
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingCat.set(null);
  }

  saveCategory(): void {
    if (!this.isFormValid()) return;
    const payload = {
      name:  this.form.name.trim(),
      type:  this.form.type,
      icon:  this.form.icon.trim(),
      color: '#' + this.form.colorHex,
      group: this.form.group.trim() || undefined,
    };

    this.isSaving.set(true);
    const editing = this.editingCat();
    const call$ = editing
      ? this.categoryService.update(editing.id, payload)
      : this.categoryService.create(payload);

    call$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeDialog();
        this.toast('success', this.ts.t(editing ? 'categories.toast.updated' : 'categories.toast.created'));
        this.loadCategories();
      },
      error: () => { this.isSaving.set(false); this.toast('error', this.ts.t('categories.error.save')); },
    });
  }

  confirmDelete(cat: Category): void {
    this.confirmService.confirm({
      message: this.ts.t('categories.confirm.deleteMsg').replace('{name}', cat.name),
      header: this.ts.t('categories.confirm.deleteTitle'),
      icon: 'pi pi-trash',
      acceptLabel: this.ts.t('categories.confirm.accept'),
      rejectLabel: this.ts.t('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteCategory(cat),
    });
  }

  private deleteCategory(cat: Category): void {
    this.categoryService.delete(cat.id).subscribe({
      next: () => {
        this.toast('success', this.ts.t('categories.toast.deleted').replace('{name}', cat.name));
        this.loadCategories();
      },
      error: () => this.toast('error', this.ts.t('categories.error.delete')),
    });
  }

  private toast(severity: string, detail: string): void {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : '✓', detail, life: 3000 });
  }
}
