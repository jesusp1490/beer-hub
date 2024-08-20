import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user: any;  // Define el tipo 'user' como 'any' por ahora
  selectedLanguage = 'en';

  constructor(
    private afAuth: AngularFireAuth, 
    private router: Router, 
    private translate: TranslateService
  ) {
    this.afAuth.authState.subscribe(user => this.user = user);
    this.translate.setDefaultLang(this.selectedLanguage);
  }

  ngOnInit(): void {}

  async login() {
    try {
      await this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  async signUp() {
    try {
      // Implementación para el registro de usuarios (esto es un ejemplo básico)
      await this.afAuth.createUserWithEmailAndPassword('test@example.com', 'password');
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Sign Up failed', error);
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  changeLanguage() {
    this.translate.use(this.selectedLanguage);
  }
}
