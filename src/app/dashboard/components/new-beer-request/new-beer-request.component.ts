import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-new-beer-request',
  templateUrl: './new-beer-request.component.html',
  styleUrls: ['./new-beer-request.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatIconModule
  ]
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

