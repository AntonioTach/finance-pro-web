import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { OverviewReportComponent } from './overview-report/overview-report.component';
import { CategoryReportComponent } from './category-report/category-report.component';
import { TransactionReportComponent } from './transaction-report/transaction-report.component';
import { CardReportComponent } from './card-report/card-report.component';
import { SubscriptionReportComponent } from './subscription-report/subscription-report.component';
import { TrendReportComponent } from './trend-report/trend-report.component';
import { BudgetReportComponent } from './budget-report/budget-report.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    OverviewReportComponent,
    CategoryReportComponent,
    TransactionReportComponent,
    CardReportComponent,
    SubscriptionReportComponent,
    TrendReportComponent,
    BudgetReportComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {}
