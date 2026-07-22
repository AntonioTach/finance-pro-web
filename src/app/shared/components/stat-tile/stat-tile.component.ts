import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

export type StatTileTone = 'neutral' | 'success' | 'danger';
export type StatTileFormat = 'currency' | 'number';

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  templateUrl: './stat-tile.component.html',
  styleUrls: ['./stat-tile.component.scss'],
})
export class StatTileComponent {
  label = input.required<string>();
  value = input.required<number>();
  format = input<StatTileFormat>('currency');
  currency = input<string>('USD');
  deltaPct = input<number | null>(null);
  tone = input<StatTileTone>('neutral');
  icon = input<string | null>(null);

  deltaDirectionClass = computed(() => {
    const d = this.deltaPct();
    if (d === null || d === undefined || isNaN(d) || d === 0) return 'flat';
    return d > 0 ? 'up' : 'down';
  });

  toneClass = computed(() => `tone-${this.tone()}`);
}
