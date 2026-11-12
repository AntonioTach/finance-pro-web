import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateReconciliationDto,
  Reconciliation,
  ReconciliationPreview,
} from '../../../core/models/reconciliation.model';

@Injectable({ providedIn: 'root' })
export class ReconciliationService {
  constructor(private api: ApiService) {}

  preview(date?: string): Observable<ReconciliationPreview> {
    return this.api.get<ReconciliationPreview>('/reconciliations/preview', { date });
  }

  getAll(): Observable<Reconciliation[]> {
    return this.api.get<Reconciliation[]>('/reconciliations');
  }

  create(dto: CreateReconciliationDto): Observable<Reconciliation> {
    return this.api.post<Reconciliation>('/reconciliations', dto);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/reconciliations/${id}`);
  }
}
