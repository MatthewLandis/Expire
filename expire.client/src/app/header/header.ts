import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';

interface Session {
  authenticated: boolean;
  username: string | null;
}

@Component({
  selector: 'app-header',
  standalone: false,
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header implements OnInit {
  private http = inject(HttpClient);

  isLogIn = false;
  showLogInTab = false;
  isClosing = false;
  isRegister = false;
  busy = false;

  username = '';
  password = '';
  displayName = '';
  message = '';

  ngOnInit() {
    this.http.get<Session>('/api/auth/me').subscribe({
      next: session => this.applySession(session),
      error: () => {
        this.message = 'Could not reach the server. Please try again.';
      }
    });
  }

  private applySession(session: Session) {
    this.isLogIn = session.authenticated;
    this.displayName = session.username ?? '';
  }

  toggleLogin() {
    if (this.busy || this.isClosing) return;

    if (this.showLogInTab) {
      this.closeLogin();
    } else {
      this.message = '';
      this.showLogInTab = true;
    }
  }

  private closeLogin() {
    this.isClosing = true;

    setTimeout(() => {
      this.showLogInTab = false;
      this.isClosing = false;
      this.password = '';
    }, 300);
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.password = '';
    this.message = '';
  }

  submit() {
    if (this.busy) return;

    const registering = this.isRegister;
    const action = registering ? 'register' : 'login';
    const credentials = {
      username: this.username,
      password: this.password
    };

    this.busy = true;
    this.message = '';

    // Get a fresh verification token before changing account/session state.
    this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() =>
        this.http.post(`/api/auth/${action}`, credentials)
      ),
      switchMap(() => this.http.get<Session>('/api/auth/me')),
      finalize(() => this.busy = false)
    ).subscribe({
      next: session => {
        this.password = '';
        this.applySession(session);

        if (registering) {
          this.isRegister = false;
          this.message = 'Account created! Sign in with your new password.';
        } else {
          this.closeLogin();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.password = '';
        this.showError(error);
      }
    });
  }

  logout() {
    if (this.busy) return;

    this.busy = true;
    this.message = '';

    this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
      finalize(() => this.busy = false)
    ).subscribe({
      next: () => {
        this.isLogIn = false;
        this.displayName = '';
      },
      error: (error: HttpErrorResponse) => this.showError(error)
    });
  }

  private showError(error: HttpErrorResponse) {
    const errors = error.error?.errors;

    if (Array.isArray(errors)) {
      this.message = errors.join(' ');
    } else {
      this.message =
        error.error?.message ?? 'Request failed. Please try again.';
    }
  }
}
