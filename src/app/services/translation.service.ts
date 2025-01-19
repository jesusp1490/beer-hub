import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private translate: TranslateService) {}

  translateText(key: string, params?: Object): Observable<string> {
    return this.translate.get(key, params);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
  }

  getCurrentLang(): string {
    return this.translate.currentLang || this.translate.getDefaultLang();
  }

  getAvailableLanguages(): string[] {
    return this.translate.getLangs();
  }
}

