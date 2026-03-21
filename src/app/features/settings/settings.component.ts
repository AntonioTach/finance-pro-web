import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme, ThemeId } from '../../core/services/theme.service';
import { TranslationService, Lang } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LangSwitcherComponent } from '../../shared/components/lang-switcher/lang-switcher.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ToastModule, TranslatePipe, LangSwitcherComponent],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  private themeService = inject(ThemeService);
  private messageService = inject(MessageService);
  readonly ts = inject(TranslationService);

  readonly themes = this.themeService.themes;
  readonly currentTheme = this.themeService.currentTheme;
  readonly languages: { code: Lang; labelKey: string }[] = [
    { code: 'es', labelKey: 'settings.lang.es' },
    { code: 'en', labelKey: 'settings.lang.en' },
  ];

  selectTheme(id: ThemeId): void {
    this.themeService.setTheme(id);
    this.messageService.add({
      severity: 'success',
      summary: this.ts.t('settings.theme.applied'),
      detail: `"${this.ts.t('settings.theme.' + id + '.name')}"`,
      life: 2500,
    });
  }

  selectLanguage(lang: Lang): void {
    this.ts.setLanguage(lang);
    this.messageService.add({
      severity: 'success',
      summary: this.ts.t('settings.language.applied'),
      life: 2000,
    });
  }

  isLangActive(lang: Lang): boolean {
    return this.ts.language() === lang;
  }

  isActive(id: ThemeId): boolean {
    return this.currentTheme() === id;
  }

  darken(hex: string): string {
    // Returns a slightly darker shade for the mini sidebar preview
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const factor = 0.6;
      return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
    } catch {
      return hex;
    }
  }
}
