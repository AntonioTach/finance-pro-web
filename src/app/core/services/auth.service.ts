import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
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
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string) {
    return this.apiService.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
  }

  register(name: string, email: string, password: string, currency?: string) {
    return this.apiService.post<LoginResponse>('/auth/register', {
      name,
      email,
      password,
      currency,
    });
  }

  logout(): void {
    this.storageService.clear();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  setAuthData(user: User, token: string): void {
    this.storageService.setToken(token);
    this.storageService.setUser(user);
    this.currentUserSignal.set(user);
  }

  private loadUserFromStorage(): void {
    const user = this.storageService.getUser();
    const token = this.storageService.getToken();
    if (user && token) {
      this.currentUserSignal.set(user);
    }
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }
}

