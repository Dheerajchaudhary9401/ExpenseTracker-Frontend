import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { SessionUser, UserProfile } from '../models/api.models';
import { SessionService } from './session.service';

export interface LoginResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  currency: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  // POST /auth/register → returns User (not token)
  register(payload: { fullName: string; email: string; password: string; currency?: string; timezone?: string }): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${apiConfig.auth}/register`, {
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      currency: payload.currency ?? 'INR',
      timezone: payload.timezone ?? 'Asia/Kolkata'
    });
  }

  // POST /auth/login → returns LoginResponse WITH token
  login(payload: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${apiConfig.auth}/login`, payload).pipe(
      tap(res => this.storeSession(res))
    );
  }

  // POST /auth/google → sends Google ID token, returns LoginResponse WITH JWT
  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${apiConfig.auth}/google`, { idToken }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  // GET /auth/profile/{userId}
  getProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${apiConfig.auth}/profile/${userId}`);
  }

  // PUT /auth/profile/{userId}
  updateProfile(userId: number, payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${apiConfig.auth}/profile/${userId}`, payload);
  }

  // PUT /auth/password/{userId}
  changePassword(userId: number, payload: { currentPassword: string; newPassword: string }): Observable<string> {
    return this.http.put(`${apiConfig.auth}/password/${userId}`, payload, { responseType: 'text' });
  }

  // PUT /auth/currency/{userId}
  updateCurrency(userId: number, currency: string): Observable<string> {
    return this.http.put(`${apiConfig.auth}/currency/${userId}`, { currency }, { responseType: 'text' });
  }

  // PUT /auth/budget/{userId}
  updateBudget(userId: number, monthlyBudget: number): Observable<string> {
    return this.http.put(`${apiConfig.auth}/budget/${userId}`, { monthlyBudget }, { responseType: 'text' });
  }

  // DELETE /auth/deactivate/{userId}
  deactivate(userId: number): Observable<string> {
    return this.http.delete(`${apiConfig.auth}/deactivate/${userId}`, { responseType: 'text' });
  }

  // Admin endpoints
  getUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${apiConfig.auth}/users`);
  }

  promote(userId: number): Observable<string> {
    return this.http.put(`${apiConfig.auth}/promote/${userId}`, {}, { responseType: 'text' });
  }

  reactivate(userId: number): Observable<string> {
    return this.http.put(`${apiConfig.auth}/reactivate/${userId}`, {}, { responseType: 'text' });
  }

  // DELETE /auth/users/{userId} — permanent hard delete (admin only)
  deleteUser(userId: number): Observable<string> {
    return this.http.delete(`${apiConfig.auth}/users/${userId}`, { responseType: 'text' });
  }

  private storeSession(res: LoginResponse): void {
    const session: SessionUser = {
      userId: res.userId,
      email: res.email,
      fullName: res.fullName,
      token: res.token,
      role: res.role ?? 'USER'
    };
    this.session.setSession(session);
  }
}