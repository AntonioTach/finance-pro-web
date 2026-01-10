import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CategoryService } from '../services/category.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, TagModule, LoadingSpinnerComponent],
  template: `
    <p-toast />
    <div class="category-list-page">
      <div class="page-header">
        <h1>Categories</h1>
        <p-button
          label="Sync Default Categories"
          icon="pi pi-sync"
          [loading]="isSyncing()"
          (onClick)="syncCategories()"
        />
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <app-loading-spinner></app-loading-spinner>
        </div>
      } @else {
        <div class="section">
          <h2>
            <p-tag value="Expense" severity="danger" />
            Expense Categories
          </h2>
          <div class="categories-grid">
            @for (category of expenseCategories(); track category.id) {
              <div class="category-card" [style.border-left-color]="category.color">
                <span class="category-icon">{{ category.icon }}</span>
                <div class="category-info">
                  <h3>{{ category.name }}</h3>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="section">
          <h2>
            <p-tag value="Income" severity="success" />
            Income Categories
          </h2>
          <div class="categories-grid">
            @for (category of incomeCategories(); track category.id) {
              <div class="category-card" [style.border-left-color]="category.color">
                <span class="category-icon">{{ category.icon }}</span>
                <div class="category-info">
                  <h3>{{ category.name }}</h3>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .category-list-page {
        padding: 1.5rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
      }

      .section {
        margin-bottom: 2rem;
      }

      .section h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }

      .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .category-card {
        background: var(--surface-card);
        border-radius: var(--border-radius);
        padding: 1rem;
        border-left: 4px solid;
        box-shadow: var(--shadow-sm);
        display: flex;
        gap: 0.75rem;
        align-items: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .category-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .category-icon {
        font-size: 1.75rem;
      }

      .category-info h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 2rem;
      }
    `,
  ],
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  isSyncing = signal(false);
  categories = signal<Category[]>([]);

  expenseCategories = signal<Category[]>([]);
  incomeCategories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.expenseCategories.set(categories.filter((c) => c.type === 'expense'));
        this.incomeCategories.set(categories.filter((c) => c.type === 'income'));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories',
        });
      },
    });
  }

  syncCategories(): void {
    this.isSyncing.set(true);
    this.categoryService.syncDefaults().subscribe({
      next: (result) => {
        this.isSyncing.set(false);
        if (result.added > 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Categories Synced',
            detail: `Added ${result.added} new categories`,
          });
          this.loadCategories();
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Up to date',
            detail: 'All default categories are already present',
          });
        }
      },
      error: (error) => {
        console.error('Error syncing categories:', error);
        this.isSyncing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to sync categories',
        });
      },
    });
  }
}

