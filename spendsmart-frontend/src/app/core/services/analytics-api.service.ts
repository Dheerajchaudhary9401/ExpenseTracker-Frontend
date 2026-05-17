import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { SessionService } from './session.service';

// ── URL MAP (from AnalyticsResource.java) ────────────────────────────────────
// GET  /analytics/user/{userId}/summary/{year}/{month}          → MonthlySummary
// GET  /analytics/user/{userId}/category-expenses/{year}/{month} → CategoryExpense[]
// GET  /analytics/user/{userId}/trend?months=12                  → MonthlyTrend[]
// GET  /analytics/user/{userId}/top-categories?limit=5           → CategoryExpense[]
// GET  /analytics/user/{userId}/health-score                     → FinancialHealthScore
// GET  /analytics/user/{userId}/cash-flow?startDate&endDate      → CashFlowSummary
// GET  /analytics/user/{userId}/forecast?monthsAhead=3           → SpendingForecast[]
// GET  /analytics/user/{userId}/savings-rate/{year}/{month}      → Double
// GET  /analytics/user/{userId}/budget-adherence/{year}/{month}  → Double
// GET  /analytics/user/{userId}/export/csv?startDate&endDate     → CSV string
// GET  /analytics/user/{userId}/export/pdf/{year}/{month}        → PDF bytes
// POST /analytics/user/{userId}/send-summary/{year}/{month}      → send email
// ─────────────────────────────────────────────────────────────────────────────

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
}

export interface CategoryExpense {
  categoryName: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

export interface FinancialHealthScore {
  score: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | string;
  savingsRate: number;
  budgetAdherence: number;
  expenseGrowthRate: number;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  startDate: string;
  endDate: string;
}

export interface SpendingForecast {
  month: number;
  year: number;
  forecastedExpense: number;
  forecastedIncome: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly session = inject(SessionService);
  private readonly http = inject(HttpClient);

  // GET /analytics/user/{userId}/summary/{year}/{month}
  monthly(userId: number, year: number, month: number): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${apiConfig.analytics}/user/${userId}/summary/${year}/${month}`);
  }

  // GET /analytics/user/{userId}/category-expenses/{year}/{month}
  categoryExpenses(userId: number, year: number, month: number): Observable<CategoryExpense[]> {
    return this.http.get<CategoryExpense[]>(`${apiConfig.analytics}/user/${userId}/category-expenses/${year}/${month}`);
  }

  // GET /analytics/user/{userId}/trend?months=12
  trend(userId: number, months: number = 12): Observable<MonthlyTrend[]> {
    const params = new HttpParams().set('months', months);
    return this.http.get<MonthlyTrend[]>(`${apiConfig.analytics}/user/${userId}/trend`, { params });
  }

  // GET /analytics/user/{userId}/top-categories?limit=5
  topCategories(userId: number, limit: number = 5): Observable<CategoryExpense[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<CategoryExpense[]>(`${apiConfig.analytics}/user/${userId}/top-categories`, { params });
  }

  // GET /analytics/user/{userId}/health-score
  healthScore(userId: number): Observable<FinancialHealthScore> {
    return this.http.get<FinancialHealthScore>(`${apiConfig.analytics}/user/${userId}/health-score`);
  }

  // GET /analytics/user/{userId}/cash-flow?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  cashFlow(userId: number, startDate: string, endDate: string): Observable<CashFlowSummary> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<CashFlowSummary>(`${apiConfig.analytics}/user/${userId}/cash-flow`, { params });
  }

  // GET /analytics/user/{userId}/forecast?monthsAhead=3
  forecast(userId: number, monthsAhead: number = 3): Observable<SpendingForecast[]> {
    const params = new HttpParams().set('monthsAhead', monthsAhead);
    return this.http.get<SpendingForecast[]>(`${apiConfig.analytics}/user/${userId}/forecast`, { params });
  }

  // GET /analytics/user/{userId}/savings-rate/{year}/{month}
  savingsRate(userId: number, year: number, month: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.analytics}/user/${userId}/savings-rate/${year}/${month}`);
  }

  // GET /analytics/user/{userId}/budget-adherence/{year}/{month}
  budgetAdherence(userId: number, year: number, month: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.analytics}/user/${userId}/budget-adherence/${year}/${month}`);
  }

  // GET /analytics/user/{userId}/export/csv?startDate=...&endDate=...
  exportCSV(userId: number, startDate: string, endDate: string): Observable<string> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${apiConfig.analytics}/user/${userId}/export/csv`, { params, responseType: 'text' });
  }

  // GET /analytics/user/{userId}/export/pdf/{year}/{month}
  exportPDF(userId: number, year: number, month: number): Observable<Blob> {
    return this.http.get(`${apiConfig.analytics}/user/${userId}/export/pdf/${year}/${month}`, { responseType: 'blob' });
  }

  // POST /analytics/user/{userId}/send-summary/{year}/{month}
  // sendSummaryEmail(userId: number, year: number, month: number): Observable<string> {
  //   return this.http.post(`${apiConfig.analytics}/user/${userId}/send-summary/${year}/${month}`, {}, { responseType: 'text' });
  // }
  sendSummaryEmail(userId: number, year: number, month: number): Observable<string> {
  const email = this.session.session()?.email ?? '';
  return this.http.post(
    `${apiConfig.analytics}/user/${userId}/send-summary/${year}/${month}?email=${encodeURIComponent(email)}`,
    {},
    { responseType: 'text' }
  );
}
}