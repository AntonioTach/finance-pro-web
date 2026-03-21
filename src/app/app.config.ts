import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';
import { providePrimeNG } from 'primeng/config';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { routes } from './app.routes';

const FinanceProPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '10px',
      },
    },
  },
});
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

// Register es-MX locale
registerLocaleData(localeEsMX, 'es-MX');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
    providePrimeNG({
      theme: {
        preset: FinanceProPreset,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),
    DialogService,
    ConfirmationService,
    MessageService,
    { provide: LOCALE_ID, useValue: 'es-MX' },
  ],
};

