import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ProfileInfo, ProfileService } from './profile.service';

// What the card is showing right now:
// 'view'     = the normal profile
// 'edit'     = the Edit profile form
// 'password' = the Change password form
// 'delete'   = the Delete account box
type Mode = 'view' | 'edit' | 'password' | 'delete';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private profileService = inject(ProfileService);
  private auth = inject(AuthService);
  private router = inject(Router);

  // The profile from the server (null until it has loaded).
  readonly profile = signal<ProfileInfo | null>(null);

  readonly mode = signal<Mode>('view');
  readonly isSaving = signal(false);
  readonly error = signal('');   // red message, when something goes wrong
  readonly success = signal(''); // green message, e.g. "Password changed."

  // Edit profile form fields
  displayName = '';
  bio = '';

  // Change password form fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Delete account box field
  deletePassword = '';

  // Runs once when the page opens.
  ngOnInit() {
    this.profileService.get().subscribe({
      next: profile => this.profile.set(profile),
      error: () => this.error.set('Could not load your profile. Try refreshing the page.')
    });
  }

  // The big name at the top: the display name if they set one, otherwise the username.
  name() {
    const profile = this.profile();
    return profile?.displayName || profile?.username || '';
  }

  // ---------- Switching between view and the forms ----------

  // Open one of the forms (or go back to 'view'), starting clean every time.
  show(mode: Mode) {
    this.error.set('');
    this.success.set('');

    // Clear every password box, so a typed password never hangs around.
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.deletePassword = '';

    // The edit form starts with what's saved now.
    this.displayName = this.profile()?.displayName ?? '';
    this.bio = this.profile()?.bio ?? '';

    this.mode.set(mode);
  }

  // ---------- Edit profile ----------

  onSaveProfile() {
    this.error.set('');
    this.isSaving.set(true);

    // An empty box gives '' - send null so the server knows "not set".
    this.profileService.update(this.displayName || null, this.bio || null).subscribe({
      next: profile => {
        this.profile.set(profile);
        this.isSaving.set(false);
        this.show('view');
        this.success.set('Profile saved.');
      },
      error: () => {
        this.error.set('Could not save your profile. Try again.');
        this.isSaving.set(false);
      }
    });
  }

  // ---------- Change password ----------

  onChangePassword() {
    this.error.set('');
    this.isSaving.set(true);

    this.profileService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.show('view');
        this.success.set('Password changed.');
      },
      error: err => {
        // Show the server's reason if it sent one (like "Incorrect password.").
        this.error.set(err.error?.message ?? 'Could not change your password. Check the rules and try again.');
        this.isSaving.set(false);
      }
    });
  }

  // ---------- Delete account ----------

  onDeleteAccount() {
    this.error.set('');
    this.isSaving.set(true);

    this.profileService.deleteAccount(this.deletePassword).subscribe({
      next: () => {
        // The server has logged them out. Ask it again who is logged in,
        // so the header switches back to "Log In / Sign Up", then go home.
        this.auth.loadUser().subscribe(() => this.router.navigate(['/']));
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Could not delete your account. Try again.');
        this.isSaving.set(false);
      }
    });
  }
}
