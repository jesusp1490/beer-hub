// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // Asegúrate de que esta ruta es correcta
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  selectedLanguage: string = 'en'; // Valor predeterminado del idioma

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    // Puedes añadir lógica de inicialización aquí si es necesario
  }

  signUp(): void {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    if (email && password) {
      this.authService.signUp(email, password).catch(error => {
        console.error('Sign Up Error:', error);
        alert('Error signing up: ' + error.message);
      });
    }
  }

  login(): void {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    if (email && password) {
      this.authService.signIn(email, password).catch(error => {
        console.error('Login Error:', error);
        alert('Error logging in: ' + error.message);
      });
    }
  }

  signOut(): void {
    this.authService.signOut().catch(error => {
      console.error('Sign Out Error:', error);
      alert('Error signing out: ' + error.message);
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  changeLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const language = select.value;
    this.selectedLanguage = language;
    // Aquí implementa la lógica para cambiar el idioma
    console.log(`Language changed to: ${language}`);
  }
}
