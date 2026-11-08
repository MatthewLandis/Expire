import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './auth.css'
})
export class Signup {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  readonly message = signal('');
  readonly isSubmitting = signal(false);

  onSignup() {
    this.message.set('');
    this.isSubmitting.set(true);

    this.auth.register(this.username, this.password).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.message.set('Registration failed. Check your details and try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}
