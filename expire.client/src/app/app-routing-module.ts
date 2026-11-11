import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login';
import { Signup } from './auth/signup';
import { Profile } from './profile/profile';
import { Fridge } from './fridge/fridge';
import { authGuard, guestGuard } from './auth/auth.guard';

// authGuard  = logged-in users only
// guestGuard = logged-out users only
const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Expire' },
  { path: 'login', component: Login, title: 'Log In | Expire', canActivate: [guestGuard] },
  { path: 'signup', component: Signup, title: 'Sign Up | Expire', canActivate: [guestGuard] },
  { path: 'fridge', component: Fridge, title: 'My Fridge | Expire', canActivate: [authGuard] },
  { path: 'profile', component: Profile, title: 'My Profile | Expire', canActivate: [authGuard] },

  // Any other address (a typo, an old link) goes back to the home page.
  // This has to stay last: the router uses the first route that matches.
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
