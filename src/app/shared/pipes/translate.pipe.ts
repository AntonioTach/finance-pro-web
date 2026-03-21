import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

/**
 * Translates a key using the current language.
 * Pure: false so it re-evaluates on every change-detection cycle,
 * which ensures instant reactivity when the language is switched.
 *
 * Usage:  {{ 'nav.dashboard' | translate }}
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private ts = inject(TranslationService);

  transform(key: string): string {
    return this.ts.t(key);
  }
}
