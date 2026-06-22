import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-layout',
  template: `
    <div class="page-layout">
      <app-back-button [text]="backButtonText"></app-back-button>
      <div class="content-container">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .content-container {
      padding: 0;
    }
  `]
})
export class PageLayoutComponent {
  @Input() backButtonText: string = 'Back';
}
