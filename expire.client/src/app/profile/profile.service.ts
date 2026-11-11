import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// What the server sends back for a profile.
export interface ProfileInfo {
  username: string;
  displayName: string | null; // null = not set, show the username instead
  bio: string | null;         // null = not set, show "no bio yet"
  eatenCount: number;         // food marked Eaten on the fridge page
  wastedCount: number;        // food marked Thrown out
}

// Talks to ProfileController on the server (api/profile).
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  get() {
    return this.http.get<ProfileInfo>('/api/profile');
  }

  update(displayName: string | null, bio: string | null) {
    return this.http.put<ProfileInfo>('/api/profile', { displayName, bio });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<void>('/api/profile/password', { currentPassword, newPassword });
  }

  // A DELETE normally has no body, so the password goes in the options' "body".
  deleteAccount(password: string) {
    return this.http.delete<void>('/api/profile', { body: { password } });
  }
}
