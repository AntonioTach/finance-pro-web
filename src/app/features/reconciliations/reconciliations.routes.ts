import { Routes } from '@angular/router';
import { ReconciliationListComponent } from './reconciliation-list/reconciliation-list.component';
import { ReconciliationFormComponent } from './reconciliation-form/reconciliation-form.component';

export const RECONCILIATION_ROUTES: Routes = [
  { path: '', component: ReconciliationListComponent },
  { path: 'new', component: ReconciliationFormComponent },
];
