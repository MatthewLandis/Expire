import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  ngOnInit() {
    this.auth.loadUser().subscribe();
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (err) => console.error('Logout failed:', err)
    });
  }
}
