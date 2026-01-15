import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  MonthlyCalendarResponse,
  YearlyProjectionResponse,
} from '../models/calendar.model';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private api = inject(ApiService);

  getMonthlyCalendar(year: number, month: number): Observable<MonthlyCalendarResponse> {
    return this.api.get<MonthlyCalendarResponse>(`/calendar/month/${year}/${month}`);
  }

  getYearlyProjection(year: number): Observable<YearlyProjectionResponse> {
    return this.api.get<YearlyProjectionResponse>(`/calendar/year/${year}`);
  }
}
