import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService } from 'primeng/api';
import { CardService } from '../services/card.service';
import { CardFormComponent } from '../card-form/card-form.component';
import { CardSummary, CardType, Card } from '../../../core/models/card.model';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-card-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  template: `
    <p-toast />
    <p-confirmdialog />
    <div class="card-dashboard">
      <div class="page-header">
        <h1>Tarjetas</h1>
        <p-button
          label="Agregar Tarjeta"
          icon="pi pi-plus"
          (onClick)="openAddDialog()"
        />
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <app-loading-spinner></app-loading-spinner>
        </div>
      } @else if (cardSummaries().length === 0) {
        <div class="empty-state">
          <i class="pi pi-credit-card empty-icon"></i>
          <h3>No hay tarjetas registradas</h3>
          <p>Agrega tu primera tarjeta para comenzar a rastrear tus gastos</p>
          <p-button
            label="Agregar Tarjeta"
            icon="pi pi-plus"
            (onClick)="openAddDialog()"
          />
        </div>
      } @else {
        <p-table
          [value]="cardSummaries()"
          [paginator]="false"
          styleClass="p-datatable-striped"
        >
          <ng-template #header>
            <tr>
              <th>Tarjeta</th>
              <th>Tipo</th>
              <th class="text-right">Adeudo</th>
              <th class="text-right">Crédito Disponible</th>
              <th>Próximo Corte</th>
              <th>Fecha de Pago</th>
              <th class="text-center">Acciones</th>
            </tr>
          </ng-template>
          <ng-template #body let-card>
            <tr>
              <td>
                <div class="card-info">
                  <span class="card-name">{{ card.cardName }}</span>
                  @if (card.last4) {
                    <small class="card-last4">•••• {{ card.last4 }}</small>
                  }
                </div>
              </td>
              <td>
                <p-tag
                  [value]="card.cardType === 'credit' ? 'Crédito' : 'Débito'"
                  [severity]="card.cardType === 'credit' ? 'info' : 'secondary'"
                />
              </td>
              <td class="text-right">
                @if (card.cardType === 'credit') {
                  <span class="debt-amount" [class.has-debt]="card.outstandingDebt > 0">
                    {{ card.outstandingDebt | currencyFormat:card.currency }}
                  </span>
                } @else {
                  <span class="na">N/A</span>
                }
              </td>
              <td class="text-right">
                @if (card.cardType === 'credit') {
                  <span class="available-credit">
                    {{ card.availableCredit | currencyFormat:card.currency }}
                  </span>
                  <small class="credit-limit">
                    / {{ card.creditLimit | currencyFormat:card.currency }}
                  </small>
                } @else {
                  <span class="na">N/A</span>
                }
              </td>
              <td>
                @if (card.cardType === 'credit' && card.nextCutoffDate) {
                  {{ card.nextCutoffDate | dateFormat:'MMM dd, yyyy' }}
                } @else {
                  <span class="na">N/A</span>
                }
              </td>
              <td>
                @if (card.cardType === 'credit' && card.nextDueDate) {
                  <span [class.due-soon]="isDueSoon(card.nextDueDate)">
                    {{ card.nextDueDate | dateFormat:'MMM dd, yyyy' }}
                  </span>
                } @else {
                  <span class="na">N/A</span>
                }
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    (onClick)="openEditDialog(card)"
                    pTooltip="Editar"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    (onClick)="confirmDelete(card)"
                    pTooltip="Eliminar"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
  styles: [`
    .card-dashboard {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
    }

    .empty-icon {
      font-size: 4rem;
      color: var(--text-color-secondary);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-color);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: var(--text-color-secondary);
    }

    .card-info {
      display: flex;
      flex-direction: column;
    }

    .card-name {
      font-weight: 500;
    }

    .card-last4 {
      color: var(--text-color-secondary);
      font-size: 0.8rem;
    }

    .debt-amount {
      font-weight: 600;
    }

    .debt-amount.has-debt {
      color: var(--red-500);
    }

    .available-credit {
      font-weight: 600;
      color: var(--green-500);
    }

    .credit-limit {
      color: var(--text-color-secondary);
      margin-left: 0.25rem;
    }

    .na {
      color: var(--text-color-secondary);
      font-style: italic;
    }

    .due-soon {
      color: var(--orange-500);
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }
  `],
})
export class CardDashboardComponent implements OnInit {
  private cardService = inject(CardService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  cardSummaries = signal<CardSummary[]>([]);

  ngOnInit(): void {
    this.loadCardSummaries();
  }

  loadCardSummaries(): void {
    this.isLoading.set(true);
    this.cardService.getAllSummaries().subscribe({
      next: (summaries) => {
        this.cardSummaries.set(summaries);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading card summaries:', error);
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las tarjetas',
        });
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialogService.open(CardFormComponent, {
      header: 'Agregar Tarjeta',
      width: '500px',
      modal: true,
    });

    ref.onClose.subscribe((result: Card | undefined) => {
      if (result) {
        this.loadCardSummaries();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tarjeta creada correctamente',
        });
      }
    });
  }

  openEditDialog(card: CardSummary): void {
    // First, fetch the full card data
    this.cardService.getById(card.cardId).subscribe({
      next: (fullCard) => {
        const ref = this.dialogService.open(CardFormComponent, {
          header: 'Editar Tarjeta',
          width: '500px',
          modal: true,
          data: { card: fullCard },
        });

        ref.onClose.subscribe((result: Card | undefined) => {
          if (result) {
            this.loadCardSummaries();
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Tarjeta actualizada correctamente',
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading card:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la tarjeta',
        });
      },
    });
  }

  confirmDelete(card: CardSummary): void {
    this.dialogService.confirm({
      message: `¿Estás seguro de que deseas eliminar la tarjeta "${card.cardName}"?`,
      title: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      severity: 'danger',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.cardService.delete(card.cardId).subscribe({
          next: () => {
            this.loadCardSummaries();
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Tarjeta eliminada correctamente',
            });
          },
          error: (error) => {
            console.error('Error deleting card:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la tarjeta',
            });
          },
        });
      }
    });
  }

  isDueSoon(dueDate: string): boolean {
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }
}
