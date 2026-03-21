import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher/lang-switcher.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, LangSwitcherComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ts = inject(TranslationService);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  handleSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService
        .login(this.loginForm.value.email, this.loginForm.value.password)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.authService.setAuthData(response.user, response.accessToken);
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.isLoading = false;
            // Handle different error response formats
            if (error.error?.message) {
              this.errorMessage = error.error.message;
            } else if (error.error?.error) {
              this.errorMessage = error.error.error;
            } else if (error.message) {
              this.errorMessage = error.message;
            } else {
              this.errorMessage = this.ts.t('auth.login.error');
            }
          },
        });
    }
  }
}

