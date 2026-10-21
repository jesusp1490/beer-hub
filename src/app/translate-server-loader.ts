import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { readFileSync } from 'fs';
import { join } from 'path';

// Solo se usa en el servidor (SSR / prerender): lee el JSON del disco
// en lugar de pedirlo por HTTP.
export class TranslateServerLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    try {
      const file = join(process.cwd(), 'src', 'assets', 'i18n', `${lang}.json`);
      return of(JSON.parse(readFileSync(file, 'utf8')));
    } catch {
      return of({});
    }
  }
}
