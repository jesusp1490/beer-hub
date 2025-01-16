import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ]
})
export class SignUpComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  country: string = '';
  dob: Date | null = null;
  hidePassword: boolean = true;
  isLoading: boolean = false;

  constructor(
    private afAuth: AngularFireAuth, 
    private firestore: AngularFirestore,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  async signUp() {
    this.isLoading = true;
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      const uid = result.user?.uid;

      if (uid) {
        await this.firestore.collection('users').doc(uid).set({
          firstName: this.firstName,
          lastName: this.lastName,
          username: this.username,
          country: this.country,
          dob: this.dob ? Timestamp.fromDate(this.dob) : null,
          email: this.email,
        });

        this.showSuccessMessage('Sign Up successful!');
        this.router.navigate(['/profile']);
      }
    } catch (error) {
      console.error(`Error: ${(error as any).message}`);
      this.showErrorMessage(`Registration failed: ${(error as any).message}`);
    } finally {
      this.isLoading = false;
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}