import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-layout',
  template: `
    <div class="page-layout">
      <div class="back-button-container">
        <app-back-button [text]="backButtonText"></app-back-button>
      </div>
      <div class="content-container">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-layout {
      position: relative;
      padding-top: 60px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .back-button-container {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
    }
    .content-container {
      padding: 0 20px;
    }
  `]
})
export class PageLayoutComponent {
  @Input() backButtonText: string = 'Back';
}