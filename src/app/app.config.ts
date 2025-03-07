import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { authInterceptorProviders } from './_helpers/auth.interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(),
        provideAnimationsAsync(),
        provideAnimationsAsync(),
        importProvidersFrom(HttpClientModule),
        authInterceptorProviders,
        provideHttpClient(),
        provideToastr({
            timeOut: 10000,
            positionClass: 'toast-top-right',
            preventDuplicates: true,
          }), 

          importProvidersFrom(NgxSpinnerModule.forRoot()), // Thêm dòng này
         
    ],
};
