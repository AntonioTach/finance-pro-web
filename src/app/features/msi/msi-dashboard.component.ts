import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { MsiService } from './services/msi.service';
import { YearlyProjectionResponse } from './models/msi.model';
import { MsiListComponent } from './components/msi-list/msi-list.component';
import { MsiYearlyProjectionComponent } from './components/yearly-projection/yearly-projection.component';

@Component({
  selector: 'app-msi-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, TabsModule, MsiListComponent, MsiYearlyProjectionComponent],
  templateUrl: './msi-dashboard.component.html',
  styleUrls: ['./msi-dashboard.component.scss'],
})
export class MsiDashboardComponent implements OnInit {
  private msiService = inject(MsiService);

  currentYear = signal(new Date().getFullYear());
  yearlyData = signal<YearlyProjectionResponse | null>(null);
  isLoadingProjection = signal(false);
  projectionError = signal('');

  ngOnInit(): void {
    this.loadProjection();
  }

  loadProjection(): void {
    this.isLoadingProjection.set(true);
    this.projectionError.set('');

    this.msiService.getYearlyProjection(this.currentYear()).subscribe({
      next: (data) => {
        this.yearlyData.set(data);
        this.isLoadingProjection.set(false);
      },
      error: (error) => {
        console.error('Error loading yearly MSI projection:', error);
        this.projectionError.set('Error al cargar la proyección anual');
        this.isLoadingProjection.set(false);
      },
    });
  }

  previousYear(): void {
    this.currentYear.update((y) => y - 1);
    this.loadProjection();
  }

  nextYear(): void {
    this.currentYear.update((y) => y + 1);
    this.loadProjection();
  }

  goToCurrentYear(): void {
    this.currentYear.set(new Date().getFullYear());
    this.loadProjection();
  }
}
