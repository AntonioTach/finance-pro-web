import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private apiService: ApiService) {}

  getMonthlyReport(filters?: any): Observable<any> {
    return this.apiService.get<any>('/reports/monthly', filters);
  }

  getByCategory(filters?: any): Observable<any> {
    return this.apiService.get<any>('/reports/by-category', filters);
  }

  getTrends(filters?: any): Observable<any> {
    return this.apiService.get<any>('/reports/trends', filters);
  }
}

