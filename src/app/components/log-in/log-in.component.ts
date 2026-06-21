import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ]
})
export class LogInComponent implements OnInit {
  email: string = '';
  password: string = '';
  hidePassword: boolean = true;
  isLoading: boolean = false;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIcon(
      'google-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/google-logo.svg')
    );
  }

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe(loggedIn => {
      if (loggedIn) {
        this.navigateAfterAuth();
      }
    });
  }

  private navigateAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigateByUrl(returnUrl);
  }

  async login(): Promise<void> {
    this.isLoading = true;
    try {
      await this.authService.signIn(this.email, this.password);
      this.navigateAfterAuth();
      this.showSuccessMessage('Login successful!');
    } catch (error) {
      console.error(`Error: ${(error as any).message}`);
      this.showErrorMessage('Login failed. Please check your credentials.');
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;
    try {
      await this.authService.signInWithGoogle();
      this.navigateAfterAuth();
      this.showSuccessMessage('Google login successful!');
    } catch (error) {
      console.error(`Error: ${(error as any).message}`);
      this.showErrorMessage('Google login failed. Please try again.');
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
