import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-new-beer-request',
  templateUrl: './new-beer-request.component.html',
  styleUrls: ['./new-beer-request.component.scss']
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

