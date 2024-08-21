import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class SignUpComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  country: string = '';
  dob: string = '';

  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore) { }

  async signUp() {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      const uid = result.user?.uid;

      if (uid) {
        // Guardar datos adicionales en Firestore
        await this.firestore.collection('users').doc(uid).set({
          firstName: this.firstName,
          lastName: this.lastName,
          username: this.username,
          country: this.country,
          dob: this.dob,
        });

        window.alert('Sign Up successful!');
      }
    } catch (error) {
      window.alert(`Error: ${(error as any).message}`);
    }
  }
}
