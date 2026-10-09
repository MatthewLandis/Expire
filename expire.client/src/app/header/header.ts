import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    void this.auth.initialize();
  }

  async logout(): Promise<void> {
    if (this.auth.busy()) return;

    try {
      await this.auth.logout();
    } catch (error) {
      this.auth.sessionError.set(this.auth.errorText(error));
    }
  }
}
