import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cat-icon',
  standalone: true,
  template: `<span class="cat-icon">{{ icon() || '🏷️' }}</span>`,
  styles: [`
    .cat-icon {
      font-size: 1.5em;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `],
})
export class CategoryIconComponent {
  icon = input<string | undefined | null>('');
}
