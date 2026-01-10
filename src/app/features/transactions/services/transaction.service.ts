import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private apiService: ApiService) {}

  getAll(filters?: any): Observable<Transaction[]> {
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

  getSummary(): Observable<any> {
    return this.apiService.get<any>('/transactions/summary');
  }
}

