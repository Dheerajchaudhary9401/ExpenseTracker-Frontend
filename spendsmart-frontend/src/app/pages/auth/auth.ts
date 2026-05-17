// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { environment } from '../../../environments/environment';
// import { AuthApiService } from '../../core/services/auth-api.service';
// import { SessionService } from '../../core/services/session.service';


// // Declare google as a global variable (loaded from Google's script)
// declare const google: any;

// @Component({
//   selector: 'app-auth',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './auth.html',
//   styleUrls: ['./auth.css']
// })
// export class AuthComponent implements OnInit {
//   activeTab: 'login' | 'register' = 'login';
//   loading = false;
//   errorMessage = '';

//   loginForm = { email: '', password: '' };
//   registerForm = { firstName: '', lastName: '', email: '', password: '' };

//   private readonly platformId = inject(PLATFORM_ID);
//   private readonly router = inject(Router);
//   private readonly authApi = inject(AuthApiService);
//   private readonly session = inject(SessionService);
//   private readonly ngZone = inject(NgZone);

//   // Your Google Client ID
//   private readonly GOOGLE_CLIENT_ID = environment.googleClientId;

//   ngOnInit(): void {
//     if (this.session.isLoggedIn()) {
//       this.router.navigate(['/app/dashboard']);
//       return;
//     }
//     this.loadGoogleScript();
//   }

//   switchTab(tab: 'login' | 'register'): void {
//     this.activeTab = tab;
//     this.errorMessage = '';
//   }

//   // ── Email/Password Login ─────────────────────────────────────────────────

//   doLogin(): void {
//     if (!this.loginForm.email || !this.loginForm.password) {
//       this.errorMessage = 'Please enter email and password.';
//       return;
//     }
//     this.loading = true;
//     this.errorMessage = '';

//     this.authApi.login(this.loginForm).subscribe({
//       next: res => {
//         this.authApi.getProfile(res.userId).subscribe({
//           next: profile => this.session.setProfile(profile),
//           error: () => {}
//         });
//         this.router.navigate(['/app/dashboard']);
//       },
//       error: err => {
//         this.errorMessage = err?.error?.message ?? 'Login failed. Check your credentials.';
//         this.loading = false;
//       },
//       complete: () => { this.loading = false; }
//     });
//   }

//   // ── Email/Password Register ──────────────────────────────────────────────

//   doRegister(): void {
//     if (!this.registerForm.firstName || !this.registerForm.email || !this.registerForm.password) {
//       this.errorMessage = 'Please fill in all required fields.';
//       return;
//     }
//     if (this.registerForm.password.length < 8) {
//       this.errorMessage = 'Password must be at least 8 characters.';
//       return;
//     }

//     this.loading = true;
//     this.errorMessage = '';

//     const fullName = `${this.registerForm.firstName} ${this.registerForm.lastName}`.trim();

//     // Step 1: Register (returns User, not token)
//     this.authApi.register({ fullName, email: this.registerForm.email, password: this.registerForm.password }).subscribe({
//       next: () => {
//         // Step 2: Auto-login to get token
//         this.authApi.login({ email: this.registerForm.email, password: this.registerForm.password }).subscribe({
//           next: res => {
//             this.authApi.getProfile(res.userId).subscribe({
//               next: profile => this.session.setProfile(profile),
//               error: () => {}
//             });
//             this.router.navigate(['/app/dashboard']);
//           },
//           error: () => {
//             this.errorMessage = 'Account created! Please sign in.';
//             this.activeTab = 'login';
//             this.loginForm.email = this.registerForm.email;
//             this.loading = false;
//           }
//         });
//       },
//       error: err => {
//         this.errorMessage = err?.error?.message ?? 'Registration failed. Email may already be in use.';
//         this.loading = false;
//       }
//     });
//   }

//   // ── Google Login ─────────────────────────────────────────────────────────

//   private loadGoogleScript(): void {
//     if (!isPlatformBrowser(this.platformId)) return;
//     // Load Google's script if not already loaded
//     if (document.getElementById('google-signin-script')) {
//       this.initializeGoogle();
//       return;
//     }

//     const script = document.createElement('script');
//     script.id = 'google-signin-script';
//     script.src = 'https://accounts.google.com/gsi/client';
//     script.async = true;
//     script.defer = true;
//     script.onload = () => this.initializeGoogle();
//     document.head.appendChild(script);
//   }

//   private initializeGoogle(): void {
//     if (typeof google === 'undefined') return;

//     google.accounts.id.initialize({
//       client_id: this.GOOGLE_CLIENT_ID,
//       callback: (response: any) => {
//         // NgZone needed because Google callback runs outside Angular's zone
//         this.ngZone.run(() => this.handleGoogleCallback(response));
//       }
//     });

//     // Render the Google button in the container div
//     const buttonDiv = document.getElementById('google-btn-container');
//     if (buttonDiv) {
//       google.accounts.id.renderButton(buttonDiv, {
//         theme: 'outline',
//         size: 'large',
//         width: '100%',
//         text: 'continue_with'
//       });
//     }
//   }

//   private handleGoogleCallback(response: any): void {
//     if (!response?.credential) {
//       this.errorMessage = 'Google sign-in failed. Please try again.';
//       return;
//     }

//     this.loading = true;
//     this.errorMessage = '';

//     // Send Google ID token to your backend
//     this.authApi.loginWithGoogle(response.credential).subscribe({
//       next: res => {
//         this.authApi.getProfile(res.userId).subscribe({
//           next: profile => this.session.setProfile(profile),
//           error: () => {}
//         });
//         this.router.navigate(['/app/dashboard']);
//       },
//       error: err => {
//         this.errorMessage = err?.error?.message ?? 'Google sign-in failed. Please try again.';
//         this.loading = false;
//       },
//       complete: () => { this.loading = false; }
//     });
//   }
// }


import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthApiService } from '../../core/services/auth-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { SessionService } from '../../core/services/session.service';


// Declare google as a global variable (loaded from Google's script)
declare const google: any;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class AuthComponent implements OnInit {
  activeTab: 'login' | 'register' = 'login';
  loading = false;
  errorMessage = '';

  loginForm = { email: '', password: '' };
  registerForm = { firstName: '', lastName: '', email: '', password: '' };

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly session = inject(SessionService);
  private readonly ngZone = inject(NgZone);

  // Your Google Client ID
  private readonly GOOGLE_CLIENT_ID = environment.googleClientId;

  ngOnInit(): void {
    if (this.session.isLoggedIn()) {
      this.router.navigate(['/app/dashboard']);
      return;
    }
    this.loadGoogleScript();
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  //Email/Password Login

  doLogin(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.authApi.login(this.loginForm).subscribe({
      next: res => {
        this.authApi.getProfile(res.userId).subscribe({
          next: profile => this.session.setProfile(profile),
          error: () => {}
        });
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Login failed. Check your credentials.';
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }

  // Email/Password Register

  doRegister(): void {
    if (!this.registerForm.firstName || !this.registerForm.email || !this.registerForm.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    if (this.registerForm.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const fullName = `${this.registerForm.firstName} ${this.registerForm.lastName}`.trim();

    // Step 1: Register (returns User, not token)
    this.authApi.register({ fullName, email: this.registerForm.email, password: this.registerForm.password }).subscribe({
      next: () => {
        // Step 2: Auto-login to get token
        this.authApi.login({ email: this.registerForm.email, password: this.registerForm.password }).subscribe({
          next: res => {
            this.authApi.getProfile(res.userId).subscribe({
              next: profile => this.session.setProfile(profile),
              error: () => {}
            });
            // Step 3: Seed default categories for the new user
            this.categoriesApi.initDefaults(res.userId).subscribe({ error: () => {} });
            this.router.navigate(['/app/dashboard']);
          },
          error: () => {
            this.errorMessage = 'Account created! Please sign in.';
            this.activeTab = 'login';
            this.loginForm.email = this.registerForm.email;
            this.loading = false;
          }
        });
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Registration failed. Email may already be in use.';
        this.loading = false;
      }
    });
  }

  // Google Login

  private loadGoogleScript(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Load Google's script if not already loaded
    if (document.getElementById('google-signin-script')) {
      this.initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-signin-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogle();
    document.head.appendChild(script);
  }

  private initializeGoogle(): void {
    if (typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        // NgZone needed because Google callback runs outside Angular's zone
        this.ngZone.run(() => this.handleGoogleCallback(response));
      }
    });

    // Render the Google button in the container div
    const buttonDiv = document.getElementById('google-btn-container');
    if (buttonDiv) {
      google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with'
      });
    }
  }

  private handleGoogleCallback(response: any): void {
    if (!response?.credential) {
      this.errorMessage = 'Google sign-in failed. Please try again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Send Google ID token to your backend
    this.authApi.loginWithGoogle(response.credential).subscribe({
      next: res => {
        this.authApi.getProfile(res.userId).subscribe({
          next: profile => this.session.setProfile(profile),
          error: () => {}
        });
        // Seed default categories (safe to call even if user already has them — backend handles duplicates)
        // Seed default categories only if user has none yet
        this.categoriesApi.getCount(res.userId).subscribe({
          next: count => {
            if (count === 0) {
              this.categoriesApi.initDefaults(res.userId).subscribe({ error: () => {} });
            }
          },
          error: () => {}
        });
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Google sign-in failed. Please try again.';
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}