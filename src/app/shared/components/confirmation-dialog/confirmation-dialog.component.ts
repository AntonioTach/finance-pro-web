import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="handleCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h3>{{ title() }}</h3>
        <p>{{ message() }}</p>
        <div class="dialog-actions">
          <button class="btn-secondary" (click)="handleCancel()">Cancel</button>
          <button class="btn-primary" (click)="handleConfirm()">Confirm</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .dialog-content {
        background: var(--bg-color);
        padding: var(--spacing-xl);
        border-radius: var(--border-radius-lg);
        min-width: 400px;
        max-width: 90%;
      }

      .dialog-content h3 {
        margin-bottom: var(--spacing-md);
      }

      .dialog-content p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-secondary);
      }

      .dialog-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: flex-end;
      }

      .btn-primary {
        background-color: var(--primary-color);
        color: white;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-sm);
        font-weight: 500;
      }

      .btn-secondary {
        background-color: var(--bg-secondary);
        color: var(--text-color);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-sm);
        font-weight: 500;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmed = output<void>();
  cancelled = output<void>();

  handleConfirm(): void {
    this.confirmed.emit();
  }

  handleCancel(): void {
    this.cancelled.emit();
  }
}

