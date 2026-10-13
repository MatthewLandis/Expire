import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './auth.css'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  readonly message = signal('');
  readonly isSubmitting = signal(false);

  onLogin() {
    if (this.isSubmitting()) return;

    this.message.set('');
    this.isSubmitting.set(true);

    this.auth.login(this.username, this.password).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.password = '';
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.message.set('Unable to sign in. Check your details and try again.');
      }
    });
  }
}
