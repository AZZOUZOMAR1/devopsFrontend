import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/auth/signin', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path: 'frontoffice',
    canMatch: [AuthGuard],
    canActivate: [AuthGuard],
    loadChildren: () => import('./frontoffice/frontoffice.module').then(m => m.FrontofficeModule)
  },
  {
    path: 'backoffice',
    canMatch: [AuthGuard],
    canActivate: [AuthGuard],
    loadChildren: () => import('./backoffice/backoffice.module').then(m => m.BackofficeModule)
  },
  { path: '**', redirectTo: '/auth/signin' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
