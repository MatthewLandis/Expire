import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

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
    this.message.set('');
    this.isSubmitting.set(true);

    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigateByUrl('/fridge'),
      error: () => {
        this.message.set('Unable to sign in. Check your details and try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}
