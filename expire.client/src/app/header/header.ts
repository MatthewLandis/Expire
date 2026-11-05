import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
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

  // Gives us access to the <details #accountMenu> element in header.html,
  // so onPageClick can close the dropdown.
  @ViewChild('accountMenu') accountMenu?: ElementRef<HTMLDetailsElement>;

  ngOnInit() {
    // When the header loads, ask the server who is logged in.
    this.auth.loadUser().subscribe();
  }

  // Runs every time the user clicks anywhere on the page.
  // If the click was outside the dropdown, close it.
  @HostListener('document:click', ['$event'])
  onPageClick(event: MouseEvent) {
    if (!this.accountMenu) return;

    const menu = this.accountMenu.nativeElement;
    const clickedInsideMenu = menu.contains(event.target as Node);

    if (!clickedInsideMenu) {
      menu.open = false;
    }
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (err) => console.error('Logout failed:', err)
    });
  }
}
