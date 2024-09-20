import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule
  ]
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
      console.error(`Error: ${(error as any).message}`);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/profile']);
    } catch (error) {
      console.error(`Error: ${(error as any).message}`);
    }
  }
}