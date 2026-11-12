import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { AccountService } from '../services/account.service';
import { AccountFormComponent } from '../account-form/account-form.component';
import { TransferFormComponent } from '../transfer-form/transfer-form.component';
import { Account, AccountTransfer, ACCOUNT_TYPE_ICONS } from '../../../core/models/account.model';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
    TranslatePipe,
  ],
  templateUrl: './account-list.component.html',
  styleUrls: ['../accounts-shared.scss', './account-list.component.scss'],
})
export class AccountListComponent implements OnInit {
  private accountService = inject(AccountService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private ts = inject(TranslationService);

  isLoading = signal(false);
  accounts = signal<Account[]>([]);
  transfers = signal<AccountTransfer[]>([]);
  currency = signal(this.authService.currentUser()?.currency ?? 'MXN');

  total = computed(() => this.accounts().reduce((s, a) => s + a.balance, 0));
  icons = ACCOUNT_TYPE_ICONS;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    forkJoin({
      accounts: this.accountService.getAll(),
      transfers: this.accountService.getTransfers(),
    }).subscribe({
      next: ({ accounts, transfers }) => {
        this.accounts.set(accounts);
        this.transfers.set(transfers.slice(0, 15));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast('error', this.ts.t('accounts.toast.loadError'));
      },
    });
  }

  openAccountDialog(account?: Account): void {
    const ref = this.dialogService.open(AccountFormComponent, {
      header: this.ts.t(account ? 'accounts.edit' : 'accounts.add'),
      width: '460px',
      data: { account },
    });
    ref.onClose.subscribe((result) => {
      if (result) {
        this.load();
        this.toast('success', this.ts.t('accounts.toast.saved'));
      }
    });
  }

  openTransferDialog(): void {
    const ref = this.dialogService.open(TransferFormComponent, {
      header: this.ts.t('accounts.transfer.title'),
      width: '460px',
      data: { accounts: this.accounts(), currency: this.currency() },
    });
    ref.onClose.subscribe((result) => {
      if (result) {
        this.load();
        this.toast('success', this.ts.t('accounts.toast.transferSaved'));
      }
    });
  }

  makeDefault(account: Account): void {
    this.accountService.update(account.id, { isDefault: true }).subscribe({
      next: () => this.load(),
    });
  }

  confirmDelete(account: Account): void {
    this.dialogService.confirm({
      title: this.ts.t('accounts.delete.title'),
      message: this.ts.t('accounts.delete.message').replace('{name}', account.name),
      acceptLabel: this.ts.t('common.delete'),
      rejectLabel: this.ts.t('common.cancel'),
      severity: 'danger',
    }).subscribe((ok) => {
      if (!ok) return;
      this.accountService.remove(account.id).subscribe({
        next: () => { this.load(); this.toast('success', this.ts.t('accounts.toast.deleted')); },
        error: () => this.toast('error', this.ts.t('accounts.toast.deleteError')),
      });
    });
  }

  confirmDeleteTransfer(transfer: AccountTransfer): void {
    this.dialogService.confirm({
      title: this.ts.t('accounts.transfer.deleteTitle'),
      message: this.ts.t('accounts.transfer.deleteMessage'),
      acceptLabel: this.ts.t('common.delete'),
      rejectLabel: this.ts.t('common.cancel'),
      severity: 'danger',
    }).subscribe((ok) => {
      if (!ok) return;
      this.accountService.removeTransfer(transfer.id).subscribe({ next: () => this.load() });
    });
  }

  typeLabel(account: Account): string {
    return this.ts.t(`accounts.type.${account.type}`);
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({ severity, summary: severity === 'success' ? '✓' : 'Error', detail });
  }
}
