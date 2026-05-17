import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { Income, IncomeRequest } from '../models/api.models';
import { normalizeIncome } from '../utils/formatters';

@Injectable({ providedIn: 'root' })
export class IncomeApiService {
  private readonly http = inject(HttpClient);

  // GET /incomes/user/{userId}
  listByUser(userId: number): Observable<Income[]> {
    return this.http.get<Income[]>(`${apiConfig.incomes}/user/${userId}`).pipe(
      map(items => items.map(normalizeIncome))
    );
  }

  // GET /incomes/user/{userId}/month/{year}/{month}
  listByMonth(userId: number, year: number, month: number): Observable<Income[]> {
    return this.http.get<Income[]>(`${apiConfig.incomes}/user/${userId}/month/${year}/${month}`).pipe(
      map(items => items.map(normalizeIncome))
    );
  }

  // GET /incomes/user/{userId}/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  listByRange(userId: number, startDate: string, endDate: string): Observable<Income[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<Income[]>(`${apiConfig.incomes}/user/${userId}/range`, { params }).pipe(
      map(items => items.map(normalizeIncome))
    );
  }

  // GET /incomes/user/{userId}/recurring
  listRecurring(userId: number): Observable<Income[]> {
    return this.http.get<Income[]>(`${apiConfig.incomes}/user/${userId}/recurring`).pipe(
      map(items => items.map(normalizeIncome))
    );
  }

  // GET /incomes/user/{userId}/search?keyword=...
  search(userId: number, keyword: string): Observable<Income[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<Income[]>(`${apiConfig.incomes}/user/${userId}/search`, { params }).pipe(
      map(items => items.map(normalizeIncome))
    );
  }

  // POST /incomes/user/{userId}
  // Accepts both create(userId, payload) and create(payload) — payload.userId used as fallback
  create(userIdOrPayload: number | IncomeRequest, payload?: IncomeRequest): Observable<Income> {
    let userId: number;
    let body: IncomeRequest;

    if (typeof userIdOrPayload === 'number') {
      userId = userIdOrPayload;
      body = payload!;
    } else {
      body = userIdOrPayload;
      userId = body.userId;
    }

    return this.http.post<Income>(`${apiConfig.incomes}/user/${userId}`, body).pipe(
      map(normalizeIncome)
    );
  }

  // PUT /incomes/{incomeId}
  update(incomeId: number, payload: IncomeRequest): Observable<Income> {
    return this.http.put<Income>(`${apiConfig.incomes}/${incomeId}`, payload).pipe(
      map(normalizeIncome)
    );
  }

  // DELETE /incomes/{incomeId}
  remove(incomeId: number): Observable<string> {
    return this.http.delete(`${apiConfig.incomes}/${incomeId}`, { responseType: 'text' });
  }

  // GET /incomes/user/{userId}/total
  totalByUser(userId: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.incomes}/user/${userId}/total`);
  }

  // GET /incomes/user/{userId}/total/month/{year}/{month}
  totalByMonth(userId: number, year: number, month: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.incomes}/user/${userId}/total/month/${year}/${month}`);
  }
}