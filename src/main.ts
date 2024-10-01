import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import 'jquery';
import 'slick-carousel';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(MatCardModule, MatButtonModule, MatTabsModule)
  ]
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
