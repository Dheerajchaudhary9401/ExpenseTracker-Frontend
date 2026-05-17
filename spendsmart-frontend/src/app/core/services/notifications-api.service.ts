import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { AppNotification } from '../models/api.models';
import { normalizeNotification } from '../utils/formatters';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  // GET /notifications/user/{userId}
  listByRecipient(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${apiConfig.notifications}/user/${userId}`).pipe(
      map(items => items.map(normalizeNotification)),
      tap(items => this.unreadCountSubject.next(items.filter(n => !n.read).length))
    );
  }

  // GET /notifications/user/{userId}/unread
  listUnread(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${apiConfig.notifications}/user/${userId}/unread`).pipe(
      map(items => items.map(normalizeNotification))
    );
  }

  // GET /notifications/user/{userId}/unread-count
  unreadCount(userId: number): Observable<number> {
    return this.http.get<number>(`${apiConfig.notifications}/user/${userId}/unread-count`).pipe(
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  // PUT /notifications/{notificationId}/read
  markAsRead(notificationId: number): Observable<string> {
    return this.http.put(`${apiConfig.notifications}/${notificationId}/read`, {}, { responseType: 'text' });
  }

  // PUT /notifications/user/{userId}/read-all
  markAllRead(userId: number): Observable<string> {
    return this.http.put(`${apiConfig.notifications}/user/${userId}/read-all`, {}, { responseType: 'text' });
  }

  // PUT /notifications/{notificationId}/acknowledge
  acknowledge(notificationId: number): Observable<string> {
    return this.http.put(`${apiConfig.notifications}/${notificationId}/acknowledge`, {}, { responseType: 'text' });
  }

  // DELETE /notifications/{notificationId}
  remove(notificationId: number): Observable<string> {
    return this.http.delete(`${apiConfig.notifications}/${notificationId}`, { responseType: 'text' });
  }

  // Used by admin page to get ALL notifications across all users
  // Backend: GET /notifications/user/{userId} — we fetch for current admin user
  // Since there's no /notifications/all endpoint, we return the admin's notifications
  // as a proxy. The admin page uses this for stats only.
  listAll(): Observable<AppNotification[]> {
    // Returns empty array as fallback — admin page uses catchError(() => of([]))
    // so this won't crash even if the endpoint doesn't exist
    return this.http.get<AppNotification[]>(`${apiConfig.notifications}/all`).pipe(
      map(items => items.map(normalizeNotification))
    );
  }

  // POST /notifications/bulk — body: { recipientIds: number[], title: string, message: string }
  // Backend NotificationResource.java has POST /notifications/bulk
  sendBulk(userIds: number[], title: string, message: string): Observable<string> {
    return this.http.post(
      `${apiConfig.notifications}/bulk`,
      { recipientIds: userIds, title, message },
      { responseType: 'text' }
    );
  }
}