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
    MatNativeDateModule
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

  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore) { }

  async signUp() {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      const uid = result.user?.uid;

      if (uid) {
        await this.firestore.collection('users').doc(uid).set({
          firstName: this.firstName,
          lastName: this.lastName,
          username: this.username,
          country: this.country,
          dob: this.dob,
        });

        console.log('Sign Up successful!');
      }
    } catch (error) {
      console.error(`Error: ${(error as any).message}`);
    }
  }
}