import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { TranslateLoader } from '@ngx-translate/core';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { TranslateServerLoader } from './translate-server-loader';

@NgModule({
  imports: [AppModule, ServerModule],
  providers: [{ provide: TranslateLoader, useClass: TranslateServerLoader }],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
