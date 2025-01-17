import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;

      try {
        await this.authService.sendPasswordResetEmail(email);
        this.snackBar.open('Password reset email sent. Check your inbox.', 'Close', { duration: 5000 });
        this.forgotPasswordForm.reset();
      } catch (error) {
        console.error('Error sending password reset email:', error);
        this.snackBar.open('Error sending password reset email. Please try again.', 'Close', { duration: 5000 });
      } finally {
        this.isLoading = false;
      }
    }
  }
}

