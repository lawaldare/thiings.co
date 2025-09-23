import { Routes } from '@angular/router';
import { App } from './app';
import { Portfolio } from './portfolio/portfolio';
import { Home } from './home/home';

export const routes: Routes = [
  { path: 'home', component: Home },
  { path: 'portfolio', component: Portfolio },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
