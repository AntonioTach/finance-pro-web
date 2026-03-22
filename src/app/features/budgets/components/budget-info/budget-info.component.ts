import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-budget-info',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="info-card" [class.info-card--compact]="compact()">

      <!-- Header — always visible, click to toggle -->
      <button class="info-header" (click)="toggle()" [attr.aria-expanded]="!isCollapsed()">
        <div class="info-icon-wrap">
          <i class="pi pi-wallet"></i>
        </div>
        <div class="info-header-text">
          <h3 class="info-title">{{ 'budgets.info.title' | translate }}</h3>
          @if (isCollapsed()) {
            <p class="info-subtitle info-subtitle--hint">
              {{ 'budgets.info.subtitle' | translate }}
            </p>
          }
        </div>
        <span class="info-toggle-icon" [class.rotated]="!isCollapsed()">
          <i class="pi pi-chevron-down"></i>
        </span>
      </button>

      <!-- Collapsible body -->
      <div class="info-body" [class.info-body--open]="!isCollapsed()">
        <div class="info-body-inner">

          <p class="info-desc">{{ 'budgets.info.subtitle' | translate }}</p>

          @if (!compact()) {
            <!-- Features -->
            <div class="info-features">
              <div class="feature-pill">
                <i class="pi pi-tags"></i>
                <span>{{ 'budgets.info.feature1' | translate }}</span>
              </div>
              <div class="feature-pill">
                <i class="pi pi-bell"></i>
                <span>{{ 'budgets.info.feature2' | translate }}</span>
              </div>
              <div class="feature-pill">
                <i class="pi pi-chart-line"></i>
                <span>{{ 'budgets.info.feature3' | translate }}</span>
              </div>
              <div class="feature-pill">
                <i class="pi pi-history"></i>
                <span>{{ 'budgets.info.feature4' | translate }}</span>
              </div>
            </div>

            <!-- How it works -->
            <div class="info-steps">
              <p class="steps-title">{{ 'budgets.info.how.title' | translate }}</p>
              <div class="steps-list">
                <div class="step">
                  <span class="step-num">1</span>
                  <span class="step-text">{{ 'budgets.info.how.step1' | translate }}</span>
                </div>
                <div class="step">
                  <span class="step-num">2</span>
                  <span class="step-text">{{ 'budgets.info.how.step2' | translate }}</span>
                </div>
                <div class="step">
                  <span class="step-num">3</span>
                  <span class="step-text">{{ 'budgets.info.how.step3' | translate }}</span>
                </div>
                <div class="step">
                  <span class="step-num">4</span>
                  <span class="step-text">{{ 'budgets.info.how.step4' | translate }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-card {
      background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 16px;
      overflow: hidden;
    }

    /* ── Header (clickable toggle) ── */
    .info-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      width: 100%;
      background: none;
      border: none;
      cursor: pointer;
      padding: 1.1rem 1.5rem;
      text-align: left;
      font-family: inherit;
      transition: background 150ms;
    }

    .info-header:hover {
      background: rgba(99,102,241,0.04);
    }

    .info-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(99,102,241,0.3);
    }

    .info-icon-wrap i {
      color: #fff;
      font-size: 0.95rem;
    }

    .info-header-text {
      flex: 1;
      min-width: 0;
    }

    .info-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .info-subtitle--hint {
      margin: 0.15rem 0 0;
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .info-toggle-icon {
      color: var(--text-muted);
      font-size: 0.75rem;
      transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }

    .info-toggle-icon.rotated {
      transform: rotate(180deg);
    }

    /* ── Collapsible body ── */
    .info-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .info-body--open {
      grid-template-rows: 1fr;
    }

    .info-body-inner {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0 1.5rem 1.25rem;
    }

    .info-desc {
      margin: 0;
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* ── Features ── */
    .info-features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .feature-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      background: rgba(99,102,241,0.1);
      border: 1px solid rgba(99,102,241,0.18);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-light, #818cf8);
    }

    .feature-pill i { font-size: 0.7rem; }

    /* ── Steps ── */
    .info-steps {
      border-top: 1px solid rgba(99,102,241,0.12);
      padding-top: 0.875rem;
    }

    .steps-title {
      margin: 0 0 0.65rem;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }

    .step-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--gradient-primary);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-text {
      font-size: 0.79rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }
  `],
})
export class BudgetInfoComponent {
  compact = input(false);

  isCollapsed = signal(true);

  toggle(): void {
    this.isCollapsed.update(v => !v);
  }
}
