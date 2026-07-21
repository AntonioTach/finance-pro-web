import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
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

  toggleRow(subscriptionId: string): void {
    this.expandedRows = {
      ...this.expandedRows,
      [subscriptionId]: !this.expandedRows[subscriptionId],
    };
  }
}
