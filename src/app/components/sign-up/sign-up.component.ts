import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CommonModule } from '@angular/common';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  imports: [FormsModule, CommonModule]  
})
export class SignUpComponent {
  email: string = '';
  password: string = '';

  constructor(private afAuth: AngularFireAuth) { }

  async signUp() {
    try {
      await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      window.alert('Sign Up successful!');
    } catch (error) {
      window.alert(`Error: ${(error as any).message}`);
    }
  }
}
