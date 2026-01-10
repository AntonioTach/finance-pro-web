import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Category } from '../../../core/models/category.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Category[]> {
    return this.apiService.get<Category[]>('/categories');
  }

  getById(id: string): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`);
  }

  create(category: Partial<Category>): Observable<Category> {
    return this.apiService.post<Category>('/categories', category);
  }

  update(id: string, category: Partial<Category>): Observable<Category> {
    return this.apiService.patch<Category>(`/categories/${id}`, category);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`/categories/${id}`);
  }
}

