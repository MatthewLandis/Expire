import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login';
import { Signup } from './auth/signup';
import { Profile } from './profile/profile';
import { Fridge } from './fridge/fridge';
import { Themes } from './themes/themes';
import { Settings } from './settings/settings';

const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Expire' },
  { path: 'login', component: Login, title: 'Login | Expire' },
  { path: 'signup', component: Signup, title: 'Sign up | Expire' },
  { path: 'profile', component: Profile, title: 'Profile' },
  { path: 'fridge', component: Fridge, title: 'Fridge' },
  { path: 'themes', component: Themes, title: 'Themes' },
  { path: 'settings', component: Settings, title: 'Settings' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
