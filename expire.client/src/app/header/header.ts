import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(true);
  readonly loggingOut = signal(false);
  readonly message = signal('');

  ngOnInit() {
    this.auth.loadUser().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      error: () => {
        this.message.set('Unable to check your login status.');
      }
    });
  }

  onLogout() {
    if (this.loggingOut()) return;

    this.message.set('');
    this.loggingOut.set(true);

    this.auth.logout().pipe(
      finalize(() => this.loggingOut.set(false))
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.message.set('Unable to log out. Please try again.');
      }
    });
  }
}
