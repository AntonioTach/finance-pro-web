import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SubscriptionService } from '../services/subscription.service';
import { Subscription, CreateSubscriptionPaymentDto } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-subscription-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    MessageModule,
  ],
  templateUrl: './subscription-payment-form.component.html',
  styleUrls: ['./subscription-payment-form.component.scss'],
})
export class SubscriptionPaymentFormComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private subscriptionService = inject(SubscriptionService);

  saving = signal(false);
  errorMessage = signal('');

  subscription!: Subscription;
  amount = 0;
  paymentDateObj: Date = new Date();
  notes = '';

  ngOnInit(): void {
    this.subscription = this.config.data.subscription as Subscription;
    this.amount = this.subscription.amount;
  }

  isValid(): boolean {
    return this.amount > 0 && !!this.paymentDateObj;
  }

  submit(): void {
    if (!this.isValid()) return;

    const dto: CreateSubscriptionPaymentDto = {
      paymentDate: this.paymentDateObj.toISOString().split('T')[0],
      amount: this.amount,
      notes: this.notes || undefined,
    };

    this.saving.set(true);
    this.errorMessage.set('');
    this.subscriptionService.addPayment(this.subscription.id, dto).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.ref.close(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.status === 409
            ? 'Ya existe un pago registrado para este mes.'
            : 'No se pudo registrar el pago. Intenta de nuevo.',
        );
      },
    });
  }

  cancel(): void {
    this.ref.close();
  }
}
