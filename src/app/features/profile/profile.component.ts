import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <h1>Profile</h1>
      <div class="profile-card">
        <form [formGroup]="profileForm" (ngSubmit)="handleSubmit()">
          <div class="form-group">
            <label>Name</label>
            <input formControlName="name" class="form-control" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input formControlName="email" type="email" class="form-control" />
          </div>
          <div class="form-group">
            <label>Currency</label>
            <select formControlName="currency" class="form-control">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
          <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || isLoading()">
            {{ isLoading() ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-page {
        padding: var(--spacing-lg);
      }

      .profile-card {
        background: var(--bg-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-sm);
        max-width: 500px;
      }

      .form-group {
        margin-bottom: var(--spacing-md);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
      }

      .btn-primary {
        background-color: var(--primary-color);
        color: white;
        padding: var(--spacing-md);
        border-radius: var(--border-radius-sm);
        font-weight: 500;
        width: 100%;
      }
    `,
  ],
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  profileForm: FormGroup;

  constructor() {
    const user = this.authService.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      currency: [user?.currency || 'USD'],
    });
  }

  handleSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading.set(true);
      this.apiService.patch<User>('/users/profile', this.profileForm.value).subscribe({
        next: (user) => {
          this.authService.setAuthData(user, this.authService.getToken()!);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading.set(false);
        },
      });
    }
  }
}

