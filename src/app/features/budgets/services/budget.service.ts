import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import {
  Budget,
  BudgetProgress,
  BudgetDashboard,
  BudgetAlert,
  BudgetSuggestion,
  CreateBudgetDto,
} from '../../../core/models/budget.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private api: ApiService) {}

  // ── Dashboard ──────────────────────────────────────────────
  getDashboard(): Observable<BudgetDashboard> {
    return this.api.get<BudgetDashboard>('/budgets/dashboard');
  }

  getSuggestions(): Observable<BudgetSuggestion[]> {
    return this.api.get<BudgetSuggestion[]>('/budgets/suggestions');
  }

  // ── CRUD ──────────────────────────────────────────────────
  getAll(): Observable<Budget[]> {
    return this.api.get<Budget[]>('/budgets');
  }

  getById(id: string): Observable<Budget> {
    return this.api.get<Budget>(`/budgets/${id}`);
  }

  create(dto: CreateBudgetDto): Observable<Budget> {
    return this.api.post<Budget>('/budgets', dto);
  }

  update(id: string, dto: Partial<CreateBudgetDto>): Observable<Budget> {
    return this.api.patch<Budget>(`/budgets/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/budgets/${id}`);
  }

  // ── Progress & detail ──────────────────────────────────────
  getProgress(id: string): Observable<BudgetProgress> {
    return this.api.get<BudgetProgress>(`/budgets/${id}/progress`);
  }

  getPeriodTransactions(id: string): Observable<any> {
    return this.api.get<any>(`/budgets/${id}/transactions`);
  }

  // ── Alerts ─────────────────────────────────────────────────
  getAlerts(): Observable<BudgetAlert[]> {
    return this.api.get<BudgetAlert[]>('/budgets/alerts');
  }

  markAlertRead(alertId: string): Observable<void> {
    return this.api.patch<void>(`/budgets/alerts/${alertId}/read`, {});
  }

  markAllAlertsRead(): Observable<void> {
    return this.api.patch<void>('/budgets/alerts/read-all', {});
  }
}
