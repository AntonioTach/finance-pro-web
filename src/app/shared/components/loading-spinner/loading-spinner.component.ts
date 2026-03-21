import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading-spinner">
      <div class="spinner-ring">
        <div class="spinner-segment"></div>
      </div>
      <span class="spinner-label">Cargando...</span>
    </div>
  `,
  styles: [
    `
      .loading-spinner {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        padding: 2.5rem;
      }

      .spinner-ring {
        position: relative;
        width: 44px;
        height: 44px;
      }

      .spinner-ring::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.06);
      }

      .spinner-segment {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: #6366f1;
        border-right-color: rgba(99, 102, 241, 0.3);
        animation: spin 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
      }

      .spinner-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #475569;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {}

