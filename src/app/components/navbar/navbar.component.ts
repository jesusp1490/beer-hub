import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  selectedLanguage: string = 'en'; 
  isMenuOpen: boolean = false;
  isUserMenuOpen: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.user$.subscribe(user => {
      console.log('Current user:', user); 
    });
  }

  goToSignUp(): void {
    this.router.navigate(['/signup']);
    this.closeMenu();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
    this.closeMenu();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeMenu();
    this.closeUserMenu();
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(['/']);
      this.closeMenu();
      this.closeUserMenu();
    });
  }

  changeLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const language = select.value;
    this.selectedLanguage = language;

    console.log(`Language changed to: ${language}`);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isUserMenuOpen && !(event.target as HTMLElement).closest('.user-menu')) {
      this.closeUserMenu();
    }
  }
}