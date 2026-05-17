import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { Budget, BudgetProgress, BudgetRequest } from '../models/api.models';
import { normalizeBudget } from '../utils/formatters';

@Injectable({ providedIn: 'root' })
export class BudgetsApiService {
  private readonly http = inject(HttpClient);

  // GET /budgets/user/{userId}
  listByUser(userId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${apiConfig.budgets}/user/${userId}`).pipe(
      map(items => items.map(normalizeBudget))
    );
  }

  // GET /budgets/user/{userId}/active
  listActive(userId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${apiConfig.budgets}/user/${userId}/active`).pipe(
      map(items => items.map(normalizeBudget))
    );
  }

  // POST /budgets/user/{userId}
// Accepts both create(userId, payload) and create(payload)
create(userIdOrPayload: number | BudgetRequest, payload?: BudgetRequest): Observable<Budget> {
  let userId: number;
  let body: BudgetRequest;

  if (typeof userIdOrPayload === 'number') {
    userId = userIdOrPayload;
    body = payload!;
  } else {
    body = userIdOrPayload;
    userId = body.userId;
  }

  return this.http.post<Budget>(`${apiConfig.budgets}/user/${userId}`, body).pipe(
    map(normalizeBudget)
  );
}

  // PUT /budgets/{budgetId}
  update(budgetId: number, payload: BudgetRequest): Observable<Budget> {
    return this.http.put<Budget>(`${apiConfig.budgets}/${budgetId}`, payload).pipe(
      map(normalizeBudget)
    );
  }

  // DELETE /budgets/{budgetId}
  remove(budgetId: number): Observable<string> {
    return this.http.delete(`${apiConfig.budgets}/${budgetId}`, { responseType: 'text' });
  }

  // GET /budgets/{budgetId}/progress → backend returns Double (percentage)
  // We convert it into a full BudgetProgress object so pages can use .budgetId, .spentAmount etc.
  progress(budgetId: number): Observable<BudgetProgress> {
    return this.http.get<number>(`${apiConfig.budgets}/${budgetId}/progress`).pipe(
      map(percentage => ({
        budgetId,
        limitAmount: 0,        // not returned by this endpoint
        spentAmount: 0,        // not returned by this endpoint
        remainingAmount: 0,    // not returned by this endpoint
        percentageUsed: percentage ?? 0,
        alertTriggered: (percentage ?? 0) >= 80,
        alertMessage: null
      } as BudgetProgress))
    );
  }

  // PUT /budgets/{budgetId}/spent — body: { amount: number }
  updateSpent(budgetId: number, amount: number): Observable<string> {
    return this.http.put(`${apiConfig.budgets}/${budgetId}/spent`, { amount }, { responseType: 'text' });
  }

  // POST /budgets/user/{userId}/check-alerts
  checkAlerts(userId: number): Observable<string> {
    return this.http.post(`${apiConfig.budgets}/user/${userId}/check-alerts`, {}, { responseType: 'text' });
  }

  // Used by budgets page — returns empty array since backend has no /alerts endpoint
  // Backend uses notifications for alerts instead
  alerts(userId: number): Observable<string[]> {
    // No /budgets/user/{userId}/alerts endpoint in your backend.
    // Alerts are handled via the notifications service.
    // Return empty array so the page still works.
    return of([] as string[]);
  }

  // Fetch BudgetProgress for multiple budgets in parallel
  progressForBudgets(budgets: Budget[]): Observable<BudgetProgress[]> {
    if (!budgets.length) return of([]);
    return forkJoin(budgets.map(b => this.progress(b.budgetId)));
  }
}