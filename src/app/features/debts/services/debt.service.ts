import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Debt,
  CreateDebtDto,
  UpdateDebtDto,
  CreateDebtPaymentDto,
} from '../../../core/models/debt.model';

@Injectable({ providedIn: 'root' })
export class DebtService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Debt[]> {
    return this.api.get<Debt[]>('/debts');
  }

  getById(id: string): Observable<Debt> {
    return this.api.get<Debt>(`/debts/${id}`);
  }

  create(dto: CreateDebtDto): Observable<Debt> {
    return this.api.post<Debt>('/debts', dto);
  }

  update(id: string, dto: UpdateDebtDto): Observable<Debt> {
    return this.api.patch<Debt>(`/debts/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/debts/${id}`);
  }

  addPayment(debtId: string, dto: CreateDebtPaymentDto): Observable<Debt> {
    return this.api.post<Debt>(`/debts/${debtId}/payments`, dto);
  }

  removePayment(debtId: string, paymentId: string): Observable<Debt> {
    return this.api.delete<Debt>(`/debts/${debtId}/payments/${paymentId}`);
  }
}
