import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { DebtService } from '../services/debt.service';
import { DebtFormComponent } from '../debt-form/debt-form.component';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { Debt, DebtPayment } from '../../../core/models/debt.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-debt-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ToastModule,
    TabsModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    TranslatePipe,
  ],
  templateUrl: './debt-list.component.html',
  styleUrls: ['./debt-list.component.scss'],
})
export class DebtListComponent implements OnInit {
  private debtService = inject(DebtService);
  private authService = inject(AuthService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  debts = signal<Debt[]>([]);
  currency = signal(this.authService.currentUser()?.currency ?? 'MXN');

  iOwe = computed(() => this.debts().filter(d => d.direction === 'owed_by_me'));
  owedToMe = computed(() => this.debts().filter(d => d.direction === 'owed_to_me'));

  totalIOwe = computed(() =>
    this.iOwe().filter(d => d.status === 'active')
      .reduce((s, d) => s + this.remaining(d), 0),
  );
  totalOwedToMe = computed(() =>
    this.owedToMe().filter(d => d.status === 'active')
      .reduce((s, d) => s + this.remaining(d), 0),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.debtService.getAll().subscribe({
      next: (debts) => { this.debts.set(debts); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las deudas' });
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialogService.open(DebtFormComponent, {
      header: 'Nueva deuda',
      width: '520px',
    });
    ref.onClose.subscribe((result: Debt | undefined) => {
      if (result) {
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Deuda creada' });
      }
    });
  }

  openEditDialog(debt: Debt): void {
    const ref = this.dialogService.open(DebtFormComponent, {
      header: 'Editar deuda',
      width: '520px',
      data: { debt },
    });
    ref.onClose.subscribe((result: Debt | undefined) => {
      if (result) {
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Deuda actualizada' });
      }
    });
  }

  openPaymentDialog(debt: Debt): void {
    const ref = this.dialogService.open(PaymentFormComponent, {
      header: `Registrar pago — ${debt.description}`,
      width: '460px',
      data: { debt, currency: this.currency() },
    });
    ref.onClose.subscribe((result: Debt | undefined) => {
      if (result) {
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado' });
      }
    });
  }

  confirmDelete(debt: Debt): void {
    this.dialogService.confirm({
      title: 'Eliminar deuda',
      message: `¿Eliminar "${debt.description}"? Esta acción no se puede deshacer.`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      severity: 'danger',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.debtService.remove(debt.id).subscribe({
          next: () => {
            this.load();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Deuda eliminada' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la deuda' }),
        });
      }
    });
  }

  confirmDeletePayment(debt: Debt, payment: DebtPayment): void {
    this.dialogService.confirm({
      title: 'Eliminar pago',
      message: '¿Seguro que deseas eliminar este pago?',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      severity: 'danger',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.debtService.removePayment(debt.id, payment.id).subscribe({
          next: () => {
            this.load();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago eliminado' });
          },
        });
      }
    });
  }

  markComplete(debt: Debt): void {
    this.debtService.update(debt.id, { status: 'completed' }).subscribe({
      next: () => {
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Completada', detail: 'Deuda marcada como saldada' });
      },
    });
  }

  paid(debt: Debt): number {
    return debt.payments.reduce((s, p) => s + Number(p.amount), 0);
  }

  remaining(debt: Debt): number {
    return Math.max(0, Number(debt.totalAmount) - this.paid(debt));
  }

  progress(debt: Debt): number {
    const total = Number(debt.totalAmount);
    if (!total) return 0;
    return Math.min(100, Math.round((this.paid(debt) / total) * 100));
  }

  installmentProgress(debt: Debt): string {
    if (!debt.installments) return '';
    return `${debt.payments.length}/${debt.installments}`;
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    if (status === 'active') return 'warn';
    if (status === 'completed') return 'success';
    return 'secondary';
  }

  statusLabel(status: string): string {
    if (status === 'active') return 'Activa';
    if (status === 'completed') return 'Saldada';
    return 'Cancelada';
  }

  isOverdue(debt: Debt): boolean {
    if (!debt.dueDate || debt.status !== 'active') return false;
    return new Date(debt.dueDate) < new Date();
  }
}
