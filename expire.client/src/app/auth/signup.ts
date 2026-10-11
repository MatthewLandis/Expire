import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './auth.css'
})
export class Signup {
  private http = inject(HttpClient);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  username = '';
  password = '';
  message = '';
  isSubmitting = false;

  onSignup() {
    this.message = '';
    this.isSubmitting = true;

    this.http.post('/api/auth/register', {
      username: this.username,
      password: this.password
    }).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetector.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.password = '';
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.message = 'Registration failed. Check your details and try again.';
      }
    });
  }
}
