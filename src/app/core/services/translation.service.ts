import { Injectable, signal, computed } from '@angular/core';
import { TRANSLATIONS, Lang } from '../i18n/translations';
export type { Lang };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private _lang = signal<Lang>('es');

  readonly language  = this._lang.asReadonly();
  readonly languages: { code: Lang; label: string; nativeLabel: string }[] = [
    { code: 'es', label: 'Español',  nativeLabel: 'ES' },
    { code: 'en', label: 'English',  nativeLabel: 'EN' },
  ];

  /** Current translation dictionary as a signal — components can track it. */
  readonly dict = computed(() => TRANSLATIONS[this._lang()]);

  /** Apply language locally (no API call). Called by AuthService on login/init. */
  setLanguage(lang: Lang): void {
    this._lang.set(lang);
  }

  /** Translate a key. Returns the key itself if not found. */
  t(key: string): string {
    return this.dict()[key] ?? key;
  }
}
