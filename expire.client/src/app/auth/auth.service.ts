import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

interface AuthUser {
  authenticated: boolean;
  username: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private currentUser = signal<AuthUser>({
    authenticated: false,
    username: null
  });

  readonly user = this.currentUser.asReadonly();

  loadUser() {
    return this.http.get<AuthUser>('/api/auth/me').pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  login(username: string, password: string) {
    return this.http.post<AuthUser>('/api/auth/login', {
      username,
      password
    }).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout() {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.currentUser.set({
          authenticated: false,
          username: null
        });
      })
    );
  }
}
