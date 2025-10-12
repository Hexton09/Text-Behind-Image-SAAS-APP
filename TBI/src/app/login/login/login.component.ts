import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LoginPopupService,
  LoginPopupState,
} from '../../services/login-pop-up.service';
import { AuthService } from '../auth-service.service';
import { ToasterService } from './../../services/toaster.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  // --- Form & State Properties ---
  email: string = '';
  password: string = '';
  displayName: string = '';
  resetEmail: string = '';

  showPopup = signal(false);
  isSignUp = false;
  isForgotPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loginPopupService: LoginPopupService,
    private Toast : ToasterService,
  ) {}

  ngOnInit() {
    // Subscribe to the popup service to control the modal's state
    this.loginPopupService.loginPopupState$.subscribe(
      (state: LoginPopupState) => {
        this.showPopup.set(state.isOpen);
        if (state.isOpen) {
          this.isSignUp = state.isSignUp;
        }
      }
    );

    // If a user logs in, close the popup automatically
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.closePopup();
      }
    });
  }

  toggleForm() {
    this.isSignUp = !this.isSignUp;
  }

  closePopup() {
    this.loginPopupService.close();
    setTimeout(() => {
      this.isSignUp = false;
      this.isForgotPassword = false;
      this.email = '';
      this.password = '';
      this.displayName = '';
      this.resetEmail = '';
    }, 300);
  }

  // --- AUTHENTICATION METHODS (SIMPLIFIED) ---

  signInWithEmail(event: Event) {
    event.preventDefault();
    this.authService
      .signIn(this.email, this.password)
      .then(() => {
        // The service's authState observer handles the user state.
        // We just navigate and reload to ensure all guards and resolvers get the latest data.
        this.router.navigate(['/home']).then(() => window.location.reload());
      })
      .catch((err) => {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        if (err.code) {
          switch (err.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-email':
              errorMessage = 'Invalid Credentials';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many failed login attempts. Try again later';
              break;
          }
        }
        this.Toast.show(errorMessage, 'error');
      });
  }

  signUpWithEmail(event: Event) {
    event.preventDefault();
    this.authService
      .signUp(this.email, this.password)
      .then((res) => {
        // After sign-up, just update the profile. The authState observer will handle the rest.
        return res.user?.updateProfile({ displayName: this.displayName });
      })
      .then(() => {
        this.router.navigate(['/home']).then(() => window.location.reload());
      })
      .catch((err) => {
        if (err.code === "auth/email-already-in-use") {
          this.Toast.show('Email already in use.','error');
        } else {
          this.Toast.show('Error signing up. Please try again.','error');
        }
      });
  }

  googleSignIn(event: Event) {
    event.preventDefault();
    this.authService
      .googleSignIn()
      .then(() => {
        // Logic is now centralized in AuthService, just navigate and reload.
        this.router.navigate(['/home']).then(() => window.location.reload());
      })
      .catch((err) => this.Toast.show('Error signing in with Google.','error'));
  }

  githubSignIn(event: Event) {
    event.preventDefault();
    this.authService
      .githubSignIn()
      .then(() => {
        // Logic is now centralized in AuthService, just navigate and reload.
        this.router.navigate(['/home']).then(() => window.location.reload());
      })
      .catch((err) => this.Toast.show('Error signing in with GitHub.','error'));
  }

  resetPassword(event: Event) {
    event.preventDefault();
    if (!this.resetEmail) {
      alert('Please enter your email address to reset your password.');
      return;
    }
    this.authService
      .resetPassword(this.resetEmail)
      .then(() => {
        alert('Password reset email sent!');
        this.isForgotPassword = false;
      })
      .catch((err: any) => console.error('Reset Error:', err));
  }
}

