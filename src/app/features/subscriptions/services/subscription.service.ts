import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from '../../../core/models/subscription.model';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Subscription[]> {
    return this.apiService.get<Subscription[]>('/subscriptions');
  }

  getById(id: string): Observable<Subscription> {
    return this.apiService.get<Subscription>(`/subscriptions/${id}`);
  }

  create(subscription: CreateSubscriptionDto): Observable<Subscription> {
    return this.apiService.post<Subscription>('/subscriptions', subscription);
  }

  update(id: string, subscription: UpdateSubscriptionDto): Observable<Subscription> {
    return this.apiService.patch<Subscription>(`/subscriptions/${id}`, subscription);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`/subscriptions/${id}`);
  }
}
