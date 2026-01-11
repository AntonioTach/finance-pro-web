import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { SubscriptionService } from '../services/subscription.service';
import { CategoryService } from '../../categories/services/category.service';
import { CardService } from '../../cards/services/card.service';
import { Subscription } from '../../../core/models/subscription.model';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Card } from '../../../core/models/card.model';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    ToggleSwitch,
    MessageModule,
  ],
  templateUrl: './subscription-form.component.html',
  styleUrls: ['./subscription-form.component.scss'],
})
export class SubscriptionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private subscriptionService = inject(SubscriptionService);
  private categoryService = inject(CategoryService);
  private cardService = inject(CardService);
  private dialogRef = inject(DynamicDialogRef);
  private dialogConfig = inject(DynamicDialogConfig);

  subscriptionForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  categories = signal<Category[]>([]);
  cards = signal<Card[]>([]);

  paymentDayOptions = Array.from({ length: 31 }, (_, i) => ({
    label: `Día ${i + 1}`,
    value: i + 1,
  }));

  get subscription(): Subscription | null {
    return this.dialogConfig.data?.subscription || null;
  }

  get isEditMode(): boolean {
    return !!this.subscription;
  }

  get expenseCategories(): Category[] {
    return this.categories().filter((cat) => cat.type === CategoryType.EXPENSE);
  }

  constructor() {
    this.subscriptionForm = this.fb.group({
      name: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      isActive: [true],
      paymentDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      categoryId: [null, Validators.required],
      cardId: [null],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCards();

    if (this.subscription) {
      this.subscriptionForm.patchValue({
        name: this.subscription.name,
        amount: this.subscription.amount,
        isActive: this.subscription.isActive,
        paymentDay: this.subscription.paymentDay,
        categoryId: this.subscription.categoryId,
        cardId: this.subscription.cardId || null,
        notes: this.subscription.notes || '',
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

  handleCancel(): void {
    this.dialogRef.close();
  }

  handleSubmit(): void {
    if (this.subscriptionForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = {
        ...this.subscriptionForm.value,
        cardId: this.subscriptionForm.value.cardId || undefined,
      };

      const request$ = this.isEditMode
        ? this.subscriptionService.update(this.subscription!.id, formData)
        : this.subscriptionService.create(formData);

      request$.subscribe({
        next: (subscription) => {
          this.isLoading = false;
          this.dialogRef.close(subscription);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al guardar la suscripción';
        },
      });
    }
  }
}
