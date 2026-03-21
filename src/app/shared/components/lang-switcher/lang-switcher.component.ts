import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Lang } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="lang-switcher" [class.compact]="compact">
      @for (lang of ts.languages; track lang.code) {
        <button
          class="lang-btn"
          [class.active]="ts.language() === lang.code"
          (click)="ts.setLanguage(lang.code)"
          [attr.aria-pressed]="ts.language() === lang.code"
          [attr.aria-label]="lang.label"
          [attr.title]="lang.label"
        >
          <span class="lang-code">{{ lang.nativeLabel }}</span>
          @if (!compact) {
            <span class="lang-label">{{ lang.label }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .lang-switcher {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 999px;
      padding: 3px;
    }

    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 150ms ease;
      letter-spacing: 0.04em;
      text-transform: uppercase;

      &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
      }

      &.active {
        background: var(--primary-subtle);
        color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
      }
    }

    .lang-code {
      font-weight: 800;
      font-size: 0.72rem;
      letter-spacing: 0.06em;
    }

    .lang-label {
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0;
      font-size: 0.8rem;
    }

    /* Compact mode (auth pages) */
    .compact .lang-btn {
      padding: 0.25rem 0.6rem;
    }
  `],
})
export class LangSwitcherComponent {
  ts = inject(TranslationService);

  /** When true, only shows the code (ES/EN), not the full label */
  @Input() compact = false;
}
