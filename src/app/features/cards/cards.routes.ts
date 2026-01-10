import { Routes } from '@angular/router';

export const CARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./card-dashboard/card-dashboard.component').then(
        (m) => m.CardDashboardComponent,
      ),
  },
];
