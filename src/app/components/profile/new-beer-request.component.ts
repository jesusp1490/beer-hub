import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-new-beer-request',
  template: `
    <h2 mat-dialog-title>Request New Beer</h2>
    <mat-dialog-content>
      <form #beerForm="ngForm">
        <mat-form-field appearance="fill">
          <mat-label>Beer Name</mat-label>
          <input matInput type="text" [(ngModel)]="data.newBeer.name" name="beerName" required>
          <mat-icon matSuffix>local_drink</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="data.newBeer.description" name="beerDescription" required></textarea>
          <mat-icon matSuffix>description</mat-icon>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!beerForm.form.valid" (click)="onSubmit()">Submit Request</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #424242;
      color: #e0e0e0;
      padding: 20px;
      border-radius: 8px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 15px;
    }
    .mat-mdc-form-field {
      --mdc-filled-text-field-container-color: transparent;
      --mdc-filled-text-field-focus-active-indicator-color: #ff9100;
      --mdc-filled-text-field-focus-label-text-color: #ff9100;
      --mdc-filled-text-field-label-text-color: #e0e0e0;
      --mdc-filled-text-field-input-text-color: #e0e0e0;
    }
    .mat-mdc-dialog-actions {
      justify-content: flex-end;
    }
    .mat-mdc-raised-button.mat-primary {
      background-color: #ff9100;
    }
  `]
})
export class NewBeerRequestComponent {
  constructor(
    public dialogRef: MatDialogRef<NewBeerRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { newBeer: any }
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close(this.data.newBeer);
  }
}

