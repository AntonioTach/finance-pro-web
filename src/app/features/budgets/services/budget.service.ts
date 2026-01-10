import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Budget } from '../../../core/models/budget.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Budget[]> {
    return this.apiService.get<Budget[]>('/budgets');
  }

  getById(id: string): Observable<Budget> {
    return this.apiService.get<Budget>(`/budgets/${id}`);
  }

  create(budget: Partial<Budget>): Observable<Budget> {
    return this.apiService.post<Budget>('/budgets', budget);
  }

  update(id: string, budget: Partial<Budget>): Observable<Budget> {
    return this.apiService.patch<Budget>(`/budgets/${id}`, budget);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`/budgets/${id}`);
  }

  getProgress(id: string): Observable<any> {
    return this.apiService.get<any>(`/budgets/${id}/progress`);
  }
}

