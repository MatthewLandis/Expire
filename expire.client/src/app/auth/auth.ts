import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly isRegister = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly submitting = signal(false);
  username = '';
  password = '';

  ngOnInit(): void {
    void this.auth.initialize();
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.isRegister.set(data['mode'] === 'signup');
      this.password = '';
      this.isError.set(false);
      this.message.set(this.auth.notice());
      this.auth.notice.set('');
    });
  }

  async submit(form: NgForm): Promise<void> {
    if (form.invalid || this.auth.busy() || this.submitting() || this.auth.isLogIn()) return;
    const username = this.username.trim();
    if (!username) {
      this.isError.set(true);
      this.message.set('Please enter your username.');
      return;
    }
    this.submitting.set(true);
    this.message.set('');
    this.isError.set(false);
    try {
      if (this.isRegister()) {
        await this.auth.register(username, this.password);
        this.auth.notice.set('Account created! Sign in with your new password.');
        if (!this.destroyRef.destroyed) await this.router.navigateByUrl('/login');
      } else {
        await this.auth.login(username, this.password);
        if (!this.destroyRef.destroyed) await this.router.navigateByUrl('/');
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) {
        this.isError.set(true);
        this.message.set(this.auth.errorText(error));
      }
    } finally {
      this.password = '';
      this.submitting.set(false);
    }
  }
}
