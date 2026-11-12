import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService } from 'primeng/api';
import { ReconciliationService } from '../services/reconciliation.service';
import { Reconciliation } from '../../../core/models/reconciliation.model';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reconciliation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
    TranslatePipe,
  ],
  template: `
    <p-toast />
    <p-confirmdialog />

    <div class="page">
      <div class="page-header">
        <div>
          <h1>{{ 'reconciliations.title' | translate }}</h1>
          <p>{{ 'reconciliations.subtitle' | translate }}</p>
        </div>
        <div class="header-actions">
          <p-button [label]="'nav.accounts' | translate" icon="pi pi-wallet" severity="secondary" [outlined]="true" routerLink="/accounts" />
          <p-button [label]="'reconciliations.new' | translate" icon="pi pi-plus" routerLink="/reconciliations/new" />
        </div>
      </div>

      <div class="panel explainer">
        <i class="pi pi-info-circle"></i>
        <p>{{ 'reconciliations.explainer' | translate }}</p>
      </div>

      @if (isLoading()) {
        <app-loading-spinner />
      } @else if (items().length === 0) {
        <div class="panel empty-state">
          <i class="pi pi-check-square"></i>
          <p>{{ 'reconciliations.empty' | translate }}</p>
        </div>
      } @else {
        <div class="rec-list">
          @for (rec of items(); track rec.id) {
            <div class="panel rec-card">
              <button type="button" class="rec-head" (click)="toggle(rec.id)">
                <div class="rec-date">
                  <i class="pi" [ngClass]="expanded() === rec.id ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                  <strong>{{ rec.date | dateFormat:'dd/MM/yyyy' }}</strong>
                  <span class="muted">· {{ rec.items.length }} {{ 'reconciliations.itemsCount' | translate }}</span>
                </div>
                <div class="rec-totals">
                  <span>{{ 'reconciliations.form.money' | translate }}:
                    <strong [class.positive]="rec.accountsDifference > 0" [class.negative]="rec.accountsDifference < 0">
                      {{ rec.accountsDifference > 0 ? '+' : '' }}{{ rec.accountsDifference | currencyFormat:currency }}
                    </strong>
                  </span>
                  @if (hasCards(rec)) {
                    <span>{{ 'reconciliations.form.debt' | translate }}:
                      <strong [class.negative]="rec.cardsDifference > 0" [class.positive]="rec.cardsDifference < 0">
                        {{ rec.cardsDifference > 0 ? '+' : '' }}{{ rec.cardsDifference | currencyFormat:currency }}
                      </strong>
                    </span>
                  }
                </div>
              </button>

              @if (expanded() === rec.id) {
                <table class="rec-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>{{ 'reconciliations.table.app' | translate }}</th>
                      <th>{{ 'reconciliations.table.real' | translate }}</th>
                      <th>{{ 'reconciliations.table.diff' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of rec.items; track item.id) {
                      <tr>
                        <td>
                          <i class="pi" [ngClass]="item.targetType === 'card' ? 'pi-credit-card' : 'pi-wallet'"></i>
                          {{ item.name }} @if (item.last4) { <span class="muted">•••• {{ item.last4 }}</span> }
                        </td>
                        <td>{{ item.computedAmount | currencyFormat:currency }}</td>
                        <td>{{ item.realAmount | currencyFormat:currency }}</td>
                        <td [class.positive]="item.targetType === 'account' ? item.difference > 0 : item.difference < 0"
                            [class.negative]="item.targetType === 'account' ? item.difference < 0 : item.difference > 0">
                          {{ item.difference > 0 ? '+' : '' }}{{ item.difference | currencyFormat:currency }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (rec.notes) { <p class="rec-notes">{{ rec.notes }}</p> }
                <div class="form-actions">
                  <p-button [label]="'common.delete' | translate" icon="pi pi-trash" severity="danger" [text]="true"
                    size="small" (onClick)="confirmDelete(rec)" />
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['../../accounts/accounts-shared.scss', './reconciliation-list.component.scss'],
})
export class ReconciliationListComponent implements OnInit {
  private service = inject(ReconciliationService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private ts = inject(TranslationService);

  currency = this.authService.currentUser()?.currency ?? 'MXN';
  isLoading = signal(false);
  items = signal<Reconciliation[]>([]);
  expanded = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.service.getAll().subscribe({
      next: (list) => {
        this.items.set(list);
        if (list.length && this.expanded() === null) this.expanded.set(list[0].id);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  toggle(id: string): void {
    this.expanded.update((cur) => (cur === id ? null : id));
  }

  hasCards(rec: Reconciliation): boolean {
    return rec.items.some((i) => i.targetType === 'card');
  }

  confirmDelete(rec: Reconciliation): void {
    this.dialogService.confirm({
      title: this.ts.t('reconciliations.delete.title'),
      message: this.ts.t('reconciliations.delete.message'),
      acceptLabel: this.ts.t('common.delete'),
      rejectLabel: this.ts.t('common.cancel'),
      severity: 'danger',
    }).subscribe((ok) => {
      if (!ok) return;
      this.service.remove(rec.id).subscribe({
        next: () => {
          this.expanded.set(null);
          this.load();
          this.messageService.add({ severity: 'success', summary: '✓', detail: this.ts.t('reconciliations.toast.deleted') });
        },
      });
    });
  }
}
