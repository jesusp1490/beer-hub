import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service'; 
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
  selectedLanguage: string = 'en'; 

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

  goToSignUp(): void {
    this.router.navigate(['/signup']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  signOut(): void {
    this.authService.signOut().then(() => {
      window.alert('Logged out successfully!');
      this.router.navigate(['/']); // Redirige al usuario a la página de inicio o cualquier otra página
    }).catch(error => {
      console.error('Sign Out Error:', error);
      window.alert('Error signing out: ' + error.message);
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
