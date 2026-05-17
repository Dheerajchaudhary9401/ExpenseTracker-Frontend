import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { Category, CategoryRequest } from '../models/api.models';
import { normalizeCategory } from '../utils/formatters';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);

  // GET /categories/user/{userId}
  listByUser(userId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${apiConfig.categories}/user/${userId}`).pipe(
      map(items => items.map(normalizeCategory))
    );
  }

  // GET /categories/user/{userId}/type/{type}
  listByType(userId: number, type: string): Observable<Category[]> {
    return this.http.get<Category[]>(`${apiConfig.categories}/user/${userId}/type/${type}`).pipe(
      map(items => items.map(normalizeCategory))
    );
  }

  // GET /categories/{categoryId}
  getById(categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${apiConfig.categories}/${categoryId}`).pipe(
      map(normalizeCategory)
    );
  }

  // POST /categories/user/{userId}
  // Accepts both create(userId, payload) and create(payload) — payload.userId used as fallback
  create(userIdOrPayload: number | CategoryRequest, payload?: CategoryRequest): Observable<Category> {
    let userId: number;
    let body: CategoryRequest;

    if (typeof userIdOrPayload === 'number') {
      userId = userIdOrPayload;
      body = payload!;
    } else {
      body = userIdOrPayload;
      userId = body.userId;
    }

    return this.http.post<Category>(`${apiConfig.categories}/user/${userId}`, body).pipe(
      map(normalizeCategory)
    );
  }

  // PUT /categories/{categoryId}
  update(categoryId: number, payload: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${apiConfig.categories}/${categoryId}`, payload).pipe(
      map(normalizeCategory)
    );
  }

  // PUT /categories/{categoryId}/budget — body: { budgetLimit: number }
  updateBudget(categoryId: number, budgetLimit: number): Observable<string> {
    return this.http.put(
      `${apiConfig.categories}/${categoryId}/budget`,
      { budgetLimit },
      { responseType: 'text' }
    );
  }

  // DELETE /categories/{categoryId}
  remove(categoryId: number): Observable<string> {
    return this.http.delete(`${apiConfig.categories}/${categoryId}`, { responseType: 'text' });
  }

  // POST /categories/user/{userId}/init-defaults
  initDefaults(userId: number): Observable<string> {
    return this.http.post(`${apiConfig.categories}/user/${userId}/init-defaults`, {}, { responseType: 'text' });
  }

  // GET /categories/user/{userId}/count
  getCount(userId: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.categories}/user/${userId}/count`);
  }
}