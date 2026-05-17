import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { Expense, ExpenseRequest } from '../models/api.models';
import { normalizeExpense } from '../utils/formatters';

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private readonly http = inject(HttpClient);

  // GET /expenses/user/{userId}
  listByUser(userId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${apiConfig.expenses}/user/${userId}`).pipe(
      map(items => items.map(normalizeExpense))
    );
  }

  // GET /expenses/user/{userId}/month/{year}/{month}
  listByMonth(userId: number, year: number, month: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${apiConfig.expenses}/user/${userId}/month/${year}/${month}`).pipe(
      map(items => items.map(normalizeExpense))
    );
  }

  // GET /expenses/user/{userId}/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  listByRange(userId: number, startDate: string, endDate: string): Observable<Expense[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<Expense[]>(`${apiConfig.expenses}/user/${userId}/range`, { params }).pipe(
      map(items => items.map(normalizeExpense))
    );
  }

  // GET /expenses/user/{userId}/search?keyword=...
  search(userId: number, keyword: string): Observable<Expense[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<Expense[]>(`${apiConfig.expenses}/user/${userId}/search`, { params }).pipe(
      map(items => items.map(normalizeExpense))
    );
  }

  // POST /expenses/user/{userId}
  // Accepts both create(userId, payload) and create(payload) — payload.userId used as fallback
  create(userIdOrPayload: number | ExpenseRequest, payload?: ExpenseRequest): Observable<Expense> {
    let userId: number;
    let body: ExpenseRequest;

    if (typeof userIdOrPayload === 'number') {
      userId = userIdOrPayload;
      body = payload!;
    } else {
      // Called as create(payload) — get userId from payload
      body = userIdOrPayload;
      userId = body.userId;
    }

    return this.http.post<Expense>(`${apiConfig.expenses}/user/${userId}`, body).pipe(
      map(normalizeExpense)
    );
  }

  // PUT /expenses/{expenseId}
  update(expenseId: number, payload: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${apiConfig.expenses}/${expenseId}`, payload).pipe(
      map(normalizeExpense)
    );
  }

  // DELETE /expenses/{expenseId}
  remove(expenseId: number): Observable<string> {
    return this.http.delete(`${apiConfig.expenses}/${expenseId}`, { responseType: 'text' });
  }

  // GET /expenses/user/{userId}/total
  totalByUser(userId: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.expenses}/user/${userId}/total`);
  }

  // GET /expenses/{expenseId}
  getById(expenseId: number): Observable<Expense> {
    return this.http.get<Expense>(`${apiConfig.expenses}/${expenseId}`).pipe(
      map(normalizeExpense)
    );
  }
}