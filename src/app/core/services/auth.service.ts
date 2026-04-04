import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { ThemeService, ThemeId } from './theme.service';
import { TranslationService, Lang } from './translation.service';
import { User } from '../models/user.model';

export interface LoginResponse {
  user: User;
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router,
    private themeService: ThemeService,
    private translationService: TranslationService,
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string) {
    return this.apiService.post<LoginResponse>('/auth/login', { email, password });
  }

  register(name: string, email: string, password: string, currency?: string) {
    return this.apiService.post<LoginResponse>('/auth/register', { name, email, password, currency });
  }

  logout(): void {
    this.storageService.clear();
    this.currentUserSignal.set(null);
    this.themeService.setTheme('dark');
    this.translationService.setLanguage('es');
    this.router.navigate(['/auth/login']);
  }

  /** Called after login/register and after profile updates. */
  setAuthData(user: User, token: string): void {
    this.storageService.setToken(token);
    this.storageService.setUser(user);
    this.currentUserSignal.set(user);
    this.applyUserPreferences(user);
  }

  /** Update user in memory + storage (no token change — e.g. after preference update). */
  updateCurrentUser(user: User): void {
    this.storageService.setUser(user);
    this.currentUserSignal.set(user);
    this.applyUserPreferences(user);
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }

  private loadUserFromStorage(): void {
    const user = this.storageService.getUser();
    const token = this.storageService.getToken();
    if (user && token) {
      this.currentUserSignal.set(user);
      this.applyUserPreferences(user);
    }
  }

  private applyUserPreferences(user: User): void {
    if (user.theme) {
      this.themeService.setTheme(user.theme as ThemeId);
    }
    if (user.language) {
      this.translationService.setLanguage(user.language as Lang);
    }
  }
}
