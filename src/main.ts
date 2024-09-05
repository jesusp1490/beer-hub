import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import * as $ from 'jquery';
import 'slick-carousel';



platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
