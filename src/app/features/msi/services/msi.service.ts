import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MsiGroupFilters, MsiGroupSummary, YearlyProjectionResponse } from '../models/msi.model';

@Injectable({
  providedIn: 'root',
})
export class MsiService {
  private api = inject(ApiService);

  getGroups(filters: MsiGroupFilters = {}): Observable<MsiGroupSummary[]> {
    return this.api.get<MsiGroupSummary[]>('/msi/groups', filters);
  }

  getYearlyProjection(year: number): Observable<YearlyProjectionResponse> {
    return this.api.get<YearlyProjectionResponse>(`/msi/projection/${year}`);
  }
}
