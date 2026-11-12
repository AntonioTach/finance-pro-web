import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Account,
  AccountBalances,
  AccountTransfer,
  CreateAccountDto,
  CreateTransferDto,
  UpdateAccountDto,
} from '../../../core/models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Account[]> {
    return this.api.get<Account[]>('/accounts');
  }

  getBalances(asOf?: string): Observable<AccountBalances> {
    return this.api.get<AccountBalances>('/accounts/balances', { asOf });
  }

  create(dto: CreateAccountDto): Observable<Account> {
    return this.api.post<Account>('/accounts', dto);
  }

  update(id: string, dto: UpdateAccountDto): Observable<Account> {
    return this.api.patch<Account>(`/accounts/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/accounts/${id}`);
  }

  getTransfers(accountId?: string): Observable<AccountTransfer[]> {
    return this.api.get<AccountTransfer[]>('/accounts/transfers', { accountId });
  }

  createTransfer(dto: CreateTransferDto): Observable<AccountTransfer> {
    return this.api.post<AccountTransfer>('/accounts/transfers', dto);
  }

  removeTransfer(id: string): Observable<void> {
    return this.api.delete<void>(`/accounts/transfers/${id}`);
  }
}
