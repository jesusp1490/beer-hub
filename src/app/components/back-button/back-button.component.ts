import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  template: `
    <button class="back-button" (click)="goBack()">
      <mat-icon>arrow_back</mat-icon>
      {{ text }}
    </button>
  `,
  styles: [`
    .back-button {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      color: #ffa726;
      cursor: pointer;
      font-size: 16px;
      padding: 8px;
      transition: color 0.3s ease;
    }
    .back-button:hover {
      color: #ff9100;
    }
    mat-icon {
      // margin-right: 8px;
    }
  `]
})
export class BackButtonComponent {
  @Input() text: string = 'Back';

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}