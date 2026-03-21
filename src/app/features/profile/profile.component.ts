import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="profile-page">

      <header class="profile-header">
        <div class="header-icon">
          <i class="pi pi-user"></i>
        </div>
        <div>
          <h1>{{ 'profile.title' | translate }}</h1>
          <p>{{ 'profile.subtitle' | translate }}</p>
        </div>
      </header>

      <div class="profile-layout">

        <!-- Avatar card -->
        <div class="avatar-card">
          <div class="avatar-circle">
            {{ getInitials() }}
          </div>
          <div class="avatar-info">
            <span class="avatar-name">{{ currentUser()?.name }}</span>
            <span class="avatar-email">{{ currentUser()?.email }}</span>
          </div>
          <div class="avatar-badge">
            <i class="pi pi-verified"></i>
            {{ 'profile.memberSince' | translate }} {{ getMemberYear() }}
          </div>
        </div>

        <!-- Form sections -->
        <div class="form-sections">

          <!-- Personal info -->
          <div class="form-section">
            <div class="section-heading">
              <i class="pi pi-id-card"></i>
              <span>{{ 'profile.section.info' | translate }}</span>
            </div>

            <form [formGroup]="profileForm" (ngSubmit)="handleSubmit()">

              <div class="field-row">
                <div class="field">
                  <label>{{ 'profile.name' | translate }}</label>
                  <div class="input-wrap">
                    <i class="pi pi-user field-icon"></i>
                    <input
                      formControlName="name"
                      type="text"
                      [placeholder]="'profile.name' | translate"
                    />
                  </div>
                </div>

                <div class="field">
                  <label>{{ 'profile.email' | translate }}</label>
                  <div class="input-wrap">
                    <i class="pi pi-envelope field-icon"></i>
                    <input
                      formControlName="email"
                      type="email"
                      [placeholder]="'profile.email' | translate"
                    />
                  </div>
                </div>
              </div>

              <div class="section-heading" style="margin-top: 1.5rem;">
                <i class="pi pi-cog"></i>
                <span>{{ 'profile.section.prefs' | translate }}</span>
              </div>

              <div class="field">
                <label>{{ 'profile.currency' | translate }}</label>
                <div class="input-wrap select-wrap">
                  <i class="pi pi-dollar field-icon"></i>
                  <select formControlName="currency">
                    <option value="USD">{{ 'profile.currency.usd' | translate }}</option>
                    <option value="EUR">{{ 'profile.currency.eur' | translate }}</option>
                    <option value="GBP">{{ 'profile.currency.gbp' | translate }}</option>
                    <option value="MXN">{{ 'profile.currency.mxn' | translate }}</option>
                  </select>
                </div>
              </div>

              @if (savedSuccess()) {
                <div class="success-banner">
                  <i class="pi pi-check-circle"></i>
                  {{ 'profile.success' | translate }}
                </div>
              }

              <div class="form-actions">
                <button
                  type="submit"
                  class="btn-save"
                  [disabled]="profileForm.invalid || isLoading()"
                  [class.loading]="isLoading()"
                >
                  @if (isLoading()) {
                    <i class="pi pi-spin pi-spinner"></i>
                  } @else {
                    <i class="pi pi-check"></i>
                  }
                  {{ (isLoading() ? 'profile.saving' : 'profile.save') | translate }}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: 1.75rem;
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Header */
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .header-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--primary-subtle);
      border: 1px solid rgba(99, 102, 241, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i { font-size: 1.4rem; color: var(--primary-light); }
    }

    .profile-header h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.03em;
    }

    .profile-header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    /* Layout */
    .profile-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
      align-items: start;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    /* Avatar card */
    .avatar-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      box-shadow: 0 8px 24px var(--primary-glow);
    }

    .avatar-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .avatar-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .avatar-email {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .avatar-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.75rem;
      background: var(--primary-subtle);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--primary-light);

      i { font-size: 0.72rem; }
    }

    /* Form section */
    .form-sections {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-section {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.75rem;
    }

    .section-heading {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 1.25rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;

      i { color: var(--primary-light); font-size: 0.85rem; }
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 560px) { grid-template-columns: 1fr; }
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .field label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .input-wrap {
      position: relative;
    }

    .field-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.875rem;
      pointer-events: none;
    }

    .input-wrap input,
    .input-wrap select {
      width: 100%;
      padding: 0.75rem 0.875rem 0.75rem 2.5rem;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-color);
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 200ms ease, box-shadow 200ms ease;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-subtle);
      }
    }

    .select-wrap select {
      appearance: none;
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.875rem center;
      padding-right: 2.5rem;
    }

    /* Success banner */
    .success-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 10px;
      color: var(--success-color);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 1rem;

      i { font-size: 0.9rem; }
    }

    /* Submit button */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--gradient-primary);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 200ms ease, transform 100ms ease;
      box-shadow: 0 4px 14px var(--primary-glow);

      &:hover:not(:disabled) { opacity: 0.88; }
      &:active:not(:disabled) { transform: scale(0.98); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    @media (max-width: 768px) {
      .profile-page { padding: 1rem; }
    }
  `],
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private ts = inject(TranslationService);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  savedSuccess = signal(false);
  currentUser = this.authService.currentUser;
  profileForm: FormGroup;

  constructor() {
    const user = this.authService.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      currency: [user?.currency || 'USD'],
    });
  }

  getInitials(): string {
    const name = this.currentUser()?.name ?? '';
    return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  getMemberYear(): string {
    const createdAt = (this.currentUser() as any)?.createdAt;
    if (!createdAt) return '';
    return new Date(createdAt).getFullYear().toString();
  }

  handleSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading.set(true);
      this.savedSuccess.set(false);
      this.apiService.patch<User>('/users/profile', this.profileForm.value).subscribe({
        next: (user) => {
          this.authService.setAuthData(user, this.authService.getToken()!);
          this.isLoading.set(false);
          this.savedSuccess.set(true);
          this.messageService.add({
            severity: 'success',
            summary: this.ts.t('profile.success'),
            life: 3000,
          });
          setTimeout(() => this.savedSuccess.set(false), 4000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.ts.t('profile.error'),
            life: 3000,
          });
        },
      });
    }
  }
}

