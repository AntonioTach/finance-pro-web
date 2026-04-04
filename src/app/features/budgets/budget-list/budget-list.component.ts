import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BudgetService } from '../services/budget.service';
import { BudgetFormComponent } from '../budget-form/budget-form.component';
import { BudgetDetailComponent } from '../budget-detail/budget-detail.component';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { BudgetDashboard, BudgetProgress, BudgetAlert } from '../../../core/models/budget.model';
import { BudgetAlertStateService } from '../services/budget-alert-state.service';
import { BudgetInfoComponent } from '../components/budget-info/budget-info.component';
import { CategoryIconComponent } from '../../../shared/components/category-icon/category-icon.component';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    TranslatePipe,
    BudgetInfoComponent,
    CategoryIconComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-confirmdialog />

    <div class="budget-page">
      <!-- Header -->
      <header class="budget-header">
        <div class="header-left">
          <h1>{{ 'budgets.title' | translate }}</h1>
          <p>{{ 'budgets.subtitle' | translate }}</p>
        </div>
        <p-button
          icon="pi pi-plus"
          [label]="'budgets.new' | translate"
          (onClick)="openForm()"
        />
      </header>

      <!-- Info panel -->
      <app-budget-info />

      <!-- Loading -->
      @if (isLoading()) {
        <app-loading-spinner />
      }

      @if (!isLoading() && dashboard()) {
        <!-- Global summary -->
        <div class="summary-bar">
          <div class="summary-card">
            <span class="summary-label">{{ 'budgets.summary.budgeted' | translate }}</span>
            <span class="summary-value">{{ dashboard()!.totalBudgeted | currencyFormat:currency() }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-card">
            <span class="summary-label">{{ 'budgets.summary.spent' | translate }}</span>
            <span class="summary-value" [class.text-danger]="dashboard()!.globalPercentage >= 100">
              {{ dashboard()!.totalSpent | currencyFormat:currency() }}
            </span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-card">
            <span class="summary-label">{{ 'budgets.summary.remaining' | translate }}</span>
            <span class="summary-value" [class.text-danger]="dashboard()!.totalRemaining < 0">
              {{ dashboard()!.totalRemaining | currencyFormat:currency() }}
            </span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-card summary-card--progress">
            <span class="summary-label">{{ 'budgets.summary.global' | translate }}</span>
            <div class="global-progress-wrap">
              <div class="global-progress-track">
                <div
                  class="global-progress-fill"
                  [class.fill-warning]="dashboard()!.globalPercentage >= 80 && dashboard()!.globalPercentage < 100"
                  [class.fill-danger]="dashboard()!.globalPercentage >= 100"
                  [style.width.%]="min100(dashboard()!.globalPercentage)"
                ></div>
              </div>
              <span class="global-pct" [class.text-danger]="dashboard()!.globalPercentage >= 100">
                {{ dashboard()!.globalPercentage | number:'1.0-0' }}%
              </span>
            </div>
          </div>

          @if (dashboard()!.unreadAlerts > 0) {
            <div class="alert-badge-wrap" (click)="toggleAlerts()">
              <i class="pi pi-bell"></i>
              <span class="alert-count">{{ dashboard()!.unreadAlerts }}</span>
            </div>
          }
        </div>

        <!-- Alerts panel -->
        @if (showAlerts()) {
          <div class="alerts-panel">
            <div class="alerts-header">
              <span class="alerts-title">
                <i class="pi pi-bell"></i>
                {{ 'budgets.alerts.title' | translate }}
              </span>
              <button class="mark-all-btn" (click)="markAllRead()">
                {{ 'budgets.alerts.markAll' | translate }}
              </button>
            </div>

            @if (alertsLoading()) {
              <app-loading-spinner />
            }

            @if (!alertsLoading() && alerts().length === 0) {
              <p class="alerts-empty">{{ 'budgets.alerts.empty' | translate }}</p>
            }

            @for (alert of alerts(); track alert.id) {
              <div class="alert-row" [class]="'alert-row--' + alertSeverity(alert.type)">
                <i class="pi" [ngClass]="alertIcon(alert.type)"></i>
                <span class="alert-msg">{{ alert.message }}</span>
                <button class="alert-dismiss" (click)="markAlertRead(alert)" title="Marcar como leída">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            }
          </div>
        }

        <!-- Budget grid -->
        @if (dashboard()!.budgets.length === 0) {
          <!-- Empty state -->
          <div class="empty-state">
            <div class="empty-icon"><i class="pi pi-wallet"></i></div>
            <h2>{{ 'budgets.empty.title' | translate }}</h2>
            <p>{{ 'budgets.empty.desc' | translate }}</p>
            <p-button
              [label]="'budgets.empty.cta' | translate"
              icon="pi pi-plus"
              (onClick)="openForm()"
            />
          </div>
        } @else {
          <div class="budget-grid">
            @for (item of dashboard()!.budgets; track item.budget.id) {
              <div
                class="budget-card"
                [class.card-warning]="item.percentage >= item.budget.alertThreshold && item.percentage < 100"
                [class.card-danger]="item.isExceeded"
                (click)="openDetail(item)"
              >
                <!-- Card header -->
                <div class="card-header">
                  <div class="card-icon" [style.background]="item.budget.category?.color + '22'">
                    <app-cat-icon [icon]="item.budget.category?.icon" />
                  </div>
                  <div class="card-title-wrap">
                    <span class="card-name">{{ item.budget.name || item.budget.category?.name }}</span>
                    <span class="card-period">{{ periodLabel(item.budget.period) }}</span>
                  </div>
                  <span class="card-status-chip" [class]="statusClass(item)">
                    {{ statusLabel(item) | translate }}
                  </span>
                </div>

                <!-- Amounts -->
                <div class="card-amounts">
                  <span class="card-spent">{{ item.spent | currencyFormat:currency() }}</span>
                  <span class="card-sep">/</span>
                  <span class="card-amount">{{ item.budget.amount | currencyFormat:currency() }}</span>
                </div>

                <!-- Progress bar -->
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    [class.fill-warning]="item.percentage >= item.budget.alertThreshold && !item.isExceeded"
                    [class.fill-danger]="item.isExceeded"
                    [style.width.%]="min100(item.percentage)"
                  ></div>
                </div>

                <!-- Footer -->
                <div class="card-footer">
                  @if (item.isExceeded) {
                    <span class="footer-exceeded">
                      <i class="pi pi-exclamation-triangle"></i>
                      {{ 'budgets.card.exceeded' | translate }}
                      {{ (item.spent - item.budget.amount) | currencyFormat:currency() }}
                    </span>
                  } @else {
                    <span class="footer-remaining">
                      {{ item.remaining | currencyFormat:currency() }}
                      {{ 'budgets.card.remaining' | translate }}
                    </span>
                  }
                  <span class="footer-days">{{ item.daysLeft }} días</span>
                </div>

                <!-- Actions -->
                <div class="card-actions" (click)="$event.stopPropagation()">
                  <button class="action-btn" (click)="openForm(item)" title="Editar">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="action-btn action-btn--danger" (click)="confirmDelete(item)" title="Eliminar">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .budget-page {
      padding: 1.75rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────────────── */
    .budget-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-left h1 {
      margin: 0 0 0.25rem;
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.03em;
    }
    .header-left p { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }

    /* ── Summary bar ─────────────────────────────── */
    .summary-bar {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .summary-card { display: flex; flex-direction: column; gap: 0.25rem; min-width: 120px; }
    .summary-card--progress { flex: 1; min-width: 180px; }
    .summary-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .summary-value { font-size: 1.25rem; font-weight: 700; color: var(--text-color); }
    .summary-divider { width: 1px; height: 40px; background: var(--border-color); flex-shrink: 0; }

    .global-progress-wrap { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem; }
    .global-progress-track { flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 999px; overflow: hidden; }
    .global-progress-fill { height: 100%; background: var(--gradient-primary); border-radius: 999px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
    .global-pct { font-size: 0.9rem; font-weight: 700; color: var(--text-color); min-width: 42px; text-align: right; }

    .alert-badge-wrap {
      display: flex; align-items: center; justify-content: center;
      position: relative; cursor: pointer; margin-left: auto;
      width: 40px; height: 40px;
    }
    .alert-badge-wrap i { font-size: 1.1rem; color: var(--text-secondary); }
    .alert-count {
      position: absolute; top: 2px; right: 2px;
      background: var(--danger-color, #ef4444);
      color: #fff; border-radius: 999px;
      font-size: 0.65rem; font-weight: 700;
      min-width: 16px; height: 16px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px;
    }

    /* ── Budget grid ─────────────────────────────── */
    .budget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .budget-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
      position: relative;
    }
    .budget-card:hover { border-color: var(--primary-color); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .budget-card.card-warning { border-color: rgba(245,158,11,0.4); }
    .budget-card.card-danger  { border-color: rgba(239,68,68,0.4); }

    .card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .card-icon {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-icon i { font-size: 1.1rem; }
    .card-title-wrap { flex: 1; min-width: 0; }
    .card-name { display: block; font-weight: 700; font-size: 0.95rem; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-period { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem; }

    .card-status-chip {
      padding: 0.2rem 0.6rem; border-radius: 999px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
      flex-shrink: 0;
    }
    .chip-ok      { background: rgba(34,197,94,0.12);  color: var(--success-color, #22c55e); }
    .chip-warning { background: rgba(245,158,11,0.12); color: var(--warning-color, #f59e0b); }
    .chip-danger  { background: rgba(239,68,68,0.12);  color: var(--danger-color, #ef4444); }

    .card-amounts { display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.75rem; }
    .card-spent { font-size: 1.4rem; font-weight: 800; color: var(--text-color); }
    .card-sep   { color: var(--text-muted); font-size: 0.9rem; }
    .card-amount { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }

    .progress-track { height: 8px; background: var(--bg-secondary); border-radius: 999px; overflow: hidden; margin-bottom: 0.75rem; }
    .progress-fill { height: 100%; background: var(--gradient-primary); border-radius: 999px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
    .fill-warning { background: linear-gradient(90deg, #f59e0b, #f97316) !important; }
    .fill-danger  { background: linear-gradient(90deg, #ef4444, #dc2626) !important; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; margin-bottom: 0.75rem; }
    .footer-remaining { color: var(--text-secondary); }
    .footer-exceeded  { color: var(--danger-color, #ef4444); font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
    .footer-days { color: var(--text-muted); }

    .card-actions {
      display: flex; justify-content: flex-end; gap: 0.5rem;
      border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0;
    }
    .action-btn {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border-color);
      background: transparent; cursor: pointer; color: var(--text-muted);
      transition: background 0.15s, color 0.15s;
    }
    .action-btn:hover { background: var(--bg-secondary); color: var(--text-color); }
    .action-btn--danger:hover { background: rgba(239,68,68,0.1); color: var(--danger-color, #ef4444); border-color: rgba(239,68,68,0.3); }

    /* ── Empty state ─────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 5rem 2rem; gap: 1rem;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--primary-subtle, rgba(99,102,241,0.1));
      display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;
    }
    .empty-icon i { font-size: 1.75rem; color: var(--primary-color); }
    .empty-state h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--text-color); }
    .empty-state p  { margin: 0; color: var(--text-secondary); max-width: 380px; }

    /* ── Alerts panel ────────────────────────────── */
    .alerts-panel {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      animation: slide-down 0.2s ease;
    }
    @keyframes slide-down {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .alerts-header { display: flex; justify-content: space-between; align-items: center; }
    .alerts-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-color); text-transform: uppercase; letter-spacing: 0.04em; }
    .alerts-title i { color: var(--warning-color, #f59e0b); }
    .mark-all-btn { background: none; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; color: var(--primary-color); padding: 0; }
    .alerts-empty { margin: 0; font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0; }

    .alert-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.83rem; color: var(--text-secondary); }
    .alert-row--warning { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); }
    .alert-row--warning i { color: var(--warning-color, #f59e0b); }
    .alert-row--danger  { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.2); }
    .alert-row--danger  i { color: var(--danger-color, #ef4444); }
    .alert-row--success { background: rgba(34,197,94,0.08);  border: 1px solid rgba(34,197,94,0.2); }
    .alert-row--success i { color: var(--success-color, #22c55e); }
    .alert-row--info    { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); }
    .alert-row--info    i { color: var(--primary-color); }
    .alert-msg { flex: 1; line-height: 1.4; }
    .alert-dismiss { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.25rem; border-radius: 6px; display: flex; align-items: center; font-size: 0.75rem; flex-shrink: 0; transition: color 0.15s; }
    .alert-dismiss:hover { color: var(--text-color); }

    /* ── Utilities ───────────────────────────────── */
    .text-danger { color: var(--danger-color, #ef4444) !important; }

    @media (max-width: 640px) {
      .budget-page { padding: 1rem; }
      .summary-bar { gap: 0.75rem; padding: 1rem; }
      .summary-divider { display: none; }
      .budget-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class BudgetListComponent implements OnInit {
  private budgetService  = inject(BudgetService);
  private authService    = inject(AuthService);
  private dialogService  = inject(AppDialogService);
  private messageService = inject(MessageService);
  private i18n           = inject(TranslationService);

  private alertState = inject(BudgetAlertStateService);

  isLoading    = signal(false);
  dashboard    = signal<BudgetDashboard | null>(null);
  currency     = signal(this.authService.currentUser()?.currency ?? 'MXN');
  showAlerts   = signal(false);
  alerts       = signal<BudgetAlert[]>([]);
  alertsLoading = signal(false);

  ngOnInit(): void {
    this.load();
    this.alertState.refresh();
  }

  load(): void {
    this.isLoading.set(true);
    this.budgetService.getDashboard().subscribe({
      next: (data) => { this.dashboard.set(data); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.t('budgets.error.load') });
      },
    });
  }

  openForm(item?: BudgetProgress): void {
    const isEdit = !!item;
    const ref = this.dialogService.open(BudgetFormComponent, {
      header: isEdit ? this.t('budgets.edit') : this.t('budgets.new'),
      width: '560px',
      data: { progress: item, currency: this.currency() },
    });
    ref.onClose.subscribe((result: any) => {
      if (result) {
        this.load();
        this.messageService.add({
          severity: 'success',
          summary: 'OK',
          detail: isEdit ? this.t('budgets.success.updated') : this.t('budgets.success.created'),
        });
      }
    });
  }

  openDetail(item: BudgetProgress): void {
    this.dialogService.open(BudgetDetailComponent, {
      header: item.budget.name || item.budget.category?.name || this.t('budgets.detail.title'),
      width: '680px',
      data: { progress: item, currency: this.currency() },
    });
  }

  confirmDelete(item: BudgetProgress): void {
    const name = item.budget.name || item.budget.category?.name || '';
    this.dialogService.confirm({
      title: this.t('budgets.delete'),
      message: this.t('budgets.deleteMsg').replace('{name}', name),
      acceptLabel: this.t('common.delete'),
      rejectLabel: this.t('common.cancel'),
      severity: 'danger',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.budgetService.delete(item.budget.id).subscribe({
          next: () => {
            this.load();
            this.messageService.add({ severity: 'success', summary: 'OK', detail: this.t('budgets.success.deleted') });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: this.t('budgets.error.save') }),
        });
      }
    });
  }

  // ── Alerts ────────────────────────────────────────────────

  toggleAlerts(): void {
    const next = !this.showAlerts();
    this.showAlerts.set(next);
    if (next && this.alerts().length === 0) {
      this.loadAlerts();
    }
  }

  loadAlerts(): void {
    this.alertsLoading.set(true);
    this.budgetService.getAlerts().subscribe({
      next: (a) => { this.alerts.set(a); this.alertsLoading.set(false); },
      error: () => this.alertsLoading.set(false),
    });
  }

  markAlertRead(alert: BudgetAlert): void {
    this.budgetService.markAlertRead(alert.id).subscribe({
      next: () => {
        this.alerts.update(list => list.filter(a => a.id !== alert.id));
        this.alertState.decrement();
        if (this.alerts().length === 0) {
          this.showAlerts.set(false);
          this.load(); // refresh dashboard unread count
        }
      },
    });
  }

  markAllRead(): void {
    this.budgetService.markAllAlertsRead().subscribe({
      next: () => {
        this.alerts.set([]);
        this.alertState.reset();
        this.showAlerts.set(false);
        this.load();
      },
    });
  }

  alertSeverity(type: string): string {
    if (type === 'renewal') return 'success';
    if (type === 'threshold_50') return 'info';
    if (type === 'burn_rate' || type === 'threshold_80') return 'warning';
    return 'danger'; // threshold_100, exceeded
  }

  alertIcon(type: string): string {
    if (type === 'renewal') return 'pi-refresh';
    if (type === 'burn_rate') return 'pi-chart-line';
    if (type === 'exceeded' || type === 'threshold_100') return 'pi-exclamation-triangle';
    return 'pi-bell';
  }

  // ── Helpers ────────────────────────────────────────────────

  min100(v: number): number { return Math.min(v, 100); }

  statusClass(item: BudgetProgress): string {
    if (item.isExceeded) return 'card-status-chip chip-danger';
    if (item.percentage >= item.budget.alertThreshold) return 'card-status-chip chip-warning';
    return 'card-status-chip chip-ok';
  }

  statusLabel(item: BudgetProgress): string {
    if (item.isExceeded) return 'budgets.card.status.danger';
    if (item.percentage >= item.budget.alertThreshold) return 'budgets.card.status.warning';
    return 'budgets.card.status.ok';
  }

  periodLabel(period: string): string {
    const map: Record<string, string> = {
      weekly: 'Semanal', biweekly: 'Quincenal',
      monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizado',
    };
    return map[period] ?? period;
  }

  private t(key: string): string {
    return this.i18n.t(key);
  }
}
