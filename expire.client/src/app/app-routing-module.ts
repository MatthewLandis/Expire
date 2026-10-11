import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login';
import { Signup } from './auth/signup';

const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Expire' },
  { path: 'login', component: Login, title: 'Login | Expire' },
  { path: 'signup', component: Signup, title: 'Sign up | Expire' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
