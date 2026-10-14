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

  readonly loggingOut = signal(false);

  ngOnInit() {
    this.auth.loadUser().subscribe();
  }

  onLogout() {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);

    this.auth.logout().pipe(
      finalize(() => this.loggingOut.set(false))
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
      },
      error: () => {
      }
    });
  }
}
