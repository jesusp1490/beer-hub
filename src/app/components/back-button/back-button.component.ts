import { Component, Input } from "@angular/core"
import { Location } from "@angular/common"

@Component({
  selector: "app-back-button",
  template: `
    <button class="back-button" (click)="goBack()">
      <span class="material-icons">arrow_back</span>
      {{ text }}
    </button>
  `,
  styles: [
    `
    /* FIX: restyled to a more compact pill matching the amber identity
       used elsewhere in the rework, instead of a bare unstyled link-like
       button with default padding that contributed to the page feeling
       like it had extra reserved space above it. */
    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 167, 38, 0.08);
      border: 1px solid rgba(255, 167, 38, 0.2);
      border-radius: 999px;
      color: #ffa726;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    .back-button:hover {
      background: rgba(255, 167, 38, 0.16);
      color: #ff9100;
    }
    .material-icons {
      font-size: 18px;
    }
  `,
  ],
})
export class BackButtonComponent {
  @Input() text = "Back"

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back()
  }
}
