import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Session {
  authenticated: boolean;
  username: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private initialized = false;
  private initialization?: Promise<void>;

  readonly isLogIn = signal(false);
  readonly displayName = signal('');
  readonly busy = signal(true);
  readonly sessionError = signal('');
  readonly notice = signal('');

  initialize(): Promise<void> {
    if (this.initialization) return this.initialization;
    if (this.initialized) return Promise.resolve();

    this.initialization = this.loadSession();
    return this.initialization;
  }

  refreshSession(): Promise<void> {
    if (this.busy()) {
      return this.initialization ?? Promise.resolve();
    }

    this.initialized = false;
    return this.initialize();
  }

  private async loadSession(): Promise<void> {
    this.busy.set(true);
    this.sessionError.set('');

    try {
      const session = await firstValueFrom(
        this.http.get<Session>('/api/auth/me')
      );

      this.applySession(session);
      this.initialized = true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.applySession({
          authenticated: false,
          username: null
        });

        this.initialized = true;
      } else {
        this.sessionError.set(this.errorText(error));
      }
    } finally {
      this.busy.set(false);
      this.initialization = undefined;
    }
  }

  private applySession(session: Session): void {
    this.isLogIn.set(session.authenticated);
    this.displayName.set(session.username ?? '');
  }

  // Fetch the CSRF token before each authentication POST.
  private async post<T>(action: string, body: unknown): Promise<T> {
    await firstValueFrom(
      this.http.get<void>('/api/auth/csrf')
    );

    return firstValueFrom(
      this.http.post<T>(`/api/auth/${action}`, body)
    );
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    await this.initialize();

    if (this.busy()) {
      throw new Error('An authentication request is already running.');
    }

    this.busy.set(true);
    this.sessionError.set('');

    try {
      return await operation();
    } finally {
      this.busy.set(false);
    }
  }

  login(username: string, password: string): Promise<void> {
    return this.run(async () => {
      const session = await this.post<Session>('login', {
        username: username.trim(),
        password
      });

      this.applySession(session);

      if (!session.authenticated) {
        throw new Error('Sign-in was not completed. Please try again.');
      }
    });
  }

  register(username: string, password: string): Promise<void> {
    return this.run(async () => {
      await this.post<{ message: string }>('register', {
        username: username.trim(),
        password
      });
    });
  }

  logout(): Promise<void> {
    return this.run(async () => {
      await this.post<void>('logout', {});

      this.applySession({
        authenticated: false,
        username: null
      });
    });
  }

  errorText(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to complete the request. Please try again.';
    }

    if ([0, 502, 503, 504].includes(error.status)) {
      return 'Cannot reach the server. Please try again in a moment.';
    }

    if (error.status >= 500) {
      return 'Something went wrong on the server. Please try again.';
    }

    const body = error.error;
    const errors = body?.errors;

    const details: unknown[] = Array.isArray(errors)
      ? errors
      : errors && typeof errors === 'object'
        ? Object.values(errors).flat()
        : [];

    const text = details
      .filter((item): item is string => typeof item === 'string')
      .join(' ');

    return (
      text ||
      (typeof body?.message === 'string' ? body.message : '') ||
      `Request failed (HTTP ${error.status}). Please try again.`
    );
  }
}
