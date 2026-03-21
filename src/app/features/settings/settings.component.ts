import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme, ThemeId } from '../../core/services/theme.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  private themeService = inject(ThemeService);
  private messageService = inject(MessageService);

  readonly themes = this.themeService.themes;
  readonly currentTheme = this.themeService.currentTheme;

  selectTheme(id: ThemeId): void {
    this.themeService.setTheme(id);
    const theme = this.themes.find(t => t.id === id);
    this.messageService.add({
      severity: 'success',
      summary: 'Tema aplicado',
      detail: `Tema "${theme?.name}" activado correctamente`,
      life: 2500,
    });
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
