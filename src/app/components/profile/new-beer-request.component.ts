import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-beer-request',
  templateUrl: './new-beer-request.component.html',
  styleUrls: ['./new-beer-request.component.scss']
})
export class NewBeerRequestComponent {
  beerForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<NewBeerRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { newBeer: any },
    private fb: FormBuilder
  ) {
    this.beerForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.beerForm.valid) {
      this.dialogRef.close(this.beerForm.value);
    }
  }
}

