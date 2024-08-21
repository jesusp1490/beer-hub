import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent {
  email: string = '';
  password: string = '';

  constructor(private afAuth: AngularFireAuth, private router: Router, private authService: AuthService) { }

  async login(): Promise<void> {
    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/profile']);
    } catch (error) {
      alert(`Error: ${(error as any).message}`);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/profile']);
    } catch (error) {
      alert(`Error: ${(error as any).message}`);
    }
  }
}
