import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; 
@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService) { }

  async login() {
    try {
      await this.authService.signIn(this.email, this.password);
      window.alert('Login successful!');
    } catch (error) {
      window.alert(`Error: ${(error as any).message}`);
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      window.alert('Login with Google successful!');
    } catch (error) {
      window.alert(`Error: ${(error as any).message}`);
    }
  }
}
