import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionFormComponent } from '../subscription-form/subscription-form.component';
import { SubscriptionPaymentFormComponent } from '../payment-form/subscription-payment-form.component';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { Subscription, SubscriptionPriceHistory } from '../../../core/models/subscription.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.scss'],
})
export class SubscriptionListComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  subscriptions = signal<Subscription[]>([]);
  currency = signal(this.authService.currentUser()?.currency || 'USD');
  expandedRows: Record<string, boolean> = {};

  private readonly today = new Date();
  private readonly currentYear = this.today.getFullYear();
  private readonly currentMonth = this.today.getMonth() + 1;

  activeSubscriptions = computed(() => this.subscriptions().filter((s) => s.isActive));

  monthlyCost = computed(() =>
    this.activeSubscriptions().reduce((sum, s) => sum + Number(s.amount), 0),
  );

  paidThisMonth = computed(() =>
    this.activeSubscriptions().filter((s) => this.isPaidThisMonth(s)),
  );

  pendingThisMonth = computed(() =>
    this.activeSubscriptions().filter((s) => !this.isPaidThisMonth(s)),
  );

  pendingAmount = computed(() =>
    this.pendingThisMonth().reduce((sum, s) => sum + Number(s.amount), 0),
  );

  categoryBreakdown = computed(() => {
    const byCategory = new Map<
      string,
      { categoryId: string; categoryName: string; categoryColor: string; amount: number }
    >();

    for (const subscription of this.activeSubscriptions()) {
      if (!subscription.category) continue;
      const existing = byCategory.get(subscription.category.id);
      if (existing) {
        existing.amount += Number(subscription.amount);
      } else {
        byCategory.set(subscription.category.id, {
          categoryId: subscription.category.id,
          categoryName: subscription.category.name,
          categoryColor: subscription.category.color || '#6366f1',
          amount: Number(subscription.amount),
        });
      }
    }

    return Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
  });

  categoryChartData = computed((): ChartData<'doughnut'> => {
    const data = this.categoryBreakdown();
    return {
      labels: data.map((c) => c.categoryName),
      datasets: [
        {
          data: data.map((c) => c.amount),
          backgroundColor: data.map((c) => c.categoryColor),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  });

  monthlyTrend = computed(() => {
    const totalsByMonth = new Map<string, number>();
    for (const subscription of this.subscriptions()) {
      for (const payment of subscription.payments ?? []) {
        const key = `${payment.periodYear}-${payment.periodMonth}`;
        totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + Number(payment.amount));
      }
    }

    const months: { key: string; label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth - 1 - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      months.push({
        key,
        label: date.toLocaleDateString('es-MX', { month: 'short' }),
        amount: totalsByMonth.get(key) ?? 0,
      });
    }
    return months;
  });

  monthlyTrendChartData = computed((): ChartData<'bar'> => {
    const months = this.monthlyTrend();
    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          data: months.map((m) => m.amount),
          backgroundColor: months.map((m, i) =>
            i === months.length - 1 ? '#6366f1' : 'rgba(99, 102, 241, 0.35)',
          ),
          borderRadius: 6,
          maxBarThickness: 40,
        },
      ],
    };
  });

  trendDelta = computed(() => {
    const months = this.monthlyTrend();
    const current = months[months.length - 1]?.amount ?? 0;
    const previous = months[months.length - 2]?.amount ?? 0;
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  });

  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(148, 163, 184, 0.8)' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.12)' },
        ticks: {
          color: 'rgba(148, 163, 184, 0.8)',
          callback: (value) => this.formatCurrency(Number(value)),
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${this.formatCurrency(context.parsed.y as number)}`,
        },
      },
    },
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return ` ${context.label}: ${this.formatCurrency(value)}/mes`;
          },
        },
      },
    },
  };

  lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: { radius: 3, hoverRadius: 5, backgroundColor: '#6366f1', borderColor: 'transparent' },
      line: { tension: 0.3, borderWidth: 2 },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${this.formatCurrency(context.parsed.y as number)}`,
        },
      },
    },
  };

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.isLoading.set(true);
    this.subscriptionService.getAll().subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading subscriptions:', error);
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las suscripciones',
        });
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialogService.open(SubscriptionFormComponent, {
      header: 'Nueva Suscripción',
      width: '500px',
    });

    ref.onClose.subscribe((result: Subscription | undefined) => {
      if (result) {
        this.loadSubscriptions();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Suscripción creada correctamente',
        });
      }
    });
  }

  openEditDialog(subscription: Subscription): void {
    const ref = this.dialogService.open(SubscriptionFormComponent, {
      header: 'Editar Suscripción',
      width: '500px',
      data: { subscription },
    });

    ref.onClose.subscribe((result: Subscription | undefined) => {
      if (result) {
        this.loadSubscriptions();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Suscripción actualizada correctamente',
        });
      }
    });
  }

  openPaymentDialog(subscription: Subscription): void {
    const ref = this.dialogService.open(SubscriptionPaymentFormComponent, {
      header: `Registrar Pago - ${subscription.name}`,
      width: '460px',
      data: { subscription },
    });

    ref.onClose.subscribe((result: Subscription | undefined) => {
      if (result) {
        this.loadSubscriptions();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pago registrado correctamente',
        });
      }
    });
  }

  confirmDelete(subscription: Subscription): void {
    this.dialogService
      .confirm({
        title: 'Eliminar Suscripción',
        message: `¿Estás seguro de que deseas eliminar "${subscription.name}"? Esta acción no se puede deshacer.`,
        acceptLabel: 'Eliminar',
        rejectLabel: 'Cancelar',
        severity: 'danger',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteSubscription(subscription);
        }
      });
  }

  private deleteSubscription(subscription: Subscription): void {
    this.subscriptionService.delete(subscription.id).subscribe({
      next: () => {
        this.loadSubscriptions();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Suscripción eliminada correctamente',
        });
      },
      error: (error) => {
        console.error('Error deleting subscription:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la suscripción',
        });
      },
    });
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activa' : 'Inactiva';
  }

  getPaymentMethod(subscription: Subscription): string {
    return subscription.card ? subscription.card.name : 'Efectivo';
  }

  isPaidThisMonth(subscription: Subscription): boolean {
    return !!subscription.payments?.some(
      (p) => p.periodYear === this.currentYear && p.periodMonth === this.currentMonth,
    );
  }

  isPaymentDueSoon(subscription: Subscription): boolean {
    if (this.isPaidThisMonth(subscription)) return false;
    const daysUntilPayment = subscription.paymentDay - this.today.getDate();
    return daysUntilPayment >= 0 && daysUntilPayment <= 3;
  }

  getDayOrdinal(day: number): string {
    return `${day}`;
  }

  getLatestPriceChange(subscription: Subscription): SubscriptionPriceHistory | null {
    return subscription.priceHistory?.[0] ?? null;
  }

  getInitialPrice(subscription: Subscription): number {
    const history = subscription.priceHistory;
    if (!history?.length) return Number(subscription.amount);
    return Number(history[history.length - 1].previousAmount);
  }

  getPriceHistoryChartData(subscription: Subscription): ChartData<'line'> {
    const history = [...(subscription.priceHistory ?? [])].reverse();
    const labels = ['Inicio', ...history.map((h) => this.formatShortDate(h.changedAt))];
    const points = [this.getInitialPrice(subscription), ...history.map((h) => Number(h.newAmount))];

    return {
      labels,
      datasets: [
        {
          data: points,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          pointBackgroundColor: '#6366f1',
        },
      ],
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
    }).format(value);
  }

  private formatShortDate(date: string): string {
    return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  toggleRow(subscriptionId: string): void {
    this.expandedRows = {
      ...this.expandedRows,
      [subscriptionId]: !this.expandedRows[subscriptionId],
    };
  }
}
