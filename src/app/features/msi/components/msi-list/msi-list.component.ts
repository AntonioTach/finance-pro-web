import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MsiService } from '../../services/msi.service';
import { MsiGroupSummary, MsiGroupStatus } from '../../models/msi.model';
import { MsiScheduleDialogComponent, MsiScheduleDialogResult } from '../msi-schedule-dialog/msi-schedule-dialog.component';
import { AppDialogService } from '../../../../shared/services/dialog.service';
import { CardService } from '../../../cards/services/card.service';
import { Card, CardType } from '../../../../core/models/card.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';

type StatusFilter = MsiGroupStatus | 'all';

@Component({
  selector: 'app-msi-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    SelectModule,
    SelectButtonModule,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  templateUrl: './msi-list.component.html',
  styleUrls: ['./msi-list.component.scss'],
})
export class MsiListComponent implements OnInit {
  private msiService = inject(MsiService);
  private cardService = inject(CardService);
  private dialogService = inject(AppDialogService);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  groups = signal<MsiGroupSummary[]>([]);
  creditCards = signal<Card[]>([]);

  statusFilterValue: StatusFilter = 'active';
  cardFilterValue: string | null = null;

  statusOptions = [
    { label: 'Activas', value: 'active' as StatusFilter },
    { label: 'Terminadas', value: 'completed' as StatusFilter },
    { label: 'Todas', value: 'all' as StatusFilter },
  ];

  cardOptions = computed(() =>
    this.creditCards().map((card) => ({
      label: card.last4 ? `${card.name} •••• ${card.last4}` : card.name,
      value: card.id,
    })),
  );

  ngOnInit(): void {
    this.cardFilterValue = this.route.snapshot.queryParamMap.get('cardId');

    this.cardService.getAll().subscribe({
      next: (cards) => this.creditCards.set(cards.filter((c) => c.type === CardType.CREDIT)),
      error: (error) => console.error('Error loading cards:', error),
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.msiService
      .getGroups({
        cardId: this.cardFilterValue ?? undefined,
        status: this.statusFilterValue === 'all' ? undefined : this.statusFilterValue,
      })
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading MSI groups:', error);
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.load();
  }

  progressPct(group: MsiGroupSummary): number {
    return group.totalMonths ? Math.round((group.installmentsPaid / group.totalMonths) * 100) : 0;
  }

  viewSchedule(group: MsiGroupSummary): void {
    const ref = this.dialogService.open<MsiScheduleDialogResult>(MsiScheduleDialogComponent, {
      header: 'Calendario de pagos MSI',
      width: '480px',
      data: { transactionId: group.parentTransactionId },
    });

    ref.onClose.subscribe((result) => {
      if (result?.cancelled) {
        this.load();
      }
    });
  }
}
