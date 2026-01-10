import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../services/category.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="category-list-page">
      <h1>Categories</h1>
      <div *ngIf="isLoading()" class="loading-container">
        <app-loading-spinner></app-loading-spinner>
      </div>
      <div *ngIf="!isLoading()" class="categories-grid">
        <div *ngFor="let category of categories()" class="category-card" [style.border-left-color]="category.color">
          <span class="category-icon">{{ category.icon }}</span>
          <div class="category-info">
            <h3>{{ category.name }}</h3>
            <span class="category-type">{{ category.type }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .category-list-page {
        padding: var(--spacing-lg);
      }

      .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--spacing-md);
      }

      .category-card {
        background: var(--bg-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        border-left: 4px solid;
        box-shadow: var(--shadow-sm);
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
      }

      .category-icon {
        font-size: 2rem;
      }

      .category-info h3 {
        margin: 0 0 var(--spacing-xs) 0;
      }

      .category-type {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: capitalize;
      }
    `,
  ],
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);

  isLoading = signal(false);
  categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading.set(false);
      },
    });
  }
}

