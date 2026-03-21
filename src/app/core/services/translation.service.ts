import { Injectable, signal, computed } from '@angular/core';
import { TRANSLATIONS, Lang } from '../i18n/translations';
export type { Lang };

const STORAGE_KEY = 'fp_lang';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private _lang = signal<Lang>((localStorage.getItem(STORAGE_KEY) as Lang) ?? 'es');

  readonly language  = this._lang.asReadonly();
  readonly languages: { code: Lang; label: string; nativeLabel: string }[] = [
    { code: 'es', label: 'Español',  nativeLabel: 'ES' },
    { code: 'en', label: 'English',  nativeLabel: 'EN' },
  ];

  /** Current translation dictionary as a signal — components can track it. */
  readonly dict = computed(() => TRANSLATIONS[this._lang()]);

  setLanguage(lang: Lang): void {
    this._lang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  /** Translate a key. Returns the key itself if not found. */
  t(key: string): string {
    return this.dict()[key] ?? key;
  }
}
