import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

// Runs before a protected page opens.
// Logged in  -> the page opens.
// Logged out -> sent to the login page instead.
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Ask the server who is logged in, and wait for the answer.
  // Without waiting, a page refresh would look "logged out" for a moment.
  await firstValueFrom(auth.loadUser());

  if (auth.user().authenticated) {
    return true;
  }

  return router.parseUrl('/login');
};

// The opposite, for Log In and Sign Up:
// logged out -> the page opens, logged in -> sent to their fridge.
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await firstValueFrom(auth.loadUser());

  if (auth.user().authenticated) {
    return router.parseUrl('/fridge');
  }

  return true;
};
