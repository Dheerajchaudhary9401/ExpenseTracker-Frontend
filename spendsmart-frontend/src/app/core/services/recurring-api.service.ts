import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { RecurringRequest, RecurringTransaction } from '../models/api.models';
import { normalizeRecurring } from '../utils/formatters';

@Injectable({ providedIn: 'root' })
export class RecurringApiService {
  private readonly http = inject(HttpClient);

  // GET /recurring/user/{userId}
  listByUser(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(`${apiConfig.recurring}/user/${userId}`).pipe(
      map(items => items.map(normalizeRecurring))
    );
  }

  // GET /recurring/user/{userId}/active
  listActive(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(`${apiConfig.recurring}/user/${userId}/active`).pipe(
      map(items => items.map(normalizeRecurring))
    );
  }

  // GET /recurring/user/{userId}/upcoming
  listUpcoming(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(`${apiConfig.recurring}/user/${userId}/upcoming`).pipe(
      map(items => items.map(normalizeRecurring))
    );
  }

  // POST /recurring/user/{userId}
  // Accepts both create(userId, payload) and create(payload) — payload.userId used as fallback
  create(userIdOrPayload: number | RecurringRequest, payload?: RecurringRequest): Observable<RecurringTransaction> {
    let userId: number;
    let body: RecurringRequest;

    if (typeof userIdOrPayload === 'number') {
      userId = userIdOrPayload;
      body = payload!;
    } else {
      body = userIdOrPayload;
      userId = body.userId;
    }

    return this.http.post<RecurringTransaction>(`${apiConfig.recurring}/user/${userId}`, body).pipe(
      map(normalizeRecurring)
    );
  }

  // PUT /recurring/{recurringId}
  update(recurringId: number, payload: RecurringRequest): Observable<RecurringTransaction> {
    return this.http.put<RecurringTransaction>(`${apiConfig.recurring}/${recurringId}`, payload).pipe(
      map(normalizeRecurring)
    );
  }

  // PUT /recurring/{recurringId}/deactivate
  deactivate(recurringId: number): Observable<string> {
    return this.http.put(`${apiConfig.recurring}/${recurringId}/deactivate`, {}, { responseType: 'text' });
  }

  // DELETE /recurring/{recurringId}
  remove(recurringId: number): Observable<string> {
    return this.http.delete(`${apiConfig.recurring}/${recurringId}`, { responseType: 'text' });
  }
}