import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { Home } from './home/home';

const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Expire' },
  { path: 'login', component: Auth, data: { mode: 'login' }, title: 'Login | Expire' },
  { path: 'signup', component: Auth, data: { mode: 'signup' }, title: 'Sign up | Expire' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
