import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Transaction } from '../../../core/models/transaction.model';
import { Observable } from 'rxjs';

export interface MsiGroup {
  parent: Transaction;
  installments: Transaction[];
}

export interface CancelMsiResult {
  deletedCount: number;
  remainingTransaction: Transaction;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private apiService: ApiService) {}

  getAll(filters?: Record<string, unknown>): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>('/transactions', filters);
  }

  getById(id: string): Observable<Transaction> {
    return this.apiService.get<Transaction>(`/transactions/${id}`);
  }

  create(transaction: Partial<Transaction>): Observable<Transaction> {
    return this.apiService.post<Transaction>('/transactions', transaction);
  }

  update(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    return this.apiService.patch<Transaction>(`/transactions/${id}`, transaction);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`/transactions/${id}`);
  }

  getSummary(): Observable<{ income: number; expense: number; balance: number }> {
    return this.apiService.get<{ income: number; expense: number; balance: number }>('/transactions/summary');
  }

  getMsiGroup(id: string): Observable<MsiGroup> {
    return this.apiService.get<MsiGroup>(`/transactions/${id}/msi-group`);
  }

  cancelMsi(id: string): Observable<CancelMsiResult> {
    return this.apiService.post<CancelMsiResult>(`/transactions/${id}/cancel-msi`, {});
  }

  updateMsiGroup(
    id: string,
    updates: { description?: string; notes?: string; categoryId?: string },
  ): Observable<Transaction[]> {
    return this.apiService.patch<Transaction[]>(`/transactions/${id}/msi-group`, updates);
  }
}

