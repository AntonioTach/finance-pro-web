import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Card,
  CardSummary,
  CreateCardDto,
  UpdateCardDto,
} from '../../../core/models/card.model';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Card[]> {
    return this.apiService.get<Card[]>('/cards');
  }

  getById(id: string): Observable<Card> {
    return this.apiService.get<Card>(`/cards/${id}`);
  }

  create(card: CreateCardDto): Observable<Card> {
    return this.apiService.post<Card>('/cards', card);
  }

  update(id: string, card: UpdateCardDto): Observable<Card> {
    return this.apiService.patch<Card>(`/cards/${id}`, card);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`/cards/${id}`);
  }

  getAllSummaries(): Observable<CardSummary[]> {
    return this.apiService.get<CardSummary[]>('/cards/summary');
  }

  getSummary(id: string): Observable<CardSummary> {
    return this.apiService.get<CardSummary>(`/cards/${id}/summary`);
  }
}
