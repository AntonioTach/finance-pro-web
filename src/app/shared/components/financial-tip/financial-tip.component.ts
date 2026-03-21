import { Component, inject, input, signal } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TooltipModule } from 'primeng/tooltip';

const TIP_COUNT = 12;

@Component({
  selector: 'app-financial-tip',
  standalone: true,
  imports: [TranslatePipe, TooltipModule],
  template: `
    @if (isCollapsed()) {
      <!-- Collapsed: icon only with tooltip -->
      <div
        class="tip-collapsed"
        [pTooltip]="('tips.tip' + currentIndex()) | translate"
        tooltipPosition="right"
        [tooltipOptions]="{ tooltipStyleClass: 'tip-tooltip' }"
      >
        <i class="pi pi-lightbulb"></i>
      </div>
    } @else {
      <!-- Expanded: full tip card -->
      <div class="tip-card">
        <div class="tip-header">
          <div class="tip-icon-wrap">
            <i class="pi pi-lightbulb"></i>
          </div>
          <span class="tip-label">{{ 'tips.label' | translate }}</span>
          <button
            class="tip-next-btn"
            (click)="nextTip()"
            [title]="'tips.next' | translate"
            type="button"
          >
            <i class="pi pi-refresh"></i>
          </button>
        </div>
        <p class="tip-text">{{ ('tips.tip' + currentIndex()) | translate }}</p>
        <div class="tip-dots">
          @for (n of dots; track n) {
            <span class="tip-dot" [class.active]="n === currentIndex()"></span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Collapsed state ─────────────────────────────── */
    .tip-collapsed {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      cursor: default;
      margin: 0 auto;
      transition: background 200ms ease;

      i {
        color: #f59e0b;
        font-size: 0.9rem;
      }

      &:hover {
        background: rgba(245, 158, 11, 0.18);
      }
    }

    /* ── Expanded card ───────────────────────────────── */
    .tip-card {
      background: rgba(245, 158, 11, 0.06);
      border: 1px solid rgba(245, 158, 11, 0.18);
      border-radius: 12px;
      padding: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .tip-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tip-icon-wrap {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: rgba(245, 158, 11, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i { color: #f59e0b; font-size: 0.7rem; }
    }

    .tip-label {
      flex: 1;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #f59e0b;
    }

    .tip-next-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 5px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: rgba(245, 158, 11, 0.6);
      padding: 0;
      transition: color 150ms ease, background 150ms ease;
      font-family: inherit;

      i { font-size: 0.65rem; }

      &:hover {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.12);
      }
    }

    .tip-text {
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }

    .tip-dots {
      display: flex;
      gap: 3px;
      align-items: center;
    }

    .tip-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.25);
      transition: background 200ms ease, width 200ms ease;

      &.active {
        background: #f59e0b;
        width: 10px;
        border-radius: 2px;
      }
    }
  `],
})
export class FinancialTipComponent {
  isCollapsed = input<boolean>(false);

  readonly dots = Array.from({ length: TIP_COUNT }, (_, i) => i + 1);
  currentIndex = signal(Math.floor(Math.random() * TIP_COUNT) + 1);

  nextTip(): void {
    this.currentIndex.update(i => (i % TIP_COUNT) + 1);
  }
}
